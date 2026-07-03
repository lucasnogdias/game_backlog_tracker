"use client";

import type { BacklogGameDTO } from "@/types/backlog";
import { CardGrid } from "@/components/shared/CardGrid";

interface BacklogCardsProps {
  games: BacklogGameDTO[];
  onEdit: (game: BacklogGameDTO) => void;
  onDelete: (game: BacklogGameDTO) => void;
  onSetCoverImage: (game: BacklogGameDTO, url: string) => void;
}

export function BacklogCards({
  games,
  onEdit,
  onDelete,
  onSetCoverImage,
}: BacklogCardsProps) {
  return (
    <CardGrid
      items={games}
      onEdit={onEdit}
      onDelete={onDelete}
      onSetCoverImage={onSetCoverImage}
      emptyMessage="No games in your backlog yet. Add one to get started!"
      renderMeta={(game) => (
        <>
          <p className="text-xs text-neutral-500">
            {game.platforms.join(", ") || "No platform set"}
          </p>
          <p className="text-xs text-neutral-500">Hype: {game.hype ?? "—"}/10</p>
        </>
      )}
    />
  );
}
