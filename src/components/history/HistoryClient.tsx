"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { JournalEntryModal } from "./JournalEntryModal";
import { PlaytimeSummary } from "./PlaytimeSummary";

interface HistoryClientProps {
  initialEntries: HistoryEntryDTO[];
}

export function HistoryClient({ initialEntries }: HistoryClientProps) {
  const router = useRouter();
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
  const [movingEntry, setMovingEntry] = useState<HistoryEntryDTO | null>(null);
  const [addingJournalEntry, setAddingJournalEntry] =
    useState<HistoryEntryDTO | null>(null);

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

  async function handleMoveToBacklog(entry: HistoryEntryDTO) {
    const response = await fetch(`/api/history/${entry.id}/move-to-backlog`, {
      method: "POST",
    });
    if (response.ok) {
      setEntries((prev) => prev.filter((e) => e.id !== entry.id));
    }
    setMovingEntry(null);
  }

  async function handleAddJournalEntry(entry: HistoryEntryDTO, content: string) {
    const response = await fetch(`/api/history/${entry.id}/journal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!response.ok) throw new Error("Failed to add journal entry");
    setAddingJournalEntry(null);
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
      <PlaytimeSummary entries={entries} />

      {view === "list" ? (
        <HistoryTable
          entries={sortedEntries}
          onEdit={setEditingEntry}
          onAddJournalEntry={setAddingJournalEntry}
          onViewJournal={(entry) => router.push(`/history/${entry.id}/journal`)}
          onDelete={setDeletingEntry}
          onMoveToBacklog={setMovingEntry}
        />
      ) : (
        <HistoryCards
          entries={sortedEntries}
          onEdit={setEditingEntry}
          onAddJournalEntry={setAddingJournalEntry}
          onViewJournal={(entry) => router.push(`/history/${entry.id}/journal`)}
          onDelete={setDeletingEntry}
          onSetCoverImage={handleSetCoverImage}
          onMoveToBacklog={setMovingEntry}
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

      {movingEntry && (
        <ConfirmDialog
          message={`Move "${movingEntry.title}" back to your backlog? Status, playtime, and finished date will be lost.`}
          confirmLabel="Move to Backlog"
          variant="default"
          onConfirm={() => handleMoveToBacklog(movingEntry)}
          onCancel={() => setMovingEntry(null)}
        />
      )}

      {addingJournalEntry && (
        <JournalEntryModal
          gameTitle={addingJournalEntry.title}
          onSubmit={(content) => handleAddJournalEntry(addingJournalEntry, content)}
          onClose={() => setAddingJournalEntry(null)}
        />
      )}
    </div>
  );
}
