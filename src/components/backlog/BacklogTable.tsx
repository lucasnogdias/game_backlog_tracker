"use client";

import type { BacklogGameDTO } from "@/types/backlog";

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

export function BacklogTable({ games, onEdit, onDelete }: BacklogTableProps) {
  if (games.length === 0) {
    return (
      <p className="py-12 text-center text-neutral-500">
        No games in your backlog yet. Add one to get started!
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded border border-neutral-200 dark:border-neutral-800">
      <table className="w-full text-left text-sm">
        <thead className="bg-neutral-100 dark:bg-neutral-800">
          <tr>
            <th className="px-4 py-2">Game</th>
            <th className="px-4 py-2">Owned</th>
            <th className="px-4 py-2">Platform(s)</th>
            <th className="px-4 py-2">Est. Time</th>
            <th className="px-4 py-2">Release Date</th>
            <th className="px-4 py-2">Hype</th>
            <th className="px-4 py-2">Notes</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {games.map((game) => (
            <tr
              key={game.id}
              className="border-t border-neutral-200 dark:border-neutral-800"
            >
              <td className="px-4 py-2 font-medium">{game.title}</td>
              <td className="px-4 py-2">{game.owned ? "✅" : "—"}</td>
              <td className="px-4 py-2">{game.platforms.join(", ") || "—"}</td>
              <td className="px-4 py-2">
                {game.estimatedHours ? `${game.estimatedHours}h` : "—"}
              </td>
              <td className="px-4 py-2">{formatReleaseDate(game.releaseDate)}</td>
              <td className="px-4 py-2">{game.hype ?? "—"}</td>
              <td
                className="max-w-xs truncate px-4 py-2 text-neutral-500"
                title={game.notes ?? undefined}
              >
                {game.notes ?? "—"}
              </td>
              <td className="whitespace-nowrap px-4 py-2 text-right">
                <button
                  type="button"
                  onClick={() => onEdit(game)}
                  className="mr-2 text-neutral-600 hover:underline dark:text-neutral-300"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(game)}
                  className="text-red-600 hover:underline"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
