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
  onAddJournalEntry?: (entry: HistoryEntryDTO) => void;
  onViewJournal?: (entry: HistoryEntryDTO) => void;
  onDelete: (entry: HistoryEntryDTO) => void;
  onSetCoverImage: (entry: HistoryEntryDTO, url: string) => void;
  onMoveToBacklog: (entry: HistoryEntryDTO) => void;
}

export function HistoryCards({
  entries,
  onEdit,
  onAddJournalEntry,
  onViewJournal,
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
          {onAddJournalEntry && (
            <button
              type="button"
              onClick={() => onAddJournalEntry(entry)}
              className={styles.journalButton}
            >
              Add Journal Entry
            </button>
          )}
          <ActionsMenu
            items={[
              { label: "Edit", onClick: () => onEdit(entry) },
              ...(onViewJournal
                ? [{ label: "View Journal", onClick: () => onViewJournal(entry) }]
                : []),
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
