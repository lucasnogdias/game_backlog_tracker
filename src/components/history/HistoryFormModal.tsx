"use client";

import Link from "next/link";
import { useState, FormEvent } from "react";
import type { HistoryEntryDTO, HistoryEntryInput } from "@/types/history";
import type { GameLookupResult } from "@/types/game-lookup";
import { HISTORY_STATUSES } from "@/types/history";
import { parsePlaytime, formatPlaytime } from "@/lib/playtime";
import styles from "./HistoryFormModal.module.css";
import shared from "@/styles/shared.module.css";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { GameLookupModal } from "@/components/shared/GameLookupModal";
import { useGameLookupAvailability } from "@/components/shared/useGameLookupAvailability";

interface HistoryFormModalProps {
  initialEntry?: HistoryEntryDTO;
  onSubmit: (input: HistoryEntryInput) => Promise<void>;
  onClose: () => void;
}

function toDateInputValue(isoDate: string | null): string {
  if (!isoDate) return "";
  return isoDate.slice(0, 10); // "YYYY-MM-DD"
}

function toMonthInputValue(isoDate: string | null): string {
  if (!isoDate) return "";
  return isoDate.slice(0, 7); // "YYYY-MM"
}

export function HistoryFormModal({
  initialEntry,
  onSubmit,
  onClose,
}: HistoryFormModalProps) {
  const [title, setTitle] = useState(initialEntry?.title ?? "");
  const [status, setStatus] = useState(
    initialEntry?.status ?? HISTORY_STATUSES[0]
  );
  const [playtime, setPlaytime] = useState(
    formatPlaytime(initialEntry?.playtimeMinutes ?? null)
  );
  const [finishedOn, setFinishedOn] = useState(
    toDateInputValue(initialEntry?.finishedOn ?? null)
  );
  const [releaseDate, setReleaseDate] = useState(
    toMonthInputValue(initialEntry?.releaseDate ?? null)
  );
  const [platform, setPlatform] = useState(initialEntry?.platform ?? "");
  const [notes, setNotes] = useState(initialEntry?.notes ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(
    initialEntry?.coverImageUrl ?? ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [pendingLookupResult, setPendingLookupResult] =
    useState<GameLookupResult | null>(null);
  const gameLookup = useGameLookupAvailability();

  function applyLookupResult(result: GameLookupResult) {
    if (result.releaseDate) {
      setReleaseDate(result.releaseDate.slice(0, 7));
    }
    setPendingLookupResult(null);
    setIsLookingUp(false);
  }

  function handleLookupSelect(result: GameLookupResult) {
    if (result.releaseDate && releaseDate !== "") {
      setPendingLookupResult(result);
      setIsLookingUp(false);
      return;
    }

    applyLookupResult(result);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }

    let playtimeMinutes: number | null;
    try {
      playtimeMinutes = parsePlaytime(playtime);
    } catch (parseError) {
      setError((parseError as Error).message);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        title: title.trim(),
        status,
        playtimeMinutes,
        finishedOn: finishedOn || null,
        releaseDate: releaseDate ? `${releaseDate}-01` : null,
        notes: notes.trim() || null,
        platform: platform.trim() || null,
        coverImageUrl: coverImageUrl.trim() || null,
      });
    } catch {
      setError("Something went wrong saving this entry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={shared.overlay}>
      <div className={`${shared.dialog} ${styles.dialog}`}>
        <h2 className={shared.dialogTitle}>
          {initialEntry ? "Edit Entry" : "Add Entry"}
        </h2>
        <form onSubmit={handleSubmit} className={shared.form}>
          <label className={shared.fieldGroup}>
            Title
            <div className={styles.titleInputRow}>
              <input
                className={`${shared.textInput} ${styles.titleInput}`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setIsLookingUp(true)}
                className={styles.lookupButton}
                disabled={!title.trim() || !gameLookup.available}
                title={
                  gameLookup.available
                    ? undefined
                    : "Unavailable until a RAWG API key is configured."
                }
              >
                Find details
              </button>
            </div>
            {!gameLookup.available && (
              <span className={styles.lookupUnavailable}>
                Game lookup is unavailable.
                {gameLookup.canConfigure && (
                  <>
                    {" "}
                    <Link href="/settings">Configure it in Settings.</Link>
                  </>
                )}
              </span>
            )}
          </label>

          <label className={shared.fieldGroup}>
            Status
            <select
              className={shared.select}
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as (typeof HISTORY_STATUSES)[number])
              }
            >
              {HISTORY_STATUSES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <div className={shared.fieldRow}>
            <label className={shared.fieldGroup}>
              Playtime (HH:mm)
              <input
                className={shared.textInput}
                value={playtime}
                placeholder="e.g. 45:30"
                onChange={(e) => setPlaytime(e.target.value)}
              />
            </label>
            <label className={shared.fieldGroup}>
              Finished On
              <input
                type="date"
                className={shared.textInput}
                value={finishedOn}
                onChange={(e) => setFinishedOn(e.target.value)}
              />
            </label>
          </div>

          <div className={shared.fieldRow}>
            <label className={shared.fieldGroup}>
              Platform
              <input
                className={shared.textInput}
                value={platform}
                placeholder="e.g. Switch"
                onChange={(e) => setPlatform(e.target.value)}
              />
            </label>
            <label className={shared.fieldGroup}>
              Release Date
              <input
                type="month"
                className={shared.textInput}
                value={releaseDate}
                onChange={(e) => setReleaseDate(e.target.value)}
              />
            </label>
          </div>

          <label className={shared.fieldGroup}>
            Cover Image URL
            <input
              type="url"
              className={shared.textInput}
              value={coverImageUrl}
              placeholder="https://..."
              onChange={(e) => setCoverImageUrl(e.target.value)}
            />
          </label>

          <label className={shared.fieldGroup}>
            Notes / Review
            <textarea
              className={shared.textarea}
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>

          {error && <p className={shared.errorText}>{error}</p>}

          <div className={shared.actionsRow}>
            <button type="button" onClick={onClose} className={shared.button}>
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`${shared.button} ${shared.buttonPrimary}`}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>

      {isLookingUp && (
        <GameLookupModal
          initialQuery={title}
          onSelect={handleLookupSelect}
          onClose={() => setIsLookingUp(false)}
          showEstimatedHours={false}
        />
      )}

      {pendingLookupResult && (
        <ConfirmDialog
          message={`Applying "${pendingLookupResult.title}" will replace the existing release date. Continue?`}
          confirmLabel="Apply details"
          variant="default"
          onConfirm={() => applyLookupResult(pendingLookupResult)}
          onCancel={() => setPendingLookupResult(null)}
        />
      )}
    </div>
  );
}
