import { NextRequest, NextResponse } from "next/server";
import {
  AuthenticationError,
  authenticateAccount,
  createSession,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Partial<{ username: string; password: string }>;
  if (
    typeof body.username !== "string" ||
    (body.password !== undefined && typeof body.password !== "string")
  ) {
    return NextResponse.json({ error: "A valid account is required." }, { status: 400 });
  }

  try {
    const user = await authenticateAccount(body.username, body.password);
    const response = NextResponse.json({
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
    });
    response.cookies.set(
      SESSION_COOKIE,
      await createSession(user.id),
      sessionCookieOptions(request.nextUrl.protocol === "https:")
    );
    return response;
  } catch (error) {
    const message = error instanceof AuthenticationError ? error.message : "Unable to sign in.";
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
