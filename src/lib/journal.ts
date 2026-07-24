import { prisma } from "@/lib/prisma";
import type { JournalEntry } from "@/generated/prisma/client";
import type { JournalEntryDTO } from "@/types/journal";

export function journalEntryToDTO(entry: JournalEntry): JournalEntryDTO {
  return {
    id: entry.id,
    historyEntryId: entry.historyEntryId,
    content: entry.content,
    createdAt: entry.createdAt.toISOString(),
  };
}

export async function listJournalEntries(
  historyEntryId: string
): Promise<JournalEntryDTO[]> {
  const entries = await prisma.journalEntry.findMany({
    where: { historyEntryId },
    orderBy: { createdAt: "asc" },
  });

  return entries.map(journalEntryToDTO);
}

export async function createJournalEntry(
  historyEntryId: string,
  content: string
): Promise<JournalEntryDTO> {
  const entry = await prisma.journalEntry.create({
    data: { historyEntryId, content },
  });

  return journalEntryToDTO(entry);
}

export async function updateJournalEntry(
  historyEntryId: string,
  id: string,
  content: string
): Promise<JournalEntryDTO | null> {
  const existing = await prisma.journalEntry.findFirst({
    where: { id, historyEntryId },
  });
  if (!existing) return null;

  const entry = await prisma.journalEntry.update({
    where: { id },
    data: { content },
  });
  return journalEntryToDTO(entry);
}
