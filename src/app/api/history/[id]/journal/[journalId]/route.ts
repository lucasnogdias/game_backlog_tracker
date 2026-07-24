import { NextRequest, NextResponse } from "next/server";
import { getHistoryEntryById } from "@/lib/history";
import { updateJournalEntry } from "@/lib/journal";
import type { JournalEntryInput } from "@/types/journal";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; journalId: string }> }
) {
  const { id, journalId } = await params;
  const historyEntry = await getHistoryEntryById(id);
  if (!historyEntry) {
    return NextResponse.json({ error: "History entry not found." }, { status: 404 });
  }

  const body = (await request.json()) as Partial<JournalEntryInput>;
  if (!body.content || !body.content.trim()) {
    return NextResponse.json(
      { error: "Journal entry content is required." },
      { status: 400 }
    );
  }

  const entry = await updateJournalEntry(id, journalId, body.content.trim());
  if (!entry) {
    return NextResponse.json({ error: "Journal entry not found." }, { status: 404 });
  }

  return NextResponse.json(entry);
}
