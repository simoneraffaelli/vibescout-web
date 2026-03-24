import { NextResponse } from "next/server";
import { clearAdminSession, verifyAdminSession } from "@/lib/auth";

export async function POST() {
  if (!(await verifyAdminSession())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  await clearAdminSession();
  return NextResponse.json({ ok: true });
}
