"use client";

import type { BacklogSortField, SortDirection } from "@/types/backlog";
import { Toolbar, type SortOption } from "@/components/shared/Toolbar";

interface BacklogToolbarProps {
  view: "list" | "card";
  onViewChange: (view: "list" | "card") => void;
  sortField: BacklogSortField;
  sortDirection: SortDirection;
  onSortChange: (field: BacklogSortField, direction: SortDirection) => void;
  onAddClick: () => void;
}

const SORT_OPTIONS: SortOption<BacklogSortField>[] = [
  { value: "hype", label: "Hype" },
  { value: "title", label: "Game" },
  { value: "owned", label: "Owned" },
  { value: "platforms", label: "Platform" },
  { value: "estimatedHours", label: "Est. Time to Finish" },
  { value: "releaseDate", label: "Release Date" },
];

export function BacklogToolbar(props: BacklogToolbarProps) {
  return (
    <Toolbar
      {...props}
      sortOptions={SORT_OPTIONS}
      directionLabel={(direction) => (direction === "asc" ? "↑ Asc" : "↓ Desc")}
    />
  );
}
