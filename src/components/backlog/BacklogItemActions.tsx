import type { BacklogGameDTO } from "@/types/backlog";
import { ActionsMenu } from "@/components/shared/ActionsMenu";
import shared from "@/styles/shared.module.css";

interface BacklogItemActionsProps {
  game: BacklogGameDTO;
  layout: "card" | "table";
  onEdit: (game: BacklogGameDTO) => void;
  onDelete: (game: BacklogGameDTO) => void;
  onMoveToHistory: (game: BacklogGameDTO) => void;
}

export function BacklogItemActions({
  game,
  layout,
  onEdit,
  onDelete,
  onMoveToHistory,
}: BacklogItemActionsProps) {
  return (
    <div
      className={
        layout === "card" ? shared.cardActionRow : shared.tableActionRow
      }
    >
      <button
        type="button"
        onClick={() => onMoveToHistory(game)}
        className={shared.textAction}
      >
        Move to History
      </button>
      <ActionsMenu
        items={[
          { label: "Edit", onClick: () => onEdit(game) },
          {
            label: "Delete",
            onClick: () => onDelete(game),
            destructive: true,
          },
        ]}
      />
    </div>
  );
}
