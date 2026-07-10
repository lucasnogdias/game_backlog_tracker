"use client";

// Generic list/table view shared by any feature that renders a collection of
// items as rows with per-column rendering plus a fully custom actions cell
// (currently used by the Backlog and History pages).

import styles from "./DataTable.module.css";

export interface DataTableColumn<T> {
  header: string;
  /** Renders the cell content for a given item. */
  render: (item: T) => React.ReactNode;
  /** Defaults to "default" if not provided. */
  variant?: "default" | "emphasis" | "truncate";
  /** Optional `title` attribute for the cell, e.g. for truncated text. */
  cellTitle?: (item: T) => string | undefined;
}

interface DataTableProps<T extends { id: string }> {
  items: T[];
  columns: DataTableColumn<T>[];
  emptyMessage: string;
  /** Renders the row's action cell content (e.g. buttons, an actions menu). */
  renderActions: (item: T) => React.ReactNode;
}

function cellClassName(variant: DataTableColumn<unknown>["variant"]): string {
  if (variant === "emphasis") return `${styles.cell} ${styles.cellEmphasis}`;
  if (variant === "truncate") return `${styles.cell} ${styles.cellTruncate}`;
  return styles.cell;
}

export function DataTable<T extends { id: string }>({
  items,
  columns,
  emptyMessage,
  renderActions,
}: DataTableProps<T>) {
  if (items.length === 0) {
    return <p className={styles.emptyMessage}>{emptyMessage}</p>;
  }

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead className={styles.headerRow}>
          <tr>
            {columns.map((column) => (
              <th key={column.header} className={styles.headerCell}>
                {column.header}
              </th>
            ))}
            <th className={styles.headerCell}></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className={styles.row}>
              {columns.map((column) => (
                <td
                  key={column.header}
                  className={cellClassName(column.variant)}
                  title={column.cellTitle?.(item)}
                >
                  {column.render(item)}
                </td>
              ))}
              <td className={styles.actionsCell}>{renderActions(item)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
