// Shared types for immutable per-game journal entries. Dates are ISO strings
// at the server/client boundary, matching the History and Backlog conventions.

export interface JournalEntryDTO {
  id: string;
  historyEntryId: string;
  content: string;
  createdAt: string;
}

export interface JournalEntryInput {
  content: string;
}
