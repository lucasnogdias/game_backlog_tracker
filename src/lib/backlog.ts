import { prisma } from "@/lib/prisma";
import { requireCurrentUser } from "@/lib/current-user";
import type { BacklogGameDTO, BacklogGameInput } from "@/types/backlog";
import type { BacklogGame } from "@/generated/prisma/client";

export function backlogGameToDTO(game: BacklogGame): BacklogGameDTO {
  return {
    id: game.id,
    title: game.title,
    owned: game.owned,
    platforms: Array.isArray(game.platforms) ? (game.platforms as string[]) : [],
    estimatedHours: game.estimatedHours,
    releaseDate: game.releaseDate ? game.releaseDate.toISOString() : null,
    hype: game.hype,
    notes: game.notes,
    coverImageUrl: game.coverImageUrl,
    createdAt: game.createdAt.toISOString(),
    updatedAt: game.updatedAt.toISOString(),
  };
}

export async function listBacklogGames(): Promise<BacklogGameDTO[]> {
  const user = await requireCurrentUser();
  const games = await prisma.backlogGame.findMany({
    where: { userId: user.id },
    // Default sort: highest hype first; UI can re-sort client-side.
    orderBy: { hype: "desc" },
  });
  return games.map(backlogGameToDTO);
}

export async function createBacklogGame(
  input: BacklogGameInput
): Promise<BacklogGameDTO> {
  const user = await requireCurrentUser();
  const game = await prisma.backlogGame.create({
    data: {
      userId: user.id,
      title: input.title,
      owned: input.owned,
      platforms: input.platforms,
      estimatedHours: input.estimatedHours,
      releaseDate: input.releaseDate ? new Date(input.releaseDate) : null,
      hype: input.hype,
      notes: input.notes,
      coverImageUrl: input.coverImageUrl,
    },
  });
  return backlogGameToDTO(game);
}

export async function updateBacklogGame(
  id: string,
  input: Partial<BacklogGameInput>
): Promise<BacklogGameDTO> {
  const user = await requireCurrentUser();
  const existing = await prisma.backlogGame.findFirst({ where: { id, userId: user.id } });
  if (!existing) throw new Error("Backlog game not found.");
  const game = await prisma.backlogGame.update({
    where: { id: existing.id },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.owned !== undefined && { owned: input.owned }),
      ...(input.platforms !== undefined && { platforms: input.platforms }),
      ...(input.estimatedHours !== undefined && {
        estimatedHours: input.estimatedHours,
      }),
      ...(input.releaseDate !== undefined && {
        releaseDate: input.releaseDate ? new Date(input.releaseDate) : null,
      }),
      ...(input.hype !== undefined && { hype: input.hype }),
      ...(input.notes !== undefined && { notes: input.notes }),
      ...(input.coverImageUrl !== undefined && {
        coverImageUrl: input.coverImageUrl,
      }),
    },
  });
  return backlogGameToDTO(game);
}

export async function deleteBacklogGame(id: string): Promise<void> {
  const user = await requireCurrentUser();
  await prisma.backlogGame.deleteMany({ where: { id, userId: user.id } });
}

export async function getBacklogGameById(
  id: string
): Promise<BacklogGameDTO | null> {
  const user = await requireCurrentUser();
  const game = await prisma.backlogGame.findFirst({ where: { id, userId: user.id } });
  return game ? backlogGameToDTO(game) : null;
}
