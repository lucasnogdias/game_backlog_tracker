"use client";

import { useState, FormEvent } from "react";
import type { BacklogGameDTO } from "@/types/backlog";
import { HISTORY_STATUSES, type HistoryStatus } from "@/types/history";
import styles from "./MoveToHistoryModal.module.css";
import shared from "@/styles/shared.module.css";

interface MoveToHistoryModalProps {
  game: BacklogGameDTO;
  onSubmit: (input: {
    status: HistoryStatus;
    platform: string | null;
  }) => Promise<void>;
  onClose: () => void;
}

export function MoveToHistoryModal({
  game,
  onSubmit,
  onClose,
}: MoveToHistoryModalProps) {
  const [status, setStatus] = useState<HistoryStatus>(HISTORY_STATUSES[0]);
  const [platform, setPlatform] = useState(
    game.platforms.length === 1 ? game.platforms[0] : ""
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const needsPlatformChoice = game.platforms.length > 1;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (needsPlatformChoice && !platform) {
      setError("Please select a platform.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit({ status, platform: platform || null });
    } catch {
      setError("Something went wrong moving this game. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={shared.overlay}>
      <div className={`${shared.dialog} ${styles.dialog}`}>
        <h2 className={shared.dialogTitle}>
          Move &quot;{game.title}&quot; to History
        </h2>
        <form onSubmit={handleSubmit} className={shared.form}>
          <label className={shared.fieldGroup}>
            Status
            <select
              className={shared.select}
              value={status}
              onChange={(e) => setStatus(e.target.value as HistoryStatus)}
              autoFocus
            >
              {HISTORY_STATUSES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          {needsPlatformChoice && (
            <label className={shared.fieldGroup}>
              Platform
              <select
                className={shared.select}
                value={platform}
                onChange={(e) => setPlatform(e.target.value)}
              >
                <option value="">Select a platform…</option>
                {game.platforms.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          )}

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
              {isSubmitting ? "Moving..." : "Move to History"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
