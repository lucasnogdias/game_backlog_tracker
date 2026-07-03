"use client";

import type { BacklogGameDTO } from "@/types/backlog";

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
  if (games.length === 0) {
    return (
      <p className="py-12 text-center text-neutral-500">
        No games in your backlog yet. Add one to get started!
      </p>
    );
  }

  function handlePlaceholderClick(game: BacklogGameDTO) {
    const url = window.prompt("Cover image URL for " + game.title);
    if (url && url.trim()) {
      onSetCoverImage(game, url.trim());
    }
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {games.map((game) => (
        <div
          key={game.id}
          className="flex flex-col overflow-hidden rounded border border-neutral-200 dark:border-neutral-800"
        >
          {game.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- external, arbitrary user-provided URLs
            <img
              src={game.coverImageUrl}
              alt={`${game.title} cover art`}
              className="h-40 w-full object-cover"
            />
          ) : (
            <button
              type="button"
              onClick={() => handlePlaceholderClick(game)}
              className="flex h-40 w-full flex-col items-center justify-center bg-neutral-200 text-xs text-neutral-500 hover:bg-neutral-300 dark:bg-neutral-800 dark:hover:bg-neutral-700"
            >
              <span className="text-2xl">🎮</span>
              Add cover image
            </button>
          )}
          <div className="flex flex-1 flex-col gap-1 p-3">
            <h3 className="text-sm font-semibold">{game.title}</h3>
            <p className="text-xs text-neutral-500">
              {game.platforms.join(", ") || "No platform set"}
            </p>
            <p className="text-xs text-neutral-500">
              Hype: {game.hype ?? "—"}/10
            </p>
            <div className="mt-auto flex justify-between pt-2 text-xs">
              <button
                type="button"
                onClick={() => onEdit(game)}
                className="text-neutral-600 hover:underline dark:text-neutral-300"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => onDelete(game)}
                className="text-red-600 hover:underline"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
