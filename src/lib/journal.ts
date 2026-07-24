import { prisma } from "@/lib/prisma";
import type {
  JournalEntry,
  JournalImageAttachment,
} from "@/generated/prisma/client";
import type {
  JournalEntryDTO,
  JournalImageAttachmentDTO,
  JournalImageAttachmentInput,
} from "@/types/journal";

const IMAGE_MIME_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

type JournalEntryWithAttachments = JournalEntry & {
  attachments: JournalImageAttachment[];
};

export function validJournalAttachments(
  value: unknown
): value is JournalImageAttachmentInput[] {
  return (
    Array.isArray(value) &&
    value.every(
      (attachment) =>
        attachment &&
        typeof attachment === "object" &&
        typeof attachment.id === "string" &&
        typeof attachment.storageKey === "string" &&
        typeof attachment.originalName === "string" &&
        IMAGE_MIME_TYPES.has(
          (attachment as JournalImageAttachmentInput).mimeType
        ) &&
        Number.isInteger((attachment as JournalImageAttachmentInput).size) &&
        (attachment as JournalImageAttachmentInput).size > 0 &&
        (attachment as JournalImageAttachmentInput).size <= MAX_IMAGE_SIZE
    )
  );
}

export function journalEntryToDTO(
  entry: JournalEntryWithAttachments
): JournalEntryDTO {
  return {
    id: entry.id,
    historyEntryId: entry.historyEntryId,
    content: entry.content,
    createdAt: entry.createdAt.toISOString(),
    attachments: entry.attachments.map((attachment) => ({
      id: attachment.id,
      storageKey: attachment.storageKey,
      originalName: attachment.originalName,
      mimeType: attachment.mimeType as JournalImageAttachmentDTO["mimeType"],
      size: attachment.size,
      createdAt: attachment.createdAt.toISOString(),
    })),
  };
}

export async function listJournalEntries(
  historyEntryId: string
): Promise<JournalEntryDTO[]> {
  const entries = await prisma.journalEntry.findMany({
    where: { historyEntryId },
    orderBy: { createdAt: "asc" },
    include: { attachments: { orderBy: { createdAt: "asc" } } },
  });

  return entries.map(journalEntryToDTO);
}

export async function createJournalEntry(
  historyEntryId: string,
  content: string
): Promise<JournalEntryDTO> {
  const entry = await prisma.journalEntry.create({
    data: { historyEntryId, content },
    include: { attachments: { orderBy: { createdAt: "asc" } } },
  });

  return journalEntryToDTO(entry);
}

export async function journalEntryNumber(historyEntryId: string): Promise<number> {
  return prisma.journalEntry.count({ where: { historyEntryId } });
}

export async function updateJournalEntry(
  historyEntryId: string,
  id: string,
  content: string,
  attachments?: JournalImageAttachmentInput[]
): Promise<JournalEntryDTO | null> {
  const existing = await prisma.journalEntry.findFirst({
    where: { id, historyEntryId },
  });
  if (!existing) return null;

  const entry = await prisma.journalEntry.update({
    where: { id },
    data: {
      content,
      ...(attachments && {
        attachments: {
          deleteMany: {},
          create: attachments,
        },
      }),
    },
    include: { attachments: { orderBy: { createdAt: "asc" } } },
  });
  return journalEntryToDTO(entry);
}
