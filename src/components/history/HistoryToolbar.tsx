"use client";

import type { HistorySortField, SortDirection } from "@/types/history";
import { Toolbar, type SortOption } from "@/components/shared/Toolbar";

interface HistoryToolbarProps {
  view: "list" | "card";
  onViewChange: (view: "list" | "card") => void;
  sortField: HistorySortField;
  sortDirection: SortDirection;
  onSortChange: (field: HistorySortField, direction: SortDirection) => void;
  onAddClick: () => void;
}

const SORT_OPTIONS: SortOption<HistorySortField>[] = [
  { value: "addedAt", label: "Date Added" },
  { value: "title", label: "Game" },
  { value: "status", label: "Status" },
  { value: "playtimeMinutes", label: "Playtime" },
  { value: "finishedOn", label: "Finished On" },
  { value: "platform", label: "Platform" },
  { value: "releaseDate", label: "Release Year" },
];

export function HistoryToolbar(props: HistoryToolbarProps) {
  return (
    <Toolbar
      {...props}
      sortOptions={SORT_OPTIONS}
      directionLabel={(direction) =>
        direction === "asc" ? "↑ Oldest first" : "↓ Newest first"
      }
    />
  );
}
