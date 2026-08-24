import { NextRequest, NextResponse } from "next/server";
import { AuthenticationError, updateOwnPassword } from "@/lib/auth";
import { unauthenticatedResponse } from "@/lib/api-auth";

export async function PATCH(request: NextRequest) {
  const unauthorized = await unauthenticatedResponse();
  if (unauthorized) return unauthorized;
  const body = (await request.json()) as {
    currentPassword?: string;
    newPassword?: string;
  };
  if (
    (body.currentPassword !== undefined && typeof body.currentPassword !== "string") ||
    (body.newPassword !== undefined && typeof body.newPassword !== "string")
  ) {
    return NextResponse.json({ error: "Password details are invalid." }, { status: 400 });
  }
  try {
    await updateOwnPassword(body.currentPassword, body.newPassword);
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof AuthenticationError ? error.message : "Unable to update password.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
