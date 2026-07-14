import { NextRequest, NextResponse } from "next/server";
import { applyDataBackup, parseDataBackup, type BackupResolutions } from "@/lib/data-backup";

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get("archive") ?? form.get("file");
    const rawResolutions = form.get("resolutions");
    if (!(file instanceof File) || typeof rawResolutions !== "string") {
      return NextResponse.json({ error: "An archive file and resolutions are required." }, { status: 400 });
    }
    const resolutions = JSON.parse(rawResolutions) as BackupResolutions;
    const backup = parseDataBackup(new Uint8Array(await file.arrayBuffer()));
    return NextResponse.json(await applyDataBackup(backup, resolutions));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to apply archive." }, { status: 400 });
  }
}
