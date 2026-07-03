import { NextRequest, NextResponse } from "next/server";
import { updateHistoryEntry, deleteHistoryEntry } from "@/lib/history";
import { HISTORY_STATUSES } from "@/types/history";
import type { HistoryEntryInput } from "@/types/history";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await request.json()) as Partial<HistoryEntryInput>;

  if (body.title !== undefined && !body.title.trim()) {
    return NextResponse.json(
      { error: "Title cannot be empty." },
      { status: 400 }
    );
  }

  if (body.status !== undefined && !HISTORY_STATUSES.includes(body.status)) {
    return NextResponse.json(
      { error: "A valid status is required." },
      { status: 400 }
    );
  }

  const entry = await updateHistoryEntry(id, body);
  return NextResponse.json(entry);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await deleteHistoryEntry(id);
  return NextResponse.json({ success: true });
}
