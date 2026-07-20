// Shared types for the Backlog feature. Dates are represented as ISO
// strings (or null) since they cross the server/client + JSON API boundary.

export type BacklogSortField =
  | "title"
  | "owned"
  | "platforms"
  | "estimatedHours"
  | "releaseDate"
  | "hype";

export const BACKLOG_SORT_FIELDS: readonly BacklogSortField[] = [
  "title",
  "owned",
  "platforms",
  "estimatedHours",
  "releaseDate",
  "hype",
];

export type SortDirection = "asc" | "desc";

export interface BacklogGameDTO {
  id: string;
  title: string;
  owned: boolean;
  platforms: string[];
  estimatedHours: number | null;
  releaseDate: string | null; // ISO date string (only month/year are meaningful)
  hype: number | null;
  notes: string | null;
  coverImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BacklogGameInput {
  title: string;
  owned: boolean;
  platforms: string[];
  estimatedHours: number | null;
  releaseDate: string | null;
  hype: number | null;
  notes: string | null;
  coverImageUrl: string | null;
}
