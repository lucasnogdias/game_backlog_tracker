"use client";

// Generic toolbar shared by any feature page that needs a sort-by select +
// direction toggle, a list/card view switch, and an "add" button (currently
// used by the Backlog and History pages).

import styles from "./Toolbar.module.css";
import type { GameView } from "./useGameViewPreference";

export interface SortOption<TField extends string> {
  value: TField;
  label: string;
}

interface ToolbarProps<TField extends string> {
  view: GameView;
  onViewChange: (view: GameView) => void;
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
    <div className={styles.toolbar}>
      <div className={styles.sortGroup}>
        <label className={styles.sortLabel}>Sort by</label>
        <select
          className={styles.select}
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
          className={styles.directionButton}
          aria-label="Toggle sort direction"
        >
          {directionLabel(sortDirection)}
        </button>
      </div>

      <div className={styles.viewGroup}>
        <div className={styles.viewToggle}>
          <button
            type="button"
            onClick={() => onViewChange("list")}
            className={
              view === "list"
                ? `${styles.viewButton} ${styles.viewButtonActive}`
                : styles.viewButton
            }
          >
            List
          </button>
          <button
            type="button"
            onClick={() => onViewChange("card")}
            className={
              view === "card"
                ? `${styles.viewButton} ${styles.viewButtonActive}`
                : styles.viewButton
            }
          >
            Card
          </button>
        </div>
        <button type="button" onClick={onAddClick} className={styles.addButton}>
          {addButtonLabel}
        </button>
      </div>
    </div>
  );
}
