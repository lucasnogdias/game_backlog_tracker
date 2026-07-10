"use client";

import type { HistoryEntryDTO } from "@/types/history";
import { formatPlaytime } from "@/lib/playtime";
import { CardGrid } from "@/components/shared/CardGrid";
import { ActionsMenu } from "@/components/shared/ActionsMenu";
import styles from "./HistoryCards.module.css";
import shared from "@/styles/shared.module.css";

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
        <div className={styles.cardActionsRow}>
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
          <p className={shared.metaText}>{entry.status}</p>
          <p className={shared.metaText}>
            {entry.platform ?? "No platform set"}
          </p>
          <p className={shared.metaText}>
            Playtime: {formatPlaytime(entry.playtimeMinutes) || "—"}
          </p>
        </>
      )}
    />
  );
}
