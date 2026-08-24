import { NextResponse } from "next/server";
import { listLoginAccounts } from "@/lib/auth";

export async function GET() {
  return NextResponse.json(await listLoginAccounts());
}
