"use client";

import styles from "./ConfirmDialog.module.css";
import shared from "@/styles/shared.module.css";

interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Defaults to "Delete" for the existing destructive-delete use case. */
  confirmLabel?: string;
  /** Defaults to "danger" (red button), matching the existing delete use case. */
  variant?: "danger" | "default";
}

export function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
  confirmLabel = "Delete",
  variant = "danger",
}: ConfirmDialogProps) {
  return (
    <div className={shared.overlay}>
      <div className={`${shared.dialog} ${styles.dialog}`}>
        <p className={styles.message}>{message}</p>
        <div className={shared.actionsRow}>
          <button type="button" onClick={onCancel} className={shared.button}>
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={
              `${shared.button} ${
                variant === "danger" ? shared.buttonDanger : shared.buttonPrimary
              }`
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
