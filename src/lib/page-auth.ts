import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";

export async function requirePageUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}
