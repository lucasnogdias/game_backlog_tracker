import { NextRequest, NextResponse } from "next/server";
import { listHistoryEntries, createHistoryEntry } from "@/lib/history";
import { HISTORY_STATUSES } from "@/types/history";
import type { HistoryEntryInput } from "@/types/history";

export async function GET() {
  const entries = await listHistoryEntries();
  return NextResponse.json(entries);
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Partial<HistoryEntryInput>;

  if (!body.title || !body.title.trim()) {
    return NextResponse.json(
      { error: "Title is required." },
      { status: 400 }
    );
  }

  if (!body.status || !HISTORY_STATUSES.includes(body.status)) {
    return NextResponse.json(
      { error: "A valid status is required." },
      { status: 400 }
    );
  }

  const entry = await createHistoryEntry({
    title: body.title.trim(),
    status: body.status,
    playtimeMinutes: body.playtimeMinutes ?? null,
    finishedOn: body.finishedOn ?? null,
    releaseDate: body.releaseDate ?? null,
    notes: body.notes ?? null,
    platform: body.platform ?? null,
    coverImageUrl: body.coverImageUrl ?? null,
  });

  return NextResponse.json(entry, { status: 201 });
}

