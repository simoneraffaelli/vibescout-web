import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyAdminSession } from "@/lib/auth";

const MAX_NAME_LENGTH = 100;

/** PATCH /api/admin/devices/[id] — toggle enabled, rename */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const deviceId = Number(id);
  if (isNaN(deviceId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const raw = body as Record<string, unknown>;
  const data: { name?: string; enabled?: boolean } = {};

  if (typeof raw.name === "string" && raw.name.trim()) {
    const name = raw.name.trim();
    if (name.length > MAX_NAME_LENGTH) {
      return NextResponse.json(
        { error: `name must be under ${MAX_NAME_LENGTH} characters` },
        { status: 400 }
      );
    }
    data.name = name;
  }
  if (typeof raw.enabled === "boolean") {
    data.enabled = raw.enabled;
  }

  const device = await prisma.device.update({
    where: { id: deviceId },
    data,
  });

  return NextResponse.json(device);
}

/** DELETE /api/admin/devices/[id] — remove a device */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const deviceId = Number(id);
  if (isNaN(deviceId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  await prisma.device.delete({ where: { id: deviceId } });
  return NextResponse.json({ ok: true });
}
