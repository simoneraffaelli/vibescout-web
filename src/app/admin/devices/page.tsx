import { redirect } from "next/navigation";
import { verifyAdminSession } from "@/lib/auth";
import DevicesClient from "./devices-client";

export const dynamic = "force-dynamic";

export default async function DevicesPage() {
  const isAdmin = await verifyAdminSession();
  if (!isAdmin) redirect("/admin");

  return <DevicesClient />;
}
