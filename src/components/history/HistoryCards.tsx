"use client";

import type { HistoryEntryDTO } from "@/types/history";
import { formatPlaytime } from "@/lib/playtime";

interface HistoryCardsProps {
  entries: HistoryEntryDTO[];
  onEdit: (entry: HistoryEntryDTO) => void;
  onDelete: (entry: HistoryEntryDTO) => void;
  onSetCoverImage: (entry: HistoryEntryDTO, url: string) => void;
}

export function HistoryCards({
  entries,
  onEdit,
  onDelete,
  onSetCoverImage,
}: HistoryCardsProps) {
  if (entries.length === 0) {
    return (
      <p className="py-12 text-center text-neutral-500">
        No games in your history yet. Add one once you start playing!
      </p>
    );
  }

  function handlePlaceholderClick(entry: HistoryEntryDTO) {
    const url = window.prompt("Cover image URL for " + entry.title);
    if (url && url.trim()) {
      onSetCoverImage(entry, url.trim());
    }
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className="flex flex-col overflow-hidden rounded border border-neutral-200 dark:border-neutral-800"
        >
          {entry.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- external, arbitrary user-provided URLs
            <img
              src={entry.coverImageUrl}
              alt={`${entry.title} cover art`}
              className="h-40 w-full object-cover"
            />
          ) : (
            <button
              type="button"
              onClick={() => handlePlaceholderClick(entry)}
              className="flex h-40 w-full flex-col items-center justify-center bg-neutral-200 text-xs text-neutral-500 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700"
            >
              <span className="text-2xl">🎮</span>
              Add cover image
            </button>
          )}
          <div className="flex flex-1 flex-col gap-1 p-3">
            <h3 className="text-sm font-semibold">{entry.title}</h3>
            <p className="text-xs text-neutral-500">{entry.status}</p>
            <p className="text-xs text-neutral-500">
              {entry.platform ?? "No platform set"}
            </p>
            <p className="text-xs text-neutral-500">
              Playtime: {formatPlaytime(entry.playtimeMinutes) || "—"}
            </p>
            <div className="mt-auto flex justify-between pt-2 text-xs">
              <button
                type="button"
                onClick={() => onEdit(entry)}
                className="text-neutral-600 hover:underline dark:text-neutral-300"
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
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
