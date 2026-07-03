import { NextRequest, NextResponse } from "next/server";
import { updateBacklogGame, deleteBacklogGame } from "@/lib/backlog";
import type { BacklogGameInput } from "@/types/backlog";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = (await request.json()) as Partial<BacklogGameInput>;

  if (body.title !== undefined && !body.title.trim()) {
    return NextResponse.json(
      { error: "Title cannot be empty." },
      { status: 400 }
    );
  }

  const game = await updateBacklogGame(id, body);
  return NextResponse.json(game);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await deleteBacklogGame(id);
  return NextResponse.json({ success: true });
}
