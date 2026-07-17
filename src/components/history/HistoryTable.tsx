"use client";

import type { HistoryEntryDTO } from "@/types/history";
import { formatPlaytime } from "@/lib/playtime";
import { formatDate } from "@/lib/format-date";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { HistoryItemActions } from "./HistoryItemActions";

interface HistoryTableProps {
  entries: HistoryEntryDTO[];
  onEdit: (entry: HistoryEntryDTO) => void;
  onAddJournalEntry?: (entry: HistoryEntryDTO) => void;
  onViewJournal?: (entry: HistoryEntryDTO) => void;
  onDelete: (entry: HistoryEntryDTO) => void;
  onMoveToBacklog: (entry: HistoryEntryDTO) => void;
}

function formatReleaseYear(isoDate: string | null): string {
  if (!isoDate) return "—";
  return new Date(isoDate).getFullYear().toString();
}

const COLUMNS: DataTableColumn<HistoryEntryDTO>[] = [
  {
    header: "Game",
    variant: "emphasis",
    render: (entry) => entry.title,
  },
  { header: "Status", render: (entry) => entry.status },
  {
    header: "Playtime",
    render: (entry) => formatPlaytime(entry.playtimeMinutes) || "—",
  },
  {
    header: "Finished On",
    render: (entry) => (entry.finishedOn ? formatDate(entry.finishedOn) : "—"),
  },
  { header: "Platform", render: (entry) => entry.platform ?? "—" },
  {
    header: "Release Year",
    render: (entry) => formatReleaseYear(entry.releaseDate),
  },
  {
    header: "Notes / Review",
    variant: "truncate",
    cellTitle: (entry) => entry.notes ?? undefined,
    render: (entry) => entry.notes ?? "—",
  },
];

export function HistoryTable({
  entries,
  onEdit,
  onAddJournalEntry,
  onViewJournal,
  onDelete,
  onMoveToBacklog,
}: HistoryTableProps) {
  return (
    <DataTable
      items={entries}
      columns={COLUMNS}
      emptyMessage="No games in your history yet. Add one once you start playing!"
      renderActions={(entry) => (
        <HistoryItemActions
          entry={entry}
          layout="table"
          onEdit={onEdit}
          onAddJournalEntry={onAddJournalEntry}
          onViewJournal={onViewJournal}
          onDelete={onDelete}
          onMoveToBacklog={onMoveToBacklog}
        />
      )}
    />
  );
}
