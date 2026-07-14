import { NextRequest, NextResponse } from "next/server";
import { parseDataBackup, previewDataBackup } from "@/lib/data-backup";

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData();
    const file = form.get("archive") ?? form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "An archive file is required." }, { status: 400 });
    const backup = parseDataBackup(new Uint8Array(await file.arrayBuffer()));
    return NextResponse.json(await previewDataBackup(backup));
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to read archive." }, { status: 400 });
  }
}
