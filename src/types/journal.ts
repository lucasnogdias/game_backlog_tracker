// Shared types for immutable per-game journal entries. Dates are ISO strings
// at the server/client boundary, matching the History and Backlog conventions.

export interface JournalEntryDTO {
  id: string;
  historyEntryId: string;
  content: string;
  createdAt: string;
  attachments: JournalImageAttachmentDTO[];
}

export interface JournalImageAttachmentDTO {
  id: string;
  storageKey: string;
  originalName: string;
  mimeType: "image/png" | "image/jpeg" | "image/webp";
  size: number;
  createdAt: string;
}

export type JournalImageAttachmentInput = Omit<
  JournalImageAttachmentDTO,
  "createdAt"
>;

export interface JournalEntryInput {
  content: string;
  attachments?: JournalImageAttachmentInput[];
}
