import { NextRequest, NextResponse } from "next/server";
import { getHistoryEntryById } from "@/lib/history";
import { updateJournalEntry, validJournalAttachments } from "@/lib/journal";
import type { JournalEntryInput } from "@/types/journal";
import { unauthenticatedResponse } from "@/lib/api-auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; journalId: string }> }
) {
  const unauthorized = await unauthenticatedResponse();
  if (unauthorized) return unauthorized;
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
  if (body.attachments !== undefined && !validJournalAttachments(body.attachments)) {
    return NextResponse.json(
      { error: "Journal image attachments are invalid." },
      { status: 400 }
    );
  }

  const entry = await updateJournalEntry(
    id,
    journalId,
    body.content.trim(),
    body.attachments
  );
  if (!entry) {
    return NextResponse.json({ error: "Journal entry not found." }, { status: 404 });
  }

  return NextResponse.json(entry);
}
