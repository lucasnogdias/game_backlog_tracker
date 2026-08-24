import { NextRequest, NextResponse } from "next/server";
import {
  AuthenticationError,
  createSession,
  registerAccount,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Partial<{
    username: string;
    password: string;
    displayName: string;
  }>;
  if (typeof body.username !== "string" || typeof body.password !== "string") {
    return NextResponse.json({ error: "Username and password are required." }, { status: 400 });
  }

  try {
    const user = await registerAccount(body.username, body.password, body.displayName);
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
    const message = error instanceof AuthenticationError ? error.message : "Unable to create account.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
