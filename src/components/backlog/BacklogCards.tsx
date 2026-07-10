"use client";

import type { BacklogGameDTO } from "@/types/backlog";
import { CardGrid } from "@/components/shared/CardGrid";
import { ActionsMenu } from "@/components/shared/ActionsMenu";
import styles from "./BacklogCards.module.css";
import shared from "@/styles/shared.module.css";

interface BacklogCardsProps {
  games: BacklogGameDTO[];
  onEdit: (game: BacklogGameDTO) => void;
  onDelete: (game: BacklogGameDTO) => void;
  onSetCoverImage: (game: BacklogGameDTO, url: string) => void;
  onMoveToHistory: (game: BacklogGameDTO) => void;
}

export function BacklogCards({
  games,
  onEdit,
  onDelete,
  onSetCoverImage,
  onMoveToHistory,
}: BacklogCardsProps) {
  return (
    <CardGrid
      items={games}
      onSetCoverImage={onSetCoverImage}
      emptyMessage="No games in your backlog yet. Add one to get started!"
      renderActions={(game) => (
        <div className={styles.cardActionsRow}>
          <button
            type="button"
            onClick={() => onMoveToHistory(game)}
            className={styles.moveLink}
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
      )}
      renderMeta={(game) => (
        <>
          <p className={shared.metaText}>
            {game.platforms.join(", ") || "No platform set"}
          </p>
          <p className={shared.metaText}>Hype: {game.hype ?? "—"}/10</p>
        </>
      )}
    />
  );
}
