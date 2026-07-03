"use client";

import type { HistorySortField, SortDirection } from "@/types/history";

interface HistoryToolbarProps {
  view: "list" | "card";
  onViewChange: (view: "list" | "card") => void;
  sortField: HistorySortField;
  sortDirection: SortDirection;
  onSortChange: (field: HistorySortField, direction: SortDirection) => void;
  onAddClick: () => void;
}

const SORT_OPTIONS: { value: HistorySortField; label: string }[] = [
  { value: "addedAt", label: "Date Added" },
  { value: "title", label: "Game" },
  { value: "status", label: "Status" },
  { value: "playtimeMinutes", label: "Playtime" },
  { value: "finishedOn", label: "Finished On" },
  { value: "platform", label: "Platform" },
  { value: "releaseDate", label: "Release Year" },
];

export function HistoryToolbar({
  view,
  onViewChange,
  sortField,
  sortDirection,
  onSortChange,
  onAddClick,
}: HistoryToolbarProps) {
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
            onSortChange(e.target.value as HistorySortField, sortDirection)
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
          {sortDirection === "asc" ? "↑ Oldest first" : "↓ Newest first"}
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
