"use client";

import Link from "next/link";
import { useRef, useState, FormEvent, KeyboardEvent } from "react";
import type { HistoryEntryDTO, HistoryEntryInput } from "@/types/history";
import type { GameLookupResult } from "@/types/game-lookup";
import { HISTORY_STATUSES } from "@/types/history";
import { parsePlaytime, formatPlaytime } from "@/lib/playtime";
import styles from "./HistoryFormModal.module.css";
import shared from "@/styles/shared.module.css";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { GameLookupModal } from "@/components/shared/GameLookupModal";
import { useGameLookupAvailability } from "@/components/shared/useGameLookupAvailability";
import { toMonthInputValue } from "@/lib/date-input";

interface HistoryFormModalProps {
  initialEntry?: HistoryEntryDTO;
  onSubmit: (input: HistoryEntryInput) => Promise<void>;
  onClose: () => void;
}

function toDateInputValue(isoDate: string | null): string {
  if (!isoDate) return "";
  return isoDate.slice(0, 10); // "YYYY-MM-DD"
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
  const statusRef = useRef<HTMLSelectElement>(null);
  const playtimeRef = useRef<HTMLInputElement>(null);
  const finishedOnRef = useRef<HTMLInputElement>(null);
  const platformRef = useRef<HTMLInputElement>(null);
  const releaseDateRef = useRef<HTMLInputElement>(null);
  const coverImageUrlRef = useRef<HTMLInputElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  function applyLookupResult(result: GameLookupResult) {
    setTitle(result.title);
    if (result.releaseDate) {
      setReleaseDate(result.releaseDate.slice(0, 7));
    }
    if (result.coverImageUrl) {
      setCoverImageUrl(result.coverImageUrl);
    }
    setPendingLookupResult(null);
    setIsLookingUp(false);
  }

  function handleLookupSelect(result: GameLookupResult) {
    if (
      (result.releaseDate && releaseDate !== "") ||
      (result.coverImageUrl && coverImageUrl !== "")
    ) {
      setPendingLookupResult(result);
      setIsLookingUp(false);
      return;
    }

    applyLookupResult(result);
  }

  function lookupOverwriteMessage(result: GameLookupResult): string {
    const fields = [
      result.releaseDate !== null && releaseDate !== "" ? "release date" : null,
      result.coverImageUrl !== null && coverImageUrl !== ""
        ? "cover image"
        : null,
    ].filter(Boolean);

    return `Applying "${result.title}" will replace the existing ${fields.join(
      " and "
    )}. Continue?`;
  }

  function handleTitleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (title.trim() && gameLookup.available) {
      setIsLookingUp(true);
      return;
    }
    statusRef.current?.focus();
  }

  function focusNext(
    event: KeyboardEvent<HTMLInputElement | HTMLSelectElement>,
    nextField: React.RefObject<HTMLElement | null>
  ) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    nextField.current?.focus();
  }

  function handleNotesKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    event.currentTarget.form?.requestSubmit();
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
            <div className={shared.inlineInputRow}>
              <input
                className={`${shared.textInput} ${shared.flexibleInput}`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onKeyDown={handleTitleKeyDown}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setIsLookingUp(true)}
                className={shared.lookupButton}
                disabled={!title.trim() || !gameLookup.available}
                title={
                  gameLookup.available
                    ? undefined
                    : "Unavailable until IGDB credentials are configured."
                }
              >
                Find details
              </button>
            </div>
            {!gameLookup.available && (
              <span className={shared.lookupUnavailable}>
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
              ref={statusRef}
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as (typeof HISTORY_STATUSES)[number])
              }
              onKeyDown={(event) => focusNext(event, playtimeRef)}
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
                ref={playtimeRef}
                value={playtime}
                placeholder="e.g. 45:30"
                onChange={(e) => setPlaytime(e.target.value)}
                onKeyDown={(event) => focusNext(event, finishedOnRef)}
              />
            </label>
            <label className={shared.fieldGroup}>
              Finished On
              <input
                type="date"
                ref={finishedOnRef}
                className={shared.textInput}
                value={finishedOn}
                onChange={(e) => setFinishedOn(e.target.value)}
                onKeyDown={(event) => focusNext(event, platformRef)}
              />
            </label>
          </div>

          <div className={shared.fieldRow}>
            <label className={shared.fieldGroup}>
              Platform
              <input
                className={shared.textInput}
                ref={platformRef}
                value={platform}
                placeholder="e.g. Switch"
                onChange={(e) => setPlatform(e.target.value)}
                onKeyDown={(event) => focusNext(event, releaseDateRef)}
              />
            </label>
            <label className={shared.fieldGroup}>
              Release Date
              <input
                type="month"
                ref={releaseDateRef}
                className={shared.textInput}
                value={releaseDate}
                onChange={(e) => setReleaseDate(e.target.value)}
                onKeyDown={(event) => focusNext(event, coverImageUrlRef)}
              />
            </label>
          </div>

          <label className={shared.fieldGroup}>
            Cover Image URL
            <input
              type="url"
              ref={coverImageUrlRef}
              className={shared.textInput}
              value={coverImageUrl}
              placeholder="https://..."
              onChange={(e) => setCoverImageUrl(e.target.value)}
              onKeyDown={(event) => focusNext(event, notesRef)}
            />
          </label>

          <label className={shared.fieldGroup}>
            Notes / Review
            <textarea
              className={shared.textarea}
              ref={notesRef}
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onKeyDown={handleNotesKeyDown}
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
        />
      )}

      {pendingLookupResult && (
        <ConfirmDialog
          message={lookupOverwriteMessage(pendingLookupResult)}
          confirmLabel="Apply details"
          variant="default"
          onConfirm={() => applyLookupResult(pendingLookupResult)}
          onCancel={() => setPendingLookupResult(null)}
        />
      )}
    </div>
  );
}
