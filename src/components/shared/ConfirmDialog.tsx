"use client";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl dark:bg-neutral-900">
        <p className="mb-4 text-sm">{message}</p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded px-4 py-2 text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={
              variant === "danger"
                ? "rounded bg-red-600 px-4 py-2 text-sm text-white"
                : "rounded bg-neutral-900 px-4 py-2 text-sm text-white dark:bg-white dark:text-neutral-900"
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
