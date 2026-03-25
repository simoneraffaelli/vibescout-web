import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminSession, generateApiKey, hashApiKey } from "@/lib/auth";

const MAX_NAME_LENGTH = 100;

/** GET  /api/admin/devices — list all devices (masked keys only) */
export async function GET() {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const devices = await prisma.device.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      apiKeyPrefix: true,
      enabled: true,
      createdAt: true,
      lastSeenAt: true,
      _count: { select: { tracks: true } },
    },
  });

  return NextResponse.json(devices);
}

/** POST /api/admin/devices — create a new device */
export async function POST(req: NextRequest) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  const name = typeof raw.name === "string" ? raw.name.trim() : "";

  if (!name) {
    return NextResponse.json(
      { error: "name is required" },
      { status: 400 }
    );
  }

  if (name.length > MAX_NAME_LENGTH) {
    return NextResponse.json(
      { error: `name must be under ${MAX_NAME_LENGTH} characters` },
      { status: 400 }
    );
  }

  const apiKey = generateApiKey();
  const device = await prisma.device.create({
    data: {
      name,
      apiKeyHash: hashApiKey(apiKey),
      apiKeyPrefix: apiKey.slice(0, 12) + "…",
    },
  });

  // Return the full key ONLY on creation — it is never stored or shown again
  return NextResponse.json(
    { id: device.id, name: device.name, apiKey },
    { status: 201 }
  );
}
