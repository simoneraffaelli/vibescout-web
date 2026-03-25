import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authenticateDevice } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";

/** POST /api/heartbeat — device pings to signal it's online */
export async function POST(req: NextRequest) {
  const auth = await authenticateDevice(req);
  if (auth.error) return auth.error;

  // Rate limit: 2 heartbeats per minute per device
  const rl = rateLimit(`heartbeat:${auth.device.id}`, 2, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      {
        status: 429,
        headers: { "Retry-After": String(Math.ceil(rl.retryAfterMs / 1000)) },
      }
    );
  }

  await prisma.device.update({
    where: { id: auth.device.id },
    data: { lastSeenAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
