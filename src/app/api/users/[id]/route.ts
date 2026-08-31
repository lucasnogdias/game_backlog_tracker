import { NextRequest, NextResponse } from "next/server";
import { AuthenticationError } from "@/lib/auth";
import { deleteAccount, updateAccountRole } from "@/lib/accounts";
import { unauthenticatedResponse } from "@/lib/api-auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await unauthenticatedResponse();
  if (unauthorized) return unauthorized;
  const body = (await request.json()) as { role?: string };
  if (body.role !== "admin" && body.role !== "user") {
    return NextResponse.json({ error: "A valid account role is required." }, { status: 400 });
  }

  try {
    const { id } = await params;
    return NextResponse.json(await updateAccountRole(id, body.role));
  } catch (error) {
    const message = error instanceof AuthenticationError ? error.message : "Unable to update account.";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await unauthenticatedResponse();
  if (unauthorized) return unauthorized;
  try {
    const { id } = await params;
    return NextResponse.json(await deleteAccount(id));
  } catch (error) {
    const message = error instanceof AuthenticationError ? error.message : "Unable to delete account.";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
