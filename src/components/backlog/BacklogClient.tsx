"use client";

import { useMemo, useState } from "react";
import type {
  BacklogGameDTO,
  BacklogGameInput,
  BacklogSortField,
  SortDirection,
} from "@/types/backlog";
import { sortBacklogGames } from "@/lib/sort-backlog";
import { BacklogToolbar } from "./BacklogToolbar";
import { BacklogTable } from "./BacklogTable";
import { BacklogCards } from "./BacklogCards";
import { GameFormModal } from "./GameFormModal";
import { MoveToHistoryModal } from "./MoveToHistoryModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import type { HistoryStatus } from "@/types/history";

interface BacklogClientProps {
  initialGames: BacklogGameDTO[];
}

export function BacklogClient({ initialGames }: BacklogClientProps) {
  const [games, setGames] = useState(initialGames);
  const [view, setView] = useState<"list" | "card">("list");
  const [sortField, setSortField] = useState<BacklogSortField>("hype");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [isAdding, setIsAdding] = useState(false);
  const [editingGame, setEditingGame] = useState<BacklogGameDTO | null>(null);
  const [deletingGame, setDeletingGame] = useState<BacklogGameDTO | null>(null);
  const [movingGame, setMovingGame] = useState<BacklogGameDTO | null>(null);

  const sortedGames = useMemo(
    () => sortBacklogGames(games, sortField, sortDirection),
    [games, sortField, sortDirection]
  );

  async function handleAdd(input: BacklogGameInput) {
    const response = await fetch("/api/backlog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error("Failed to add game");
    const created: BacklogGameDTO = await response.json();
    setGames((prev) => [...prev, created]);
    setIsAdding(false);
  }

  async function handleEdit(id: string, input: Partial<BacklogGameInput>) {
    const response = await fetch(`/api/backlog/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error("Failed to update game");
    const updated: BacklogGameDTO = await response.json();
    setGames((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
  }

  async function handleDelete(game: BacklogGameDTO) {
    const response = await fetch(`/api/backlog/${game.id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      setGames((prev) => prev.filter((g) => g.id !== game.id));
    }
    setDeletingGame(null);
  }

  async function handleSetCoverImage(game: BacklogGameDTO, url: string) {
    await handleEdit(game.id, { coverImageUrl: url });
  }

  async function handleMoveToHistory(
    game: BacklogGameDTO,
    input: { status: HistoryStatus; platform: string | null }
  ) {
    const response = await fetch(`/api/backlog/${game.id}/move-to-history`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error("Failed to move game to history");
    setGames((prev) => prev.filter((g) => g.id !== game.id));
    setMovingGame(null);
  }

  return (
    <div>
      <BacklogToolbar
        view={view}
        onViewChange={setView}
        sortField={sortField}
        sortDirection={sortDirection}
        onSortChange={(field, direction) => {
          setSortField(field);
          setSortDirection(direction);
        }}
        onAddClick={() => setIsAdding(true)}
      />

      {view === "list" ? (
        <BacklogTable
          games={sortedGames}
          onEdit={setEditingGame}
          onDelete={setDeletingGame}
          onMoveToHistory={setMovingGame}
        />
      ) : (
        <BacklogCards
          games={sortedGames}
          onEdit={setEditingGame}
          onDelete={setDeletingGame}
          onSetCoverImage={handleSetCoverImage}
          onMoveToHistory={setMovingGame}
        />
      )}

      {isAdding && (
        <GameFormModal onSubmit={handleAdd} onClose={() => setIsAdding(false)} />
      )}

      {editingGame && (
        <GameFormModal
          initialGame={editingGame}
          onSubmit={async (input) => {
            await handleEdit(editingGame.id, input);
            setEditingGame(null);
          }}
          onClose={() => setEditingGame(null)}
        />
      )}

      {deletingGame && (
        <ConfirmDialog
          message={`Remove "${deletingGame.title}" from your backlog? This cannot be undone.`}
          onConfirm={() => handleDelete(deletingGame)}
          onCancel={() => setDeletingGame(null)}
        />
      )}

      {movingGame && (
        <MoveToHistoryModal
          game={movingGame}
          onSubmit={(input) => handleMoveToHistory(movingGame, input)}
          onClose={() => setMovingGame(null)}
        />
      )}
    </div>
  );
}
