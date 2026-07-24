"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { HistoryEntryDTO } from "@/types/history";
import type {
  JournalEntryDTO,
  JournalImageAttachmentDTO,
  JournalImageAttachmentInput,
} from "@/types/journal";
import { formatDateTime } from "@/lib/format-date";
import { saveJournalFiles } from "@/lib/journal-media";
import { JournalEntryModal } from "./JournalEntryModal";
import styles from "./JournalPageClient.module.css";
import shared from "@/styles/shared.module.css";

interface JournalPageClientProps {
  historyEntry: HistoryEntryDTO;
  initialEntries: JournalEntryDTO[];
}

type CreatedJournalEntry = JournalEntryDTO & { journalEntryNumber: number };

function JournalScreenshots({
  attachments,
  onSelect,
}: {
  attachments: JournalImageAttachmentDTO[];
  onSelect: (source: string, name: string) => void;
}) {
  const [sources, setSources] = useState<Record<string, string>>({});
  const [error, setError] = useState(false);
  const media =
    typeof window === "undefined" ? undefined : window.journalMedia;

  useEffect(() => {
    if (!media || attachments.length === 0) return;
    let active = true;
    Promise.all(
      attachments.map(async (attachment) => [
        attachment.id,
        await media.read(attachment.storageKey),
      ])
    )
      .then((images) => {
        if (active) setSources(Object.fromEntries(images));
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [attachments, media]);

  if (attachments.length === 0) return null;
  if (!media) {
    return (
      <p className={styles.mediaUnavailable}>
        Screenshots are unavailable outside the desktop app.
      </p>
    );
  }
  if (error) {
    return <p className={styles.mediaUnavailable}>Unable to load screenshots.</p>;
  }
  return (
    <div className={styles.screenshots}>
      {attachments.map((attachment) =>
        sources[attachment.id] ? (
          <button
            key={attachment.id}
            type="button"
            className={styles.screenshotButton}
            onClick={() => onSelect(sources[attachment.id], attachment.originalName)}
            aria-label={`Expand screenshot ${attachment.originalName}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- IPC returns a local data URL. */}
            <img
              src={sources[attachment.id]}
              alt={attachment.originalName}
              className={styles.screenshot}
            />
          </button>
        ) : (
          <span key={attachment.id} className={styles.screenshotLoading}>
            Loading {attachment.originalName}…
          </span>
        )
      )}
    </div>
  );
}

function ScreenshotLightbox({
  source,
  name,
  onClose,
}: {
  source: string;
  name: string;
  onClose: () => void;
}) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className={styles.lightbox}
      role="dialog"
      aria-modal="true"
      aria-label={name}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- IPC returns a local data URL. */}
      <img src={source} alt={name} className={styles.lightboxImage} />
      <button
        type="button"
        className={styles.lightboxClose}
        onClick={onClose}
        aria-label="Close screenshot"
      >
        ×
      </button>
    </div>
  );
}

export function JournalPageClient({
  historyEntry,
  initialEntries,
}: JournalPageClientProps) {
  const [entries, setEntries] = useState(initialEntries);
  const [isAdding, setIsAdding] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntryDTO | null>(null);
  const [isNewestFirst, setIsNewestFirst] = useState(false);
  const [selectedScreenshot, setSelectedScreenshot] = useState<{
    source: string;
    name: string;
  } | null>(null);

  const sortedEntries = useMemo(
    () =>
      [...entries].sort((first, second) =>
        isNewestFirst
          ? second.createdAt.localeCompare(first.createdAt)
          : first.createdAt.localeCompare(second.createdAt)
      ),
    [entries, isNewestFirst]
  );

  async function updateAttachments(
    entry: JournalEntryDTO,
    content: string,
    attachments: JournalImageAttachmentInput[]
  ): Promise<JournalEntryDTO> {
    const response = await fetch(
      `/api/history/${historyEntry.id}/journal/${entry.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, attachments }),
      }
    );
    if (!response.ok) throw new Error("Failed to update journal entry");
    return response.json();
  }

  async function handleAdd(
    content: string,
    files: File[]
  ) {
    const response = await fetch(`/api/history/${historyEntry.id}/journal`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    if (!response.ok) throw new Error("Failed to add journal entry");

    const created: CreatedJournalEntry = await response.json();
    let savedEntry: JournalEntryDTO = created;
    const savedAttachments = await saveJournalFiles(
      historyEntry.id,
      created.id,
      historyEntry.title,
      created.journalEntryNumber,
      files
    );
    if (savedAttachments.length) {
      try {
        savedEntry = await updateAttachments(created, content, savedAttachments);
      } catch (error) {
        await Promise.all(
          savedAttachments.map((attachment) =>
            window.journalMedia!.remove(attachment.storageKey)
          )
        );
        throw error;
      }
    }
    setEntries((previousEntries) => [...previousEntries, savedEntry]);
    setIsAdding(false);
  }

  async function handleEdit(
    content: string,
    files: File[],
    attachments: JournalImageAttachmentDTO[]
  ) {
    if (!editingEntry) return;
    const savedAttachments = await saveJournalFiles(
      historyEntry.id,
      editingEntry.id,
      historyEntry.title,
      [...entries]
        .sort((first, second) => first.createdAt.localeCompare(second.createdAt))
        .findIndex((entry) => entry.id === editingEntry.id) + 1,
      files
    );
    let updated: JournalEntryDTO;
    try {
      updated = await updateAttachments(editingEntry, content, [
        ...attachments,
        ...savedAttachments,
      ]);
    } catch (error) {
      await Promise.all(
        savedAttachments.map((attachment) =>
          window.journalMedia!.remove(attachment.storageKey)
        )
      );
      throw error;
    }
    await Promise.all(
      editingEntry.attachments
        .filter(
          (attachment) =>
            !attachments.some((remaining) => remaining.id === attachment.id)
        )
        .map((attachment) => window.journalMedia?.remove(attachment.storageKey))
    );
    setEntries((previousEntries) =>
      previousEntries.map((entry) => (entry.id === updated.id ? updated : entry))
    );
    setEditingEntry(null);
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
              <div className={styles.entryHeader}>
                <p className={styles.entryDate}>{formatDateTime(entry.createdAt)}</p>
                <button
                  type="button"
                  className={styles.editButton}
                  onClick={() => setEditingEntry(entry)}
                >
                  Edit
                </button>
              </div>
              <p className={styles.entryContent}>{entry.content}</p>
              <JournalScreenshots
                attachments={entry.attachments}
                onSelect={(source, name) => setSelectedScreenshot({ source, name })}
              />
            </article>
          ))}
        </div>
      )}

      {isAdding && (
        <JournalEntryModal
          gameTitle={historyEntry.title}
          journalEntryNumber={entries.length + 1}
          onSubmit={handleAdd}
          onClose={() => setIsAdding(false)}
        />
      )}

      {editingEntry && (
        <JournalEntryModal
          gameTitle={historyEntry.title}
          journalEntryNumber={
            [...entries]
              .sort((first, second) => first.createdAt.localeCompare(second.createdAt))
              .findIndex((entry) => entry.id === editingEntry.id) + 1
          }
          initialContent={editingEntry.content}
          initialAttachments={editingEntry.attachments}
          onSubmit={handleEdit}
          onClose={() => setEditingEntry(null)}
        />
      )}
      {selectedScreenshot && (
        <ScreenshotLightbox
          source={selectedScreenshot.source}
          name={selectedScreenshot.name}
          onClose={() => setSelectedScreenshot(null)}
        />
      )}
    </>
  );
}
