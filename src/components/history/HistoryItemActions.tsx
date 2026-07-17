import type { HistoryEntryDTO } from "@/types/history";
import { ActionsMenu } from "@/components/shared/ActionsMenu";
import shared from "@/styles/shared.module.css";

interface HistoryItemActionsProps {
  entry: HistoryEntryDTO;
  layout: "card" | "table";
  onEdit: (entry: HistoryEntryDTO) => void;
  onAddJournalEntry?: (entry: HistoryEntryDTO) => void;
  onViewJournal?: (entry: HistoryEntryDTO) => void;
  onDelete: (entry: HistoryEntryDTO) => void;
  onMoveToBacklog: (entry: HistoryEntryDTO) => void;
}

export function HistoryItemActions({
  entry,
  layout,
  onEdit,
  onAddJournalEntry,
  onViewJournal,
  onDelete,
  onMoveToBacklog,
}: HistoryItemActionsProps) {
  return (
    <div
      className={
        layout === "card" ? shared.cardActionRow : shared.tableActionRow
      }
    >
      {onAddJournalEntry && (
        <button
          type="button"
          onClick={() => onAddJournalEntry(entry)}
          className={shared.textAction}
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
  );
}
