"use client";

import Link from "next/link";
import { useState, FormEvent } from "react";
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

  function addPlatform() {
    const trimmed = platformDraft.trim();
    if (trimmed && !platforms.includes(trimmed)) {
      setPlatforms([...platforms, trimmed]);
    }
    setPlatformDraft("");
  }

  function removePlatform(platform: string) {
    setPlatforms(platforms.filter((p) => p !== platform));
  }

  function applyLookupResult(result: GameLookupResult) {
    if (result.estimatedHours !== null) {
      setEstimatedHours(result.estimatedHours.toString());
    }
    if (result.releaseDate) {
      setReleaseDate(result.releaseDate.slice(0, 7));
    }
    setPendingLookupResult(null);
    setIsLookingUp(false);
  }

  function handleLookupSelect(result: GameLookupResult) {
    const overwritesEstimatedHours =
      result.estimatedHours !== null && estimatedHours !== "";
    const overwritesReleaseDate = result.releaseDate !== null && releaseDate !== "";

    if (overwritesEstimatedHours || overwritesReleaseDate) {
      setPendingLookupResult(result);
      setIsLookingUp(false);
      return;
    }

    applyLookupResult(result);
  }

  function lookupOverwriteMessage(result: GameLookupResult): string {
    const fields = [
      result.estimatedHours !== null && estimatedHours !== ""
        ? "estimated hours"
        : null,
      result.releaseDate !== null && releaseDate !== "" ? "release date" : null,
    ].filter(Boolean);

    return `Applying "${result.title}" will replace the existing ${fields.join(
      " and "
    )}. Continue?`;
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
      await onSubmit({
        title: title.trim(),
        owned,
        platforms,
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
                    : "Unavailable until a RAWG API key is configured."
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
              type="checkbox"
              checked={owned}
              onChange={(e) => setOwned(e.target.checked)}
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
                className={`${shared.textInput} ${styles.platformInput}`}
                value={platformDraft}
                placeholder="e.g. Switch"
                onChange={(e) => setPlatformDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addPlatform();
                  }
                }}
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
            Hype (1-10)
            <input
              type="number"
              min={1}
              max={10}
              className={shared.textInput}
              value={hype}
              onChange={(e) => setHype(e.target.value)}
            />
          </label>

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
            Notes
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
