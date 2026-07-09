"use client";

import type { HistoryEntryDTO } from "@/types/history";
import { formatPlaytime } from "@/lib/playtime";
import { CardGrid } from "@/components/shared/CardGrid";

interface HistoryCardsProps {
  entries: HistoryEntryDTO[];
  onEdit: (entry: HistoryEntryDTO) => void;
  onDelete: (entry: HistoryEntryDTO) => void;
  onSetCoverImage: (entry: HistoryEntryDTO, url: string) => void;
  onMoveToBacklog: (entry: HistoryEntryDTO) => void;
}

export function HistoryCards({
  entries,
  onEdit,
  onDelete,
  onSetCoverImage,
  onMoveToBacklog,
}: HistoryCardsProps) {
  return (
    <CardGrid
      items={entries}
      onEdit={onEdit}
      onDelete={onDelete}
      onSetCoverImage={onSetCoverImage}
      emptyMessage="No games in your history yet. Add one once you start playing!"
      renderExtraActions={(entry) => (
        <button
          type="button"
          onClick={() => onMoveToBacklog(entry)}
          className="text-neutral-600 hover:underline dark:text-neutral-300"
        >
          Move to Backlog
        </button>
      )}
      renderMeta={(entry) => (
        <>
          <p className="text-xs text-neutral-500">{entry.status}</p>
          <p className="text-xs text-neutral-500">
            {entry.platform ?? "No platform set"}
          </p>
          <p className="text-xs text-neutral-500">
            Playtime: {formatPlaytime(entry.playtimeMinutes) || "—"}
          </p>
        </>
      )}
    />
  );
}
