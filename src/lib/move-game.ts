// Cross-feature move operations: transferring a game between the Backlog
// and History lists. Both directions are implemented as a single DB
// transaction (create in the target table + delete from the source table)
// so a game is never duplicated or lost if either half fails.

import { prisma } from "@/lib/prisma";
import { backlogGameToDTO } from "@/lib/backlog";
import { historyEntryToDTO } from "@/lib/history";
import type { BacklogGameDTO } from "@/types/backlog";
import type { HistoryEntryDTO, HistoryStatus } from "@/types/history";

export interface MoveToHistoryOptions {
  status: HistoryStatus;
  /** Required only when the Backlog game has more than one platform. */
  platform: string | null;
}

/**
 * Moves a Backlog game to History. Fields with no equivalent on the History
 * side (owned, estimatedHours, hype) are dropped; shared fields (title,
 * releaseDate, notes, coverImageUrl) carry over as-is.
 */
export async function moveBacklogGameToHistory(
  id: string,
  options: MoveToHistoryOptions
): Promise<HistoryEntryDTO> {
  const entry = await prisma.$transaction(async (tx) => {
    const game = await tx.backlogGame.findUniqueOrThrow({ where: { id } });

    const created = await tx.historyEntry.create({
      data: {
        userId: game.userId,
        title: game.title,
        status: options.status,
        playtimeMinutes: null,
        finishedOn: null,
        releaseDate: game.releaseDate,
        notes: game.notes,
        platform: options.platform,
        coverImageUrl: game.coverImageUrl,
      },
    });

    await tx.backlogGame.delete({ where: { id } });

    return created;
  });

  return historyEntryToDTO(entry);
}

/**
 * Moves a History entry back to the Backlog. Fields with no equivalent on
 * the Backlog side (status, playtimeMinutes, finishedOn) are dropped; shared
 * fields (title, releaseDate, notes, coverImageUrl) carry over as-is.
 * `owned` defaults to true — if it was in History, it was likely owned.
 */
export async function moveHistoryEntryToBacklog(
  id: string
): Promise<BacklogGameDTO> {
  const game = await prisma.$transaction(async (tx) => {
    const entry = await tx.historyEntry.findUniqueOrThrow({ where: { id } });

    const created = await tx.backlogGame.create({
      data: {
        userId: entry.userId,
        title: entry.title,
        owned: true,
        platforms: entry.platform ? [entry.platform] : [],
        estimatedHours: null,
        releaseDate: entry.releaseDate,
        hype: null,
        notes: entry.notes,
        coverImageUrl: entry.coverImageUrl,
      },
    });

    await tx.historyEntry.delete({ where: { id } });

    return created;
  });

  return backlogGameToDTO(game);
}
