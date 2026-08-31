import { NextResponse } from "next/server";
import { createDataBackup } from "@/lib/data-backup";
import { unauthenticatedResponse } from "@/lib/api-auth";

export async function GET() {
  const unauthorized = await unauthenticatedResponse();
  if (unauthorized) return unauthorized;
  const archive = await createDataBackup();
  return new NextResponse(archive.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="game-backlog-backup.zip"',
      "Cache-Control": "no-store",
    },
  });
}
