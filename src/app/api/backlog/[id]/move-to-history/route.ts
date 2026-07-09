import { NextRequest, NextResponse } from "next/server";
import { getBacklogGameById } from "@/lib/backlog";
import { moveBacklogGameToHistory } from "@/lib/move-game";
import { HISTORY_STATUSES } from "@/types/history";
import type { HistoryStatus } from "@/types/history";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await request.json()) as {
    status?: HistoryStatus;
    platform?: string | null;
  };

  if (!body.status || !HISTORY_STATUSES.includes(body.status)) {
    return NextResponse.json(
      { error: "A valid status is required." },
      { status: 400 }
    );
  }

  const game = await getBacklogGameById(id);
  if (!game) {
    return NextResponse.json({ error: "Game not found." }, { status: 404 });
  }

  if (game.platforms.length > 1 && !body.platform) {
    return NextResponse.json(
      { error: "A platform must be selected when more than one is set." },
      { status: 400 }
    );
  }

  const platform =
    body.platform ?? (game.platforms.length === 1 ? game.platforms[0] : null);

  const entry = await moveBacklogGameToHistory(id, {
    status: body.status,
    platform,
  });

  return NextResponse.json(entry, { status: 201 });
}
