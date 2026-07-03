"use client";

import type { HistoryEntryDTO } from "@/types/history";
import { formatPlaytime } from "@/lib/playtime";

interface HistoryTableProps {
  entries: HistoryEntryDTO[];
  onEdit: (entry: HistoryEntryDTO) => void;
  onDelete: (entry: HistoryEntryDTO) => void;
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

export function HistoryTable({ entries, onEdit, onDelete }: HistoryTableProps) {
  if (entries.length === 0) {
    return (
      <p className="py-12 text-center text-neutral-500">
        No games in your history yet. Add one once you start playing!
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded border border-neutral-200 dark:border-neutral-800">
      <table className="w-full text-left text-sm">
        <thead className="bg-neutral-100 dark:bg-neutral-800">
          <tr>
            <th className="px-4 py-2">Game</th>
            <th className="px-4 py-2">Status</th>
            <th className="px-4 py-2">Playtime</th>
            <th className="px-4 py-2">Finished On</th>
            <th className="px-4 py-2">Platform</th>
            <th className="px-4 py-2">Release Year</th>
            <th className="px-4 py-2">Notes / Review</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr
              key={entry.id}
              className="border-t border-neutral-200 dark:border-neutral-800"
            >
              <td className="px-4 py-2 font-medium">{entry.title}</td>
              <td className="px-4 py-2">{entry.status}</td>
              <td className="px-4 py-2">
                {formatPlaytime(entry.playtimeMinutes) || "—"}
              </td>
              <td className="px-4 py-2">{formatDate(entry.finishedOn)}</td>
              <td className="px-4 py-2">{entry.platform ?? "—"}</td>
              <td className="px-4 py-2">
                {formatReleaseYear(entry.releaseDate)}
              </td>
              <td
                className="max-w-xs truncate px-4 py-2 text-neutral-500"
                title={entry.notes ?? undefined}
              >
                {entry.notes ?? "—"}
              </td>
              <td className="whitespace-nowrap px-4 py-2 text-right">
                <button
                  type="button"
                  onClick={() => onEdit(entry)}
                  className="mr-2 text-neutral-600 hover:underline dark:text-neutral-300"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(entry)}
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
