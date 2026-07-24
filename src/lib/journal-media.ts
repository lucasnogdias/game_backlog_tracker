import type {
  JournalImageAttachmentInput,
} from "@/types/journal";

export async function saveJournalFiles(
  historyEntryId: string,
  journalEntryId: string,
  gameTitle: string,
  journalEntryNumber: number,
  files: File[]
): Promise<JournalImageAttachmentInput[]> {
  if (!files.length) return [];
  if (!window.journalMedia) {
    throw new Error("Screenshot attachments are only available in the desktop app.");
  }

  const saved: JournalImageAttachmentInput[] = [];
  try {
    for (const file of files) {
      saved.push(
        await window.journalMedia.save({
          historyEntryId,
          journalEntryId,
          gameTitle,
          journalEntryNumber,
          mimeType: file.type as JournalImageAttachmentInput["mimeType"],
          data: await file.arrayBuffer(),
        })
      );
    }
    return saved;
  } catch (error) {
    await Promise.all(
      saved.map((attachment) => window.journalMedia!.remove(attachment.storageKey))
    );
    throw error;
  }
}
