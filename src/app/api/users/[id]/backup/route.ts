import { NextResponse } from "next/server";
import { AuthenticationError } from "@/lib/auth";
import { createDataBackupForUser } from "@/lib/data-backup";
import { unauthenticatedResponse } from "@/lib/api-auth";
import { getManagedAccount } from "@/lib/accounts";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await unauthenticatedResponse();
  if (unauthorized) return unauthorized;
  try {
    const { id } = await params;
    const account = await getManagedAccount(id);
    if (!account) return NextResponse.json({ error: "Account not found." }, { status: 404 });
    const archive = await createDataBackupForUser(id);
    return new NextResponse(archive.buffer as ArrayBuffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${account.username}-game-data-backup.zip"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message = error instanceof AuthenticationError ? error.message : "Unable to create backup.";
    return NextResponse.json({ error: message }, { status: 403 });
  }
}
