"use client";

import type { HistoryEntryDTO } from "@/types/history";
import { formatPlaytime } from "@/lib/playtime";
import { CardGrid } from "@/components/shared/CardGrid";
import shared from "@/styles/shared.module.css";
import { HistoryItemActions } from "./HistoryItemActions";
import {
  HISTORY_STATUS_BORDER_COLORS,
  HISTORY_STATUS_CLASS_NAMES,
} from "./history-status-styles";
import styles from "./HistoryStatus.module.css";

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
      getCardBorderColor={(entry) => HISTORY_STATUS_BORDER_COLORS[entry.status]}
      renderActions={(entry) => (
        <HistoryItemActions
          entry={entry}
          layout="card"
          onEdit={onEdit}
          onAddJournalEntry={onAddJournalEntry}
          onViewJournal={onViewJournal}
          onDelete={onDelete}
          onMoveToBacklog={onMoveToBacklog}
        />
      )}
      renderMeta={(entry) => (
        <>
          <p className={`${shared.metaText} ${styles[HISTORY_STATUS_CLASS_NAMES[entry.status]]}`}>
            {entry.status}
          </p>
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
