"use client";

import type { BacklogGameDTO } from "@/types/backlog";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { ActionsMenu } from "@/components/shared/ActionsMenu";
import { formatMonthYear } from "@/lib/format-date";
import styles from "./BacklogTable.module.css";

interface BacklogTableProps {
  games: BacklogGameDTO[];
  onEdit: (game: BacklogGameDTO) => void;
  onDelete: (game: BacklogGameDTO) => void;
  onMoveToHistory: (game: BacklogGameDTO) => void;
}

function formatReleaseDate(isoDate: string | null): string {
  if (!isoDate) return "—";
  return formatMonthYear(isoDate);
}

const COLUMNS: DataTableColumn<BacklogGameDTO>[] = [
  {
    header: "Game",
    variant: "emphasis",
    render: (game) => game.title,
  },
  { header: "Owned", render: (game) => (game.owned ? "✅" : "—") },
  {
    header: "Platform(s)",
    render: (game) => game.platforms.join(", ") || "—",
  },
  {
    header: "Est. Time",
    render: (game) => (game.estimatedHours ? `${game.estimatedHours}h` : "—"),
  },
  {
    header: "Release Date",
    render: (game) => formatReleaseDate(game.releaseDate),
  },
  { header: "Hype", render: (game) => game.hype ?? "—" },
  {
    header: "Notes",
    variant: "truncate",
    cellTitle: (game) => game.notes ?? undefined,
    render: (game) => game.notes ?? "—",
  },
];

export function BacklogTable({
  games,
  onEdit,
  onDelete,
  onMoveToHistory,
}: BacklogTableProps) {
  return (
    <DataTable
      items={games}
      columns={COLUMNS}
      emptyMessage="No games in your backlog yet. Add one to get started!"
      renderActions={(game) => (
        <div className={styles.actionsRow}>
          <button
            type="button"
            onClick={() => onMoveToHistory(game)}
            className={styles.moveLink}
          >
            Move to History
          </button>
          <ActionsMenu
            items={[
              { label: "Edit", onClick: () => onEdit(game) },
              {
                label: "Delete",
                onClick: () => onDelete(game),
                destructive: true,
              },
            ]}
          />
        </div>
      )}
    />
  );
}
