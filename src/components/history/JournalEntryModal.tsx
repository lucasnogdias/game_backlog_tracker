"use client";

import { ChangeEvent, ClipboardEvent, DragEvent, FormEvent, useState } from "react";
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
  journalEntryNumber?: number;
}

const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const EXTENSIONS = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
} as const;

function safeFilenamePart(value: string) {
  return (
    value
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "game"
  );
}

function imageNumber(filename: string): number | null {
  const match = filename.match(/_image(\d+)\.(?:png|jpg|webp)$/i);
  return match ? Number(match[1]) : null;
}

export function JournalEntryModal({
  gameTitle,
  onSubmit,
  onClose,
  initialContent,
  initialAttachments = [],
  journalEntryNumber,
}: JournalEntryModalProps) {
  const isEditing = initialContent !== undefined;
  const [content, setContent] = useState(initialContent ?? "");
  const [files, setFiles] = useState<File[]>([]);
  const [attachments, setAttachments] = useState(initialAttachments);
  const [removedAttachmentNames, setRemovedAttachmentNames] = useState<string[]>([]);
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

  function addFiles(selectedFiles: File[]) {
    const invalidFile = selectedFiles.find(
      (file) => !IMAGE_TYPES.includes(file.type) || file.size > MAX_IMAGE_SIZE
    );
    if (invalidFile) {
      setError("Screenshots must be PNG, JPEG, or WebP files no larger than 10 MB.");
      return;
    }
    setError(null);
    setFiles((current) => [...current, ...selectedFiles]);
  }

  function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    addFiles(Array.from(event.target.files ?? []));
    event.target.value = "";
  }

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    addFiles(Array.from(event.dataTransfer.files));
  }

  function handlePaste(event: ClipboardEvent<HTMLFormElement>) {
    const pastedFiles = Array.from(event.clipboardData.files);
    if (!pastedFiles.length) return;
    event.preventDefault();
    addFiles(pastedFiles);
  }

  function pendingFileName(file: File, index: number): string {
    if (!journalEntryNumber || !/^image\.(png|jpe?g|webp)$/i.test(file.name)) {
      return file.name;
    }
    const assignedNumbers = [...attachments, ...removedAttachmentNames]
      .map((attachment) =>
        typeof attachment === "string"
          ? imageNumber(attachment)
          : imageNumber(attachment.originalName)
      )
      .filter((number): number is number => number !== null);
    const nextImageNumber = Math.max(0, ...assignedNumbers) + index + 1;
    const extension = EXTENSIONS[file.type as keyof typeof EXTENSIONS];
    return `${safeFilenamePart(gameTitle)}_journal_entry${journalEntryNumber}_image${nextImageNumber}.${extension}`;
  }

  return (
    <div className={shared.overlay}>
      <div className={`${shared.dialog} ${styles.dialog}`}>
        <h2 className={shared.dialogTitle}>
          {isEditing ? "Edit" : "Add"} Journal Entry for {gameTitle}
        </h2>
        <form onSubmit={handleSubmit} onPaste={handlePaste} className={shared.form}>
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
              <div
                className={styles.dropZone}
                onDragOver={(event) => event.preventDefault()}
                onDrop={handleDrop}
              >
                <input
                  aria-label="Add screenshots"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  multiple
                  onChange={handleFiles}
                />
                <p className={styles.helpText}>
                  Choose, drag and drop, or paste PNG, JPEG, or WebP images. Maximum 10 MB per image.
                </p>
              </div>
            ) : (
              <p className={styles.unavailable}>
                Screenshot attachments are only available in the desktop app.
              </p>
            )}
            {(attachments.length > 0 || files.length > 0) && (
              <ul className={styles.attachmentList}>
                {attachments.map((attachment) => {
                  const name = attachment.originalName;
                  return (
                  <li key={attachment.id}>
                    {name}
                    <button
                      type="button"
                      className={styles.removeAttachment}
                      onClick={() => {
                        setAttachments((current) => current.filter((item) => item.id !== attachment.id));
                        setRemovedAttachmentNames((current) => [...current, name]);
                      }}
                    >
                      Remove {name}
                    </button>
                  </li>
                  );
                })}
                {files.map((file, index) => {
                  const name = pendingFileName(file, index);
                  return (
                  <li key={`${file.name}-${index}`}>
                    {name}
                    <button
                      type="button"
                      className={styles.removeAttachment}
                      onClick={() =>
                        setFiles((current) =>
                          current.filter((_, fileIndex) => fileIndex !== index)
                        )
                      }
                    >
                      Remove {name}
                    </button>
                  </li>
                  );
                })}
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
