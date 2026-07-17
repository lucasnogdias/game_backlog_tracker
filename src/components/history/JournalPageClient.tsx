"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { HistoryEntryDTO } from "@/types/history";
import type { JournalEntryDTO } from "@/types/journal";
import { formatDateTime } from "@/lib/format-date";
import { JournalEntryModal } from "./JournalEntryModal";
import styles from "./JournalPageClient.module.css";
import shared from "@/styles/shared.module.css";

interface JournalPageClientProps {
  historyEntry: HistoryEntryDTO;
  initialEntries: JournalEntryDTO[];
}

export function JournalPageClient({
  historyEntry,
  initialEntries,
}: JournalPageClientProps) {
  const [entries, setEntries] = useState(initialEntries);
  const [isAdding, setIsAdding] = useState(false);
  const [isNewestFirst, setIsNewestFirst] = useState(false);

  const sortedEntries = useMemo(
    () =>
      [...entries].sort((first, second) =>
        isNewestFirst
          ? second.createdAt.localeCompare(first.createdAt)
          : first.createdAt.localeCompare(second.createdAt)
      ),
    [entries, isNewestFirst]
  );

  async function handleAdd(content: string) {
    const response = await fetch(`/api/history/${historyEntry.id}/journal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!response.ok) throw new Error("Failed to add journal entry");

    const created: JournalEntryDTO = await response.json();
    setEntries((previousEntries) => [...previousEntries, created]);
    setIsAdding(false);
  }

  return (
    <>
      <header className={styles.header}>
        <div>
          <Link href="/history" className={styles.backLink}>
            ← Back to History
          </Link>
          <h1 className={styles.heading}>{historyEntry.title} Journal</h1>
        </div>
        <div className={styles.controls}>
          <button
            type="button"
            onClick={() => setIsNewestFirst((current) => !current)}
            className={styles.orderToggle}
          >
            {isNewestFirst ? "Newest first" : "Oldest first"}
          </button>
          <button
            type="button"
            onClick={() => setIsAdding(true)}
            className={styles.addButton}
          >
            + Add Journal Entry
          </button>
        </div>
      </header>

      {sortedEntries.length === 0 ? (
        <p className={shared.emptyState}>
          No journal entries yet. Add one to start recording your adventure!
        </p>
      ) : (
        <div className={styles.entries}>
          {sortedEntries.map((entry) => (
            <article key={entry.id} className={styles.entry}>
              <p className={styles.entryDate}>{formatDateTime(entry.createdAt)}</p>
              <p className={styles.entryContent}>{entry.content}</p>
            </article>
          ))}
        </div>
      )}

      {isAdding && (
        <JournalEntryModal
          gameTitle={historyEntry.title}
          onSubmit={handleAdd}
          onClose={() => setIsAdding(false)}
        />
      )}
    </>
  );
}
