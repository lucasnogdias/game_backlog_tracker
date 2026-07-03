import { NextRequest, NextResponse } from "next/server";
import { listBacklogGames, createBacklogGame } from "@/lib/backlog";
import type { BacklogGameInput } from "@/types/backlog";

export async function GET() {
  const games = await listBacklogGames();
  return NextResponse.json(games);
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Partial<BacklogGameInput>;

  if (!body.title || !body.title.trim()) {
    return NextResponse.json(
      { error: "Title is required." },
      { status: 400 }
    );
  }

  const game = await createBacklogGame({
    title: body.title.trim(),
    owned: body.owned ?? false,
    platforms: body.platforms ?? [],
    estimatedHours: body.estimatedHours ?? null,
    releaseDate: body.releaseDate ?? null,
    hype: body.hype ?? null,
    notes: body.notes ?? null,
    coverImageUrl: body.coverImageUrl ?? null,
  });

  return NextResponse.json(game, { status: 201 });
}
