"use client";

import type { HistoryEntryDTO } from "@/types/history";
import { formatPlaytime } from "@/lib/playtime";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { ActionsMenu } from "@/components/shared/ActionsMenu";

interface HistoryTableProps {
  entries: HistoryEntryDTO[];
  onEdit: (entry: HistoryEntryDTO) => void;
  onDelete: (entry: HistoryEntryDTO) => void;
  onMoveToBacklog: (entry: HistoryEntryDTO) => void;
}

function formatDate(isoDate: string | null): string {
  if (!isoDate) return "—";
  return new Date(isoDate).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatReleaseYear(isoDate: string | null): string {
  if (!isoDate) return "—";
  return new Date(isoDate).getFullYear().toString();
}

const COLUMNS: DataTableColumn<HistoryEntryDTO>[] = [
  {
    header: "Game",
    className: "px-4 py-2 font-medium",
    render: (entry) => entry.title,
  },
  { header: "Status", render: (entry) => entry.status },
  {
    header: "Playtime",
    render: (entry) => formatPlaytime(entry.playtimeMinutes) || "—",
  },
  {
    header: "Finished On",
    render: (entry) => formatDate(entry.finishedOn),
  },
  { header: "Platform", render: (entry) => entry.platform ?? "—" },
  {
    header: "Release Year",
    render: (entry) => formatReleaseYear(entry.releaseDate),
  },
  {
    header: "Notes / Review",
    className: "max-w-xs truncate px-4 py-2 text-neutral-500",
    cellTitle: (entry) => entry.notes ?? undefined,
    render: (entry) => entry.notes ?? "—",
  },
];

export function HistoryTable({
  entries,
  onEdit,
  onDelete,
  onMoveToBacklog,
}: HistoryTableProps) {
  return (
    <DataTable
      items={entries}
      columns={COLUMNS}
      emptyMessage="No games in your history yet. Add one once you start playing!"
      renderActions={(entry) => (
        <ActionsMenu
          items={[
            { label: "Edit", onClick: () => onEdit(entry) },
            { label: "Move to Backlog", onClick: () => onMoveToBacklog(entry) },
            {
              label: "Delete",
              onClick: () => onDelete(entry),
              destructive: true,
            },
          ]}
        />
      )}
    />
  );
}
