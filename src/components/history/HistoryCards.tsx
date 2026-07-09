"use client";

import type { HistoryEntryDTO } from "@/types/history";
import { formatPlaytime } from "@/lib/playtime";
import { CardGrid } from "@/components/shared/CardGrid";
import { ActionsMenu } from "@/components/shared/ActionsMenu";

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
      onSetCoverImage={onSetCoverImage}
      emptyMessage="No games in your history yet. Add one once you start playing!"
      renderActions={(entry) => (
        <div className="flex w-full justify-end">
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
        </div>
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
