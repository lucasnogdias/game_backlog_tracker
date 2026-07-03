"use client";

import type { HistoryEntryDTO } from "@/types/history";
import { formatPlaytime } from "@/lib/playtime";
import { CardGrid } from "@/components/shared/CardGrid";

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
  return (
    <CardGrid
      items={entries}
      onEdit={onEdit}
      onDelete={onDelete}
      onSetCoverImage={onSetCoverImage}
      emptyMessage="No games in your history yet. Add one once you start playing!"
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
