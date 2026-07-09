"use client";

// Generic list/table view shared by any feature that renders a collection of
// items as rows with per-column rendering plus a fully custom actions cell
// (currently used by the Backlog and History pages).

export interface DataTableColumn<T> {
  header: string;
  /** Renders the cell content for a given item. */
  render: (item: T) => React.ReactNode;
  /** Defaults to "px-4 py-2" if not provided. */
  className?: string;
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

export function DataTable<T extends { id: string }>({
  items,
  columns,
  emptyMessage,
  renderActions,
}: DataTableProps<T>) {
  if (items.length === 0) {
    return <p className="py-12 text-center text-neutral-500">{emptyMessage}</p>;
  }

  return (
    <div className="overflow-x-auto rounded border border-neutral-200 dark:border-neutral-800">
      <table className="w-full text-left text-sm">
        <thead className="bg-neutral-100 dark:bg-neutral-800">
          <tr>
            {columns.map((column) => (
              <th key={column.header} className="px-4 py-2">
                {column.header}
              </th>
            ))}
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr
              key={item.id}
              className="border-t border-neutral-200 dark:border-neutral-800"
            >
              {columns.map((column) => (
                <td
                  key={column.header}
                  className={column.className ?? "px-4 py-2"}
                  title={column.cellTitle?.(item)}
                >
                  {column.render(item)}
                </td>
              ))}
              <td className="whitespace-nowrap px-4 py-2 text-right">
                {renderActions(item)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
