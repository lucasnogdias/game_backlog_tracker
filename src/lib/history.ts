import { prisma } from "@/lib/prisma";
import { getOrCreateDefaultUser } from "@/lib/current-user";
import type { HistoryEntryDTO, HistoryEntryInput } from "@/types/history";
import type { HistoryEntry } from "@/generated/prisma/client";

export function historyEntryToDTO(entry: HistoryEntry): HistoryEntryDTO {
  return {
    id: entry.id,
    title: entry.title,
    // Cast is safe: `status` is only ever written from HISTORY_STATUSES.
    status: entry.status as HistoryEntryDTO["status"],
    playtimeMinutes: entry.playtimeMinutes,
    finishedOn: entry.finishedOn ? entry.finishedOn.toISOString() : null,
    releaseDate: entry.releaseDate ? entry.releaseDate.toISOString() : null,
    notes: entry.notes,
    platform: entry.platform,
    coverImageUrl: entry.coverImageUrl,
    createdAt: entry.createdAt.toISOString(),
    updatedAt: entry.updatedAt.toISOString(),
  };
}

export async function listHistoryEntries(): Promise<HistoryEntryDTO[]> {
  const user = await getOrCreateDefaultUser();
  const entries = await prisma.historyEntry.findMany({
    where: { userId: user.id },
    // Default sort: oldest added-to-History first (UI can re-sort/toggle).
    orderBy: { createdAt: "asc" },
  });
  return entries.map(historyEntryToDTO);
}

export async function createHistoryEntry(
  input: HistoryEntryInput
): Promise<HistoryEntryDTO> {
  const user = await getOrCreateDefaultUser();
  const entry = await prisma.historyEntry.create({
    data: {
      userId: user.id,
      title: input.title,
      status: input.status,
      playtimeMinutes: input.playtimeMinutes,
      finishedOn: input.finishedOn ? new Date(input.finishedOn) : null,
      releaseDate: input.releaseDate ? new Date(input.releaseDate) : null,
      notes: input.notes,
      platform: input.platform,
      coverImageUrl: input.coverImageUrl,
    },
  });
  return historyEntryToDTO(entry);
}

export async function updateHistoryEntry(
  id: string,
  input: Partial<HistoryEntryInput>
): Promise<HistoryEntryDTO> {
  const entry = await prisma.historyEntry.update({
    where: { id },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.playtimeMinutes !== undefined && {
        playtimeMinutes: input.playtimeMinutes,
      }),
      ...(input.finishedOn !== undefined && {
        finishedOn: input.finishedOn ? new Date(input.finishedOn) : null,
      }),
      ...(input.releaseDate !== undefined && {
        releaseDate: input.releaseDate ? new Date(input.releaseDate) : null,
      }),
      ...(input.notes !== undefined && { notes: input.notes }),
      ...(input.platform !== undefined && { platform: input.platform }),
      ...(input.coverImageUrl !== undefined && {
        coverImageUrl: input.coverImageUrl,
      }),
    },
  });
  return historyEntryToDTO(entry);
}

export async function deleteHistoryEntry(id: string): Promise<void> {
  await prisma.historyEntry.delete({ where: { id } });
}

export async function getHistoryEntryById(
  id: string
): Promise<HistoryEntryDTO | null> {
  const user = await getOrCreateDefaultUser();
  const entry = await prisma.historyEntry.findFirst({
    where: { id, userId: user.id },
  });
  return entry ? historyEntryToDTO(entry) : null;
}
