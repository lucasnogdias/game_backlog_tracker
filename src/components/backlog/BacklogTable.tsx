"use client";

import type { BacklogGameDTO } from "@/types/backlog";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { ActionsMenu } from "@/components/shared/ActionsMenu";

interface BacklogTableProps {
  games: BacklogGameDTO[];
  onEdit: (game: BacklogGameDTO) => void;
  onDelete: (game: BacklogGameDTO) => void;
  onMoveToHistory: (game: BacklogGameDTO) => void;
}

function formatReleaseDate(isoDate: string | null): string {
  if (!isoDate) return "—";
  const date = new Date(isoDate);
  return date.toLocaleDateString(undefined, { month: "short", year: "numeric" });
}

const COLUMNS: DataTableColumn<BacklogGameDTO>[] = [
  {
    header: "Game",
    className: "px-4 py-2 font-medium",
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
    className: "max-w-xs truncate px-4 py-2 text-neutral-500",
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
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => onMoveToHistory(game)}
            className="text-neutral-600 hover:underline dark:text-neutral-300"
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
