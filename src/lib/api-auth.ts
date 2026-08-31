import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";

export async function unauthenticatedResponse() {
  return (await getCurrentUser())
    ? null
    : NextResponse.json({ error: "Sign in is required." }, { status: 401 });
}
