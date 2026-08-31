import { NextResponse } from "next/server";
import { AuthenticationError } from "@/lib/auth";
import { listAccounts } from "@/lib/accounts";
import { unauthenticatedResponse } from "@/lib/api-auth";

export async function GET() {
  const unauthorized = await unauthenticatedResponse();
  if (unauthorized) return unauthorized;
  try {
    return NextResponse.json(await listAccounts());
  } catch (error) {
    const message = error instanceof AuthenticationError ? error.message : "Unable to load accounts.";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
