import { redirect } from "next/navigation";
import { verifyAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // The login page handles its own auth check
  return <>{children}</>;
}
