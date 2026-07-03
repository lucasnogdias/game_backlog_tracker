"use client";

import { useMemo, useState } from "react";
import type {
  HistoryEntryDTO,
  HistoryEntryInput,
  HistorySortField,
  SortDirection,
} from "@/types/history";
import { sortHistoryEntries } from "@/lib/sort-history";
import { HistoryToolbar } from "./HistoryToolbar";
import { HistoryTable } from "./HistoryTable";
import { HistoryCards } from "./HistoryCards";
import { HistoryFormModal } from "./HistoryFormModal";
import { ConfirmDialog } from "@/components/ConfirmDialog";

interface HistoryClientProps {
  initialEntries: HistoryEntryDTO[];
}

export function HistoryClient({ initialEntries }: HistoryClientProps) {
  const [entries, setEntries] = useState(initialEntries);
  const [view, setView] = useState<"list" | "card">("list");
  const [sortField, setSortField] = useState<HistorySortField>("addedAt");
  // Default: oldest added first (per spec, games added first show first).
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [isAdding, setIsAdding] = useState(false);
  const [editingEntry, setEditingEntry] = useState<HistoryEntryDTO | null>(
    null
  );
  const [deletingEntry, setDeletingEntry] = useState<HistoryEntryDTO | null>(
    null
  );

  const sortedEntries = useMemo(
    () => sortHistoryEntries(entries, sortField, sortDirection),
    [entries, sortField, sortDirection]
  );

  async function handleAdd(input: HistoryEntryInput) {
    const response = await fetch("/api/history", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error("Failed to add entry");
    const created: HistoryEntryDTO = await response.json();
    setEntries((prev) => [...prev, created]);
    setIsAdding(false);
  }

  async function handleEdit(id: string, input: Partial<HistoryEntryInput>) {
    const response = await fetch(`/api/history/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    });
    if (!response.ok) throw new Error("Failed to update entry");
    const updated: HistoryEntryDTO = await response.json();
    setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
  }

  async function handleDelete(entry: HistoryEntryDTO) {
    const response = await fetch(`/api/history/${entry.id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    }
    setDeletingEntry(null);
  }

  async function handleSetCoverImage(entry: HistoryEntryDTO, url: string) {
    await handleEdit(entry.id, { coverImageUrl: url });
  }

  return (
    <div>
      <HistoryToolbar
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
        <HistoryTable
          entries={sortedEntries}
          onEdit={setEditingEntry}
          onDelete={setDeletingEntry}
        />
      ) : (
        <HistoryCards
          entries={sortedEntries}
          onEdit={setEditingEntry}
          onDelete={setDeletingEntry}
          onSetCoverImage={handleSetCoverImage}
        />
      )}

      {isAdding && (
        <HistoryFormModal
          onSubmit={handleAdd}
          onClose={() => setIsAdding(false)}
        />
      )}

      {editingEntry && (
        <HistoryFormModal
          initialEntry={editingEntry}
          onSubmit={async (input) => {
            await handleEdit(editingEntry.id, input);
            setEditingEntry(null);
          }}
          onClose={() => setEditingEntry(null)}
        />
      )}

      {deletingEntry && (
        <ConfirmDialog
          message={`Remove "${deletingEntry.title}" from your history? This cannot be undone.`}
          onConfirm={() => handleDelete(deletingEntry)}
          onCancel={() => setDeletingEntry(null)}
        />
      )}
    </div>
  );
}
