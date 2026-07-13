"use client";

import { FormEvent, useState } from "react";
import styles from "./JournalEntryModal.module.css";
import shared from "@/styles/shared.module.css";

interface JournalEntryModalProps {
  gameTitle: string;
  onSubmit: (content: string) => Promise<void>;
  onClose: () => void;
}

export function JournalEntryModal({
  gameTitle,
  onSubmit,
  onClose,
}: JournalEntryModalProps) {
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!content.trim()) {
      setError("Journal entry content is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(content.trim());
    } catch {
      setError("Something went wrong saving this journal entry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className={shared.overlay}>
      <div className={`${shared.dialog} ${styles.dialog}`}>
        <h2 className={shared.dialogTitle}>Add Journal Entry for {gameTitle}</h2>
        <form onSubmit={handleSubmit} className={shared.form}>
          <label className={shared.fieldGroup}>
            Journal Entry
            <textarea
              className={shared.textarea}
              rows={8}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              autoFocus
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
              {isSubmitting ? "Saving..." : "Save Entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
