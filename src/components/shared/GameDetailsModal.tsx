"use client";

import { useEffect, useRef } from "react";
import type { BacklogGameDTO } from "@/types/backlog";
import type { HistoryEntryDTO } from "@/types/history";
import { formatDate, formatDateTime, formatMonthYear } from "@/lib/format-date";
import { formatPlaytime } from "@/lib/playtime";
import styles from "./GameDetailsModal.module.css";
import shared from "@/styles/shared.module.css";

type GameDetails =
  | { type: "backlog"; game: BacklogGameDTO }
  | { type: "history"; entry: HistoryEntryDTO };

interface GameDetailsModalProps {
  details: GameDetails;
  onClose: () => void;
  onEdit: () => void;
  onAddJournalEntry?: () => void;
  onViewJournal?: () => void;
}

interface Detail {
  label: string;
  value: string;
}

function displayValue(value: string | number | null): string {
  return value === null || value === "" ? "—" : String(value);
}

function getDetails(details: GameDetails): Detail[] {
  if (details.type === "backlog") {
    const { game } = details;
    return [
      { label: "Ownership", value: game.owned ? "Owned" : "Not owned" },
      { label: "Platforms", value: game.platforms.join(", ") || "—" },
      { label: "Hype", value: game.hype === null ? "—" : `${game.hype}/10` },
      {
        label: "Estimated Time",
        value: game.estimatedHours === null ? "—" : `${game.estimatedHours}h`,
      },
      {
        label: "Release Date",
        value: game.releaseDate ? formatMonthYear(game.releaseDate) : "—",
      },
      { label: "Notes", value: displayValue(game.notes) },
      { label: "Added", value: formatDateTime(game.createdAt) },
      { label: "Last Updated", value: formatDateTime(game.updatedAt) },
    ];
  }

  const { entry } = details;
  return [
    { label: "Status", value: entry.status },
    { label: "Playtime", value: displayValue(formatPlaytime(entry.playtimeMinutes)) },
    { label: "Finished On", value: entry.finishedOn ? formatDate(entry.finishedOn) : "—" },
    { label: "Platform", value: displayValue(entry.platform) },
    {
      label: "Release Date",
      value: entry.releaseDate ? formatMonthYear(entry.releaseDate) : "—",
    },
    { label: "Review", value: displayValue(entry.notes) },
    { label: "Added", value: formatDateTime(entry.createdAt) },
    { label: "Last Updated", value: formatDateTime(entry.updatedAt) },
  ];
}

export function GameDetailsModal({
  details,
  onClose,
  onEdit,
  onAddJournalEntry,
  onViewJournal,
}: GameDetailsModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const activeElement = useRef<HTMLElement | null>(null);
  const item = details.type === "backlog" ? details.game : details.entry;
  const fields = getDetails(details);

  useEffect(() => {
    activeElement.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      activeElement.current?.focus();
    };
  }, [onClose]);

  return (
    <div
      className={shared.overlay}
      data-testid="details-overlay"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={`${shared.dialog} ${styles.dialog}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="game-details-title"
      >
        <div className={styles.header}>
          <h2 id="game-details-title" className={shared.dialogTitle}>
            {item.title}
          </h2>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.iconButton}
              onClick={onEdit}
              aria-label="Edit"
              title="Edit"
            >
              ✎
            </button>
            <button
              ref={closeButtonRef}
              type="button"
              className={styles.iconButton}
              onClick={onClose}
              aria-label="Close details"
              title="Close details"
            >
              ×
            </button>
          </div>
        </div>
        <div className={styles.content}>
          <div className={styles.cover}>
            {item.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- external, arbitrary user-provided URLs
              <img src={item.coverImageUrl} alt={`${item.title} cover art`} />
            ) : (
              <div className={styles.coverPlaceholder} aria-label="No cover art available">
                <span>🎮</span>
                No cover art
              </div>
            )}
          </div>
          <dl className={styles.details}>
            {fields.map((field) => (
              <div
                key={field.label}
                className={`${styles.detail} ${
                  field.label === "Notes" || field.label === "Review" ? styles.longText : ""
                }`}
              >
                <dt>{field.label}</dt>
                <dd>{field.value}</dd>
              </div>
            ))}
            {onAddJournalEntry && (
              <div className={styles.journalAction}>
                <button type="button" className={shared.textAction} onClick={onAddJournalEntry}>
                  Add Journal Entry
                </button>
              </div>
            )}
            {onViewJournal && (
              <div className={styles.journalAction}>
                <button type="button" className={shared.textAction} onClick={onViewJournal}>
                  View Journal
                </button>
              </div>
            )}
          </dl>
        </div>
      </div>
    </div>
  );
}
