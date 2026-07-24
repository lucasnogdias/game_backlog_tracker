"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import type { JournalImageAttachmentDTO } from "@/types/journal";
import styles from "./JournalEntryModal.module.css";
import shared from "@/styles/shared.module.css";

interface JournalEntryModalProps {
  gameTitle: string;
  onSubmit: (
    content: string,
    files: File[],
    attachments: JournalImageAttachmentDTO[]
  ) => Promise<void>;
  onClose: () => void;
  initialContent?: string;
  initialAttachments?: JournalImageAttachmentDTO[];
}

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

export function JournalEntryModal({
  gameTitle,
  onSubmit,
  onClose,
  initialContent,
  initialAttachments = [],
}: JournalEntryModalProps) {
  const isEditing = initialContent !== undefined;
  const [content, setContent] = useState(initialContent ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [attachments, setAttachments] = useState(initialAttachments);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasJournalMedia =
    typeof window !== "undefined" && window.journalMedia !== undefined;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!content.trim()) {
      setError("Journal entry content is required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(content.trim(), files, attachments);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? `Unable to save journal entry: ${saveError.message}`
          : "Something went wrong saving this journal entry. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const selectedFiles = Array.from(event.target.files ?? []);
    const invalidFile = selectedFiles.find(
      (file) => !IMAGE_TYPES.includes(file.type) || file.size > MAX_IMAGE_SIZE
    );
    if (invalidFile) {
      setError("Screenshots must be PNG, JPEG, or WebP files no larger than 10 MB.");
      event.target.value = "";
      return;
    }
    setError(null);
    setFiles((current) => [...current, ...selectedFiles]);
    event.target.value = "";
  }

  return (
    <div className={shared.overlay}>
      <div className={`${shared.dialog} ${styles.dialog}`}>
        <h2 className={shared.dialogTitle}>
          {isEditing ? "Edit" : "Add"} Journal Entry for {gameTitle}
        </h2>
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

          <fieldset className={styles.attachments}>
            <legend>Screenshots</legend>
            {hasJournalMedia ? (
              <>
                <input
                  aria-label="Add screenshots"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  onChange={handleFiles}
                />
                <p className={styles.helpText}>
                  PNG, JPEG, or WebP. Maximum 10 MB per image.
                </p>
              </>
            ) : (
              <p className={styles.unavailable}>
                Screenshot attachments are only available in the desktop app.
              </p>
            )}
            {(attachments.length > 0 || files.length > 0) && (
              <ul className={styles.attachmentList}>
                {attachments.map((attachment) => (
                  <li key={attachment.id}>
                    {attachment.originalName}
                    <button
                      type="button"
                      className={styles.removeAttachment}
                      onClick={() =>
                        setAttachments((current) =>
                          current.filter((item) => item.id !== attachment.id)
                        )
                      }
                    >
                      Remove {attachment.originalName}
                    </button>
                  </li>
                ))}
                {files.map((file, index) => (
                  <li key={`${file.name}-${index}`}>
                    {file.name}
                    <button
                      type="button"
                      className={styles.removeAttachment}
                      onClick={() =>
                        setFiles((current) =>
                          current.filter((_, fileIndex) => fileIndex !== index)
                        )
                      }
                    >
                      Remove {file.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </fieldset>

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
              {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Save Entry"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
