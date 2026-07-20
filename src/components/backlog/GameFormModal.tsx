"use client";

import Link from "next/link";
import { useRef, useState, FormEvent, KeyboardEvent } from "react";
import type { BacklogGameDTO, BacklogGameInput } from "@/types/backlog";
import type { GameLookupResult } from "@/types/game-lookup";
import styles from "./GameFormModal.module.css";
import shared from "@/styles/shared.module.css";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { GameLookupModal } from "@/components/shared/GameLookupModal";
import { useGameLookupAvailability } from "@/components/shared/useGameLookupAvailability";
import { toMonthInputValue } from "@/lib/date-input";

interface GameFormModalProps {
  initialGame?: BacklogGameDTO;
  onSubmit: (input: BacklogGameInput) => Promise<void>;
  onClose: () => void;
}

export function GameFormModal({
  initialGame,
  onSubmit,
  onClose,
}: GameFormModalProps) {
  const [title, setTitle] = useState(initialGame?.title ?? "");
  const [owned, setOwned] = useState(initialGame?.owned ?? false);
  const [platforms, setPlatforms] = useState<string[]>(
    initialGame?.platforms ?? []
  );
  const [platformDraft, setPlatformDraft] = useState("");
  const [estimatedHours, setEstimatedHours] = useState(
    initialGame?.estimatedHours?.toString() ?? ""
  );
  const [releaseDate, setReleaseDate] = useState(
    toMonthInputValue(initialGame?.releaseDate ?? null)
  );
  const [hype, setHype] = useState(initialGame?.hype?.toString() ?? "");
  const [notes, setNotes] = useState(initialGame?.notes ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(
    initialGame?.coverImageUrl ?? ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [pendingLookupResult, setPendingLookupResult] =
    useState<GameLookupResult | null>(null);
  const gameLookup = useGameLookupAvailability();
  const ownedRef = useRef<HTMLInputElement>(null);
  const platformRef = useRef<HTMLInputElement>(null);
  const releaseDateRef = useRef<HTMLInputElement>(null);
  const hypeRef = useRef<HTMLInputElement>(null);
  const coverImageUrlRef = useRef<HTMLInputElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  function addPlatform() {
    addPlatformDraft();
  }

  function removePlatform(platform: string) {
    setPlatforms(platforms.filter((p) => p !== platform));
  }

  function addPlatformDraft(): string | null {
    const trimmed = platformDraft.trim();
    setPlatformDraft("");
    if (!trimmed || platforms.includes(trimmed)) return null;
    setPlatforms([...platforms, trimmed]);
    return trimmed;
  }

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
    const overwritesReleaseDate = result.releaseDate !== null && releaseDate !== "";
    const overwritesCoverImage =
      result.coverImageUrl !== null && coverImageUrl !== "";

    if (overwritesReleaseDate || overwritesCoverImage) {
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
    ownedRef.current?.focus();
  }

  function focusNext(
    event: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    nextField: React.RefObject<HTMLElement | null>
  ) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    nextField.current?.focus();
  }

  function handlePlatformKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== "Enter") return;
    event.preventDefault();
    addPlatformDraft();
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

    setIsSubmitting(true);
    setError(null);
    try {
      const draftedPlatform = addPlatformDraft();
      const submittedPlatforms = draftedPlatform
        ? [...platforms, draftedPlatform]
        : platforms;
      await onSubmit({
        title: title.trim(),
        owned,
        platforms: submittedPlatforms,
        estimatedHours: estimatedHours ? Number(estimatedHours) : null,
        releaseDate: releaseDate ? `${releaseDate}-01` : null,
        hype: hype ? Number(hype) : null,
        notes: notes.trim() || null,
        coverImageUrl: coverImageUrl.trim() || null,
      });
    } catch {
      setError("Something went wrong saving this game. Please try again.");
    } finally {
      setIsSubmitting(false);
    }

  }

  return (
    <div className={shared.overlay}>
      <div className={`${shared.dialog} ${styles.dialog}`}>
        <h2 className={shared.dialogTitle}>
          {initialGame ? "Edit Game" : "Add Game"}
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

          <label className={shared.checkboxLabel}>
            <input
              ref={ownedRef}
              type="checkbox"
              checked={owned}
              onChange={(e) => setOwned(e.target.checked)}
              onKeyDown={(event) => focusNext(event, platformRef)}
            />
            Owned
          </label>

          <div className={shared.fieldGroup}>
            Platforms
            <div className={styles.platformPills}>
              {platforms.map((platform) => (
                <span key={platform} className={styles.platformPill}>
                  {platform}
                  <button
                    type="button"
                    onClick={() => removePlatform(platform)}
                    aria-label={`Remove ${platform}`}
                    className={styles.removePlatformButton}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className={styles.platformInputRow}>
              <input
                ref={platformRef}
                className={`${shared.textInput} ${styles.platformInput}`}
                value={platformDraft}
                placeholder="e.g. Switch"
                onChange={(e) => setPlatformDraft(e.target.value)}
                onKeyDown={handlePlatformKeyDown}
              />
              <button
                type="button"
                onClick={addPlatform}
                className={styles.addPlatformButton}
              >
                Add
              </button>
            </div>
          </div>

          <div className={shared.fieldRow}>
            <label className={shared.fieldGroup}>
              Est. Hours
              <input
                type="number"
                min={0}
                step={0.5}
                className={shared.textInput}
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
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
                onKeyDown={(event) => focusNext(event, hypeRef)}
              />
            </label>
          </div>

          <label className={shared.fieldGroup}>
            Hype (1-10)
            <input
              type="number"
              ref={hypeRef}
              min={1}
              max={10}
              className={shared.textInput}
              value={hype}
              onChange={(e) => setHype(e.target.value)}
              onKeyDown={(event) => focusNext(event, coverImageUrlRef)}
            />
          </label>

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
            Notes
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
