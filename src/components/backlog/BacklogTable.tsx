"use client";

import type { BacklogGameDTO } from "@/types/backlog";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";

interface BacklogTableProps {
  games: BacklogGameDTO[];
  onEdit: (game: BacklogGameDTO) => void;
  onDelete: (game: BacklogGameDTO) => void;
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

export function BacklogTable({ games, onEdit, onDelete }: BacklogTableProps) {
  return (
    <DataTable
      items={games}
      columns={COLUMNS}
      onEdit={onEdit}
      onDelete={onDelete}
      emptyMessage="No games in your backlog yet. Add one to get started!"
    />
  );
}
