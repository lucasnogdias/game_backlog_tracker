import { prisma } from "@/lib/prisma";
import { getOrCreateDefaultUser } from "@/lib/current-user";
import type { BacklogGameDTO, BacklogGameInput } from "@/types/backlog";
import type { BacklogGame } from "@/generated/prisma/client";

function toDTO(game: BacklogGame): BacklogGameDTO {
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
  const user = await getOrCreateDefaultUser();
  const games = await prisma.backlogGame.findMany({
    where: { userId: user.id },
    // Default sort: highest hype first; UI can re-sort client-side.
    orderBy: { hype: "desc" },
  });
  return games.map(toDTO);
}

export async function createBacklogGame(
  input: BacklogGameInput
): Promise<BacklogGameDTO> {
  const user = await getOrCreateDefaultUser();
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
  return toDTO(game);
}

export async function updateBacklogGame(
  id: string,
  input: Partial<BacklogGameInput>
): Promise<BacklogGameDTO> {
  const game = await prisma.backlogGame.update({
    where: { id },
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
  return toDTO(game);
}

export async function deleteBacklogGame(id: string): Promise<void> {
  await prisma.backlogGame.delete({ where: { id } });
}
