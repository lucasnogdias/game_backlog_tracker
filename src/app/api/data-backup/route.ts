import { NextResponse } from "next/server";
import { createDataBackup } from "@/lib/data-backup";

export async function GET() {
  const archive = await createDataBackup();
  return new NextResponse(archive.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="game-backlog-backup.zip"',
      "Cache-Control": "no-store",
    },
  });
}
