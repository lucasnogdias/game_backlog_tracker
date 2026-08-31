import { NextRequest, NextResponse } from "next/server";
import { getHistoryEntryById } from "@/lib/history";
import {
  createJournalEntry,
  journalEntryNumber,
  listJournalEntries,
} from "@/lib/journal";
import type { JournalEntryInput } from "@/types/journal";
import { unauthenticatedResponse } from "@/lib/api-auth";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await unauthenticatedResponse();
  if (unauthorized) return unauthorized;
  const { id } = await params;
  const historyEntry = await getHistoryEntryById(id);

  if (!historyEntry) {
    return NextResponse.json({ error: "History entry not found." }, { status: 404 });
  }

  const entries = await listJournalEntries(id);
  return NextResponse.json(entries);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const unauthorized = await unauthenticatedResponse();
  if (unauthorized) return unauthorized;
  const { id } = await params;
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

  const entry = await createJournalEntry(id, body.content.trim());
  return NextResponse.json(
    { ...entry, journalEntryNumber: await journalEntryNumber(id) },
    { status: 201 }
  );
}
