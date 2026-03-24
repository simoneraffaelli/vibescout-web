import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { prisma } from "./prisma";

const ADMIN_SECRET =
  process.env.ADMIN_SECRET ||
  (() => {
    console.warn("⚠ ADMIN_SECRET is not set — using random ephemeral secret (sessions won't survive restarts)");
    return crypto.randomBytes(32).toString("hex");
  })();
const COOKIE_NAME = "vibescout_admin";

// ── Helpers ──────────────────────────────────────────────

/** Timing-safe string comparison. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

/** HMAC-SHA256 sign a value. */
function sign(value: string): string {
  return crypto
    .createHmac("sha256", ADMIN_SECRET)
    .update(value)
    .digest("hex");
}

/** SHA-256 hash an API key for storage/lookup. */
export function hashApiKey(apiKey: string): string {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
}

/** Generate a new random API key. */
export function generateApiKey(): string {
  return `srk_${crypto.randomBytes(24).toString("hex")}`;
}

// ── Admin session ────────────────────────────────────────

/** Build a signed admin session token + cookie options (valid for 24h). */
export function buildAdminSessionCookie() {
  const expires = Date.now() + 86_400_000;
  const payload = `admin:${expires}`;
  const token = `${payload}.${sign(payload)}`;

  return {
    name: COOKIE_NAME,
    value: token,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax" as const,
      path: "/",
      maxAge: 86_400,
    },
  };
}

/** Verify the admin session cookie. Returns true if valid. */
export async function verifyAdminSession(): Promise<boolean> {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (!token) return false;

  const dotIndex = token.lastIndexOf(".");
  if (dotIndex === -1) return false;

  const payload = token.slice(0, dotIndex);
  const sig = token.slice(dotIndex + 1);

  if (!safeEqual(sign(payload), sig)) return false;

  const expires = Number(payload.split(":")[1]);
  return Date.now() < expires;
}

/** Clear the admin session cookie. */
export async function clearAdminSession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

/** Verify admin password with timing-safe comparison. */
export function verifyAdminPassword(password: string): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  return safeEqual(password, expected);
}

// ── Device auth ──────────────────────────────────────────

/**
 * Authenticate a device API request via `Authorization: Bearer <apiKey>`.
 * The key is hashed before lookup — plaintext keys never touch the DB.
 */
export async function authenticateDevice(
  req: NextRequest
): Promise<
  | { device: { id: number; name: string }; error?: never }
  | { device?: never; error: NextResponse }
> {
  const header = req.headers.get("authorization") ?? "";
  const apiKey = header.startsWith("Bearer ") ? header.slice(7).trim() : "";

  if (!apiKey) {
    return {
      error: NextResponse.json(
        { error: "Missing Authorization header" },
        { status: 401 }
      ),
    };
  }

  const apiKeyHash = hashApiKey(apiKey);
  const device = await prisma.device.findUnique({ where: { apiKeyHash } });

  if (!device || !device.enabled) {
    return {
      error: NextResponse.json(
        { error: "Invalid or disabled API key" },
        { status: 401 }
      ),
    };
  }

  return { device: { id: device.id, name: device.name } };
}
