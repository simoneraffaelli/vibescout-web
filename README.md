inspired by [BopSpotter](https://walzr.com/bop-spotter) by [Riley Waltz](https://x.com/rtwlz) \
uses: 
 - [SongRec](https://github.com/marin-m/SongRec) for fingerprinting
 - [Shazam](https://www.shazam.com/) for recognizing

---

# VibeScout Web — Usage Guide

VibeScout Web is a self-hosted web dashboard and API for collecting songs recognized by [VibeScout](https://github.com/simoneraffaelli/vibescout-app) (or any compatible client). Devices push recognized tracks via a REST API, and users browse the live feed from a web UI. An admin panel manages devices and their API keys.

---

## Architecture Overview

| Component | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Database | SQLite via better-sqlite3 + Prisma ORM |
| Styling | Tailwind CSS v4 |
| Auth | HMAC-signed cookie (admin) / hashed API keys (devices) |
| Rate Limiting | In-memory sliding window |

### Data Model

- **Device** — a registered client (phone, Raspberry Pi, etc.). Each has a hashed API key and can be enabled/disabled.
- **Track** — a recognized song, tied to the device that spotted it. Contains `title`, `artist`, and `spottedAt` timestamp. Cascade-deletes when its device is removed.

---

## Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `ADMIN_PASSWORD` | **Yes** (production) | *none* | Password for the admin login page. If unset, admin login will always fail. |
| `ADMIN_SECRET` | **Yes** (production) | Random ephemeral value | Secret key used to HMAC-sign admin session cookies. Must be a strong random string (≥32 characters). If unset, a random value is generated at startup — sessions will not survive server restarts. |
| `NODE_ENV` | Recommended | `development` | Set to `production` in production. Controls: secure cookies (`Secure` flag), CSP strictness, Prisma client caching. |

### Generating secrets

```bash
# Generate a 64-character hex secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Example `.env.local`

```env
ADMIN_PASSWORD=your-strong-admin-password
ADMIN_SECRET=a64charhexstringgeneratedabove...
```

---

## Getting Started (Development)

```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma client & run migrations
npx prisma migrate deploy

# 3. Create .env.local with your ADMIN_PASSWORD (see above)

# 4. Start the dev server
npm run dev
```

The app runs at `http://localhost:3000`. The SQLite database is stored at `dev.db` in the project root.

---

## Production Deployment

```bash
# 1. Set environment variables (ADMIN_PASSWORD, ADMIN_SECRET, NODE_ENV=production)

# 2. Install dependencies & build
npm install
npm run build

# 3. Apply database migrations
npx prisma migrate deploy

# 4. Start the server
npm start
```

### Production Considerations

- **Database location** — SQLite persists to `dev.db` in the working directory. Ensure this path has write permissions and is included in backups.
- **Rate limiting** — The rate limiter is in-memory. In a multi-process or multi-instance deployment, it won't share state across workers. Swap to Redis if running multiple instances.
- **CSP headers** — In production, the Content-Security-Policy header does **not** include `unsafe-eval`. In development it does (React requires it for debugging).
- **CSRF protection** — All mutating requests to `/api/admin/*` verify the `Origin` header matches the `Host` header.
- **Session cookies** — In production, cookies are set with `Secure`, `HttpOnly`, `SameSite=Strict`, and a 24-hour expiry. You must serve the app over HTTPS.

---

## User Perspective (Public Feed)

### Browsing Tracks

Navigate to the root URL (`/`). The homepage displays the 100 most recently spotted tracks in reverse chronological order. Each entry shows:

- **Title** and **Artist**
- **Device name** that spotted the track
- **Timestamp** of when it was recognized

No login or authentication is required to view the feed.

### API — Fetching Tracks

```
GET /api/tracks?limit=50&cursor=123
```

| Parameter | Type | Default | Description |
|---|---|---|---|
| `limit` | number | 50 | Number of tracks to return (1–200) |
| `cursor` | number | — | ID of the last track from the previous page (for pagination) |

**Response:**

```json
{
  "data": [
    {
      "id": 42,
      "title": "Bohemian Rhapsody",
      "artist": "Queen",
      "spottedAt": "2026-03-24T12:00:00.000Z",
      "device": { "name": "Living Room Pi" }
    }
  ],
  "nextCursor": 41
}
```

Pass `nextCursor` as the `cursor` parameter in the next request to paginate.

---

## Device Perspective (Pushing Tracks)

Devices authenticate via API key. The admin creates a device in the dashboard, and the generated API key is used by the device to push recognized tracks.

### Submitting a Track

```
POST /api/tracks
Authorization: Bearer srk_<your-api-key>
Content-Type: application/json

{
  "title": "Bohemian Rhapsody",
  "artist": "Queen"
}
```

**Constraints:**
- `title` and `artist` are required, non-empty strings (max 500 characters each).
- Rate limited to **30 requests per minute** per device.

**Success response** (`201`):

```json
{
  "id": 42,
  "title": "Bohemian Rhapsody",
  "artist": "Queen",
  "spottedAt": "2026-03-24T12:00:00.000Z",
  "deviceId": 1
}
```

**Error responses:**

| Status | Meaning |
|---|---|
| `400` | Missing/invalid JSON body, or missing `title`/`artist` |
| `401` | Missing `Authorization` header, or API key invalid/disabled |
| `429` | Rate limit exceeded (check `Retry-After` header) |

---

## Admin Perspective

### Logging In

1. Navigate to `/admin`.
2. Enter the `ADMIN_PASSWORD` you set in your environment.
3. On success, you are redirected to `/admin/devices`.

Login is rate limited to **5 attempts per minute** per IP address.

### Managing Devices

After logging in, the **Device Management** page (`/admin/devices`) lets you:

#### Add a Device

1. Enter a descriptive name (e.g., "Kitchen Raspberry Pi").
2. Click **Add Device**.
3. **Copy the API key immediately** — it is shown only once and is never stored in plaintext. Only a SHA-256 hash and a 12-character prefix are saved.

#### Enable / Disable a Device

Click the **Disable** button next to a device to revoke its access without deleting it. Disabled devices get `401 Unauthorized` when they try to push tracks. Click **Enable** to re-activate.

#### Delete a Device

Click **Delete** to permanently remove a device and **all of its tracks** (cascade delete). This action is irreversible.

#### View Device Info

Each device card shows:
- **Name** and **status** (Active / Disabled)
- **Track count** — total songs spotted by this device
- **Created date**
- **API key prefix** — the first 12 characters for identification (e.g., `srk_a1b2c3d4…`)

### Logging Out

Click **Logout** in the top-right corner. The session cookie is cleared server-side.

### Admin API Reference

All admin endpoints require a valid session cookie (set by the login flow).

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/admin/login` | Authenticate with `{ "password": "..." }` |
| `POST` | `/api/admin/logout` | Clear admin session |
| `GET` | `/api/admin/devices` | List all devices (masked keys) |
| `POST` | `/api/admin/devices` | Create device: `{ "name": "..." }` → returns full API key |
| `PATCH` | `/api/admin/devices/:id` | Update device: `{ "name?": "...", "enabled?": true/false }` |
| `DELETE` | `/api/admin/devices/:id` | Delete device and all its tracks |

---

## Security Summary

| Feature | Implementation |
|---|---|
| Admin password | Compared with timing-safe equality against `ADMIN_PASSWORD` env var |
| Admin session | HMAC-SHA256 signed cookie (`admin:<expiry>.<signature>`), 24h TTL |
| Cookies | `HttpOnly`, `SameSite=Strict`, `Secure` (production only) |
| API keys | SHA-256 hashed before storage; plaintext shown once at creation |
| CSRF | Origin header checked against Host on admin mutations |
| Rate limiting | 5 login attempts/min/IP, 30 track submissions/min/device |
| Security headers | `X-Content-Type-Options`, `X-Frame-Options: DENY`, `HSTS`, `Referrer-Policy`, `CSP` |
| Input validation | Max lengths enforced on all string fields; JSON parsing errors handled |

---

## Quick Reference: Example Device Script

A minimal shell script to push a track from a device:

```bash
#!/bin/bash
API_KEY="srk_your_key_here"
HOST="https://your-domain-web.example.com"

curl -X POST "$HOST/api/tracks" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"title\": \"$1\", \"artist\": \"$2\"}"
```

Usage: `./push-track.sh "Bohemian Rhapsody" "Queen"`
