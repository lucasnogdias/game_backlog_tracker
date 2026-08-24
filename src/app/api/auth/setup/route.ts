import { NextResponse } from "next/server";
import { needsAccountSetup } from "@/lib/auth";

export async function GET() {
  return NextResponse.json({ needsAccountSetup: await needsAccountSetup() });
}
