import { NextRequest, NextResponse } from "next/server";
import { deleteSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  await deleteSession(request.cookies.get(SESSION_COOKIE)?.value);
  const response = NextResponse.json({ success: true });
  response.cookies.set(SESSION_COOKIE, "", {
    ...sessionCookieOptions(request.nextUrl.protocol === "https:"),
    expires: new Date(0),
  });
  return response;
}
