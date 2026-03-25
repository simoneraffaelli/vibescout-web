import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateDevice } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { fetchCoverUrl } from "@/lib/musicbrainz";

const MAX_TITLE_LENGTH = 500;
const MAX_ARTIST_LENGTH = 500;
const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

/** Ignore duplicate submissions of the same song from the same device within this window. */
const DEDUP_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const limit = Math.min(
    Math.max(Number(url.searchParams.get("limit")) || DEFAULT_PAGE_SIZE, 1),
    MAX_PAGE_SIZE
  );
  const cursor = Number(url.searchParams.get("cursor")) || undefined;

  const tracks = await prisma.track.findMany({
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    orderBy: { spottedAt: "desc" },
    include: { device: { select: { name: true } } },
  });

  const hasMore = tracks.length > limit;
  const data = hasMore ? tracks.slice(0, limit) : tracks;
  const nextCursor = hasMore ? data[data.length - 1].id : null;

  return NextResponse.json({ data, nextCursor });
}

export async function POST(req: NextRequest) {
  // Authenticate device
  const auth = await authenticateDevice(req);
  if (auth.error) return auth.error;

  // Rate limit: 30 tracks per minute per device
  const rl = rateLimit(`tracks:${auth.device.id}`, 30, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) },
      }
    );
  }

  // Parse body safely
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  const artist = typeof raw.artist === "string" ? raw.artist.trim() : "";

  if (!title || !artist) {
    return NextResponse.json(
      { error: "title and artist are required" },
      { status: 400 }
    );
  }

  if (title.length > MAX_TITLE_LENGTH || artist.length > MAX_ARTIST_LENGTH) {
    return NextResponse.json(
      { error: `title and artist must be under ${MAX_TITLE_LENGTH} characters` },
      { status: 400 }
    );
  }

  // ── Deduplication: reject if this device spotted the same song recently ──
  const recent = await prisma.track.findFirst({
    where: {
      deviceId: auth.device.id,
      title: { equals: title },
      artist: { equals: artist },
      spottedAt: { gte: new Date(Date.now() - DEDUP_WINDOW_MS) },
    },
    orderBy: { spottedAt: "desc" },
    select: { id: true, spottedAt: true },
  });

  if (recent) {
    // Still update lastSeenAt so the device stays "online"
    await prisma.device.update({
      where: { id: auth.device.id },
      data: { lastSeenAt: new Date() },
    });

    return NextResponse.json(
      {
        duplicate: true,
        message: "Track already spotted recently — skipped",
        existingId: recent.id,
      },
      { status: 200 }
    );
  }

  // Fetch cover art from MusicBrainz / Cover Art Archive
  const coverUrl = await fetchCoverUrl(title, artist);

  const [track] = await Promise.all([
    prisma.track.create({
      data: { title, artist, coverUrl, deviceId: auth.device.id },
    }),
    // Piggyback: update lastSeenAt on every track submission
    prisma.device.update({
      where: { id: auth.device.id },
      data: { lastSeenAt: new Date() },
    }),
  ]);

  return NextResponse.json(track, { status: 201 });
}
