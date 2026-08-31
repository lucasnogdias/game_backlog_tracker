import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { AuthClient } from "@/components/auth/AuthClient";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/backlog");
  return <AuthClient />;
}
