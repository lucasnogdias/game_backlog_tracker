"use client";

import type { BacklogSortField, SortDirection } from "@/types/backlog";

interface BacklogToolbarProps {
  view: "list" | "card";
  onViewChange: (view: "list" | "card") => void;
  sortField: BacklogSortField;
  sortDirection: SortDirection;
  onSortChange: (field: BacklogSortField, direction: SortDirection) => void;
  onAddClick: () => void;
}

const SORT_OPTIONS: { value: BacklogSortField; label: string }[] = [
  { value: "hype", label: "Hype" },
  { value: "title", label: "Game" },
  { value: "owned", label: "Owned" },
  { value: "platforms", label: "Platform" },
  { value: "estimatedHours", label: "Est. Time to Finish" },
  { value: "releaseDate", label: "Release Date" },
];

export function BacklogToolbar({
  view,
  onViewChange,
  sortField,
  sortDirection,
  onSortChange,
  onAddClick,
}: BacklogToolbarProps) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <label className="text-sm text-neutral-600 dark:text-neutral-400">
          Sort by
        </label>
        <select
          className="rounded border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
          value={sortField}
          onChange={(e) =>
            onSortChange(e.target.value as BacklogSortField, sortDirection)
          }
        >
          {SORT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() =>
            onSortChange(sortField, sortDirection === "asc" ? "desc" : "asc")
          }
          className="rounded border border-neutral-300 px-2 py-1 text-sm dark:border-neutral-700"
          aria-label="Toggle sort direction"
        >
          {sortDirection === "asc" ? "↑ Asc" : "↓ Desc"}
        </button>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex overflow-hidden rounded border border-neutral-300 dark:border-neutral-700">
          <button
            type="button"
            onClick={() => onViewChange("list")}
            className={`px-3 py-1 text-sm ${
              view === "list"
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                : ""
            }`}
          >
            List
          </button>
          <button
            type="button"
            onClick={() => onViewChange("card")}
            className={`px-3 py-1 text-sm ${
              view === "card"
                ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                : ""
            }`}
          >
            Card
          </button>
        </div>
        <button
          type="button"
          onClick={onAddClick}
          className="rounded bg-neutral-900 px-4 py-1.5 text-sm text-white dark:bg-white dark:text-neutral-900"
        >
          + Add Game
        </button>
      </div>
    </div>
  );
}
