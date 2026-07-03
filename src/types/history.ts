// Shared types for the History (post-log) feature. Dates are represented as
// ISO strings (or null) since they cross the server/client + JSON API
// boundary. Playtime is stored/transferred as total minutes, but displayed
// and entered by the user as "HH:mm" (hours can exceed 24 for long games).

export const HISTORY_STATUSES = [
  "In Progress",
  "Finished",
  "Completed",
  "Recurrent",
  "Abandoned",
  "Paused",
] as const;

export type HistoryStatus = (typeof HISTORY_STATUSES)[number];

export type HistorySortField =
  | "title"
  | "status"
  | "playtimeMinutes"
  | "finishedOn"
  | "platform"
  | "releaseDate"
  | "addedAt";

export type SortDirection = "asc" | "desc";

export interface HistoryEntryDTO {
  id: string;
  title: string;
  status: HistoryStatus;
  playtimeMinutes: number | null;
  finishedOn: string | null; // ISO date string
  releaseDate: string | null; // ISO date string (only month/year are meaningful)
  notes: string | null;
  platform: string | null;
  coverImageUrl: string | null;
  createdAt: string; // drives the default "added to History" sort order
  updatedAt: string;
}

export interface HistoryEntryInput {
  title: string;
  status: HistoryStatus;
  playtimeMinutes: number | null;
  finishedOn: string | null;
  releaseDate: string | null;
  notes: string | null;
  platform: string | null;
  coverImageUrl: string | null;
}
