import { cookies } from "next/headers";
import { getSessionUser, SESSION_COOKIE } from "@/lib/auth";

/**
 * Reads the opaque, httpOnly local session cookie. Data operations must use
 * this helper rather than accepting a user ID from the client.
 */
export async function getCurrentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return getSessionUser(token);
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) throw new AuthenticationRequiredError();
  return user;
}

export class AuthenticationRequiredError extends Error {
  constructor() {
    super("Sign in is required.");
  }
}
