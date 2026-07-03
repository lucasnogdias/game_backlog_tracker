"use client";

// Generic toolbar shared by any feature page that needs a sort-by select +
// direction toggle, a list/card view switch, and an "add" button (currently
// used by the Backlog and History pages).

export interface SortOption<TField extends string> {
  value: TField;
  label: string;
}

interface ToolbarProps<TField extends string> {
  view: "list" | "card";
  onViewChange: (view: "list" | "card") => void;
  sortField: TField;
  sortDirection: "asc" | "desc";
  onSortChange: (field: TField, direction: "asc" | "desc") => void;
  onAddClick: () => void;
  sortOptions: SortOption<TField>[];
  /** Renders the label for the direction-toggle button given the current direction. */
  directionLabel: (direction: "asc" | "desc") => string;
  addButtonLabel?: string;
}

export function Toolbar<TField extends string>({
  view,
  onViewChange,
  sortField,
  sortDirection,
  onSortChange,
  onAddClick,
  sortOptions,
  directionLabel,
  addButtonLabel = "+ Add Game",
}: ToolbarProps<TField>) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <label className="text-sm text-neutral-600 dark:text-neutral-400">
          Sort by
        </label>
        <select
          className="rounded border border-neutral-300 bg-white px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-800"
          value={sortField}
          onChange={(e) => onSortChange(e.target.value as TField, sortDirection)}
        >
          {sortOptions.map((option) => (
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
          {directionLabel(sortDirection)}
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
          {addButtonLabel}
        </button>
      </div>
    </div>
  );
}
