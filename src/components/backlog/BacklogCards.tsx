"use client";

import type { BacklogGameDTO } from "@/types/backlog";
import { CardGrid } from "@/components/shared/CardGrid";
import shared from "@/styles/shared.module.css";
import { BacklogItemActions } from "./BacklogItemActions";

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
        <BacklogItemActions
          game={game}
          layout="card"
          onEdit={onEdit}
          onDelete={onDelete}
          onMoveToHistory={onMoveToHistory}
        />
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
