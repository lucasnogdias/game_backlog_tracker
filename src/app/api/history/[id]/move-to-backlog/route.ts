import { NextResponse } from "next/server";
import { getHistoryEntryById } from "@/lib/history";
import { moveHistoryEntryToBacklog } from "@/lib/move-game";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const entry = await getHistoryEntryById(id);
  if (!entry) {
    return NextResponse.json({ error: "Entry not found." }, { status: 404 });
  }

  const game = await moveHistoryEntryToBacklog(id);

  return NextResponse.json(game, { status: 201 });
}
