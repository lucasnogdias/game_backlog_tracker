"use client";

import { useState, FormEvent } from "react";
import type { BacklogGameDTO } from "@/types/backlog";
import { HISTORY_STATUSES, type HistoryStatus } from "@/types/history";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-neutral-900">
        <h2 className="mb-4 text-lg font-semibold">
          Move &quot;{game.title}&quot; to History
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Status
            <select
              className="rounded border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
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
            <label className="flex flex-col gap-1 text-sm">
              Platform
              <select
                className="rounded border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
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

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="mt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded px-4 py-2 text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded bg-neutral-900 px-4 py-2 text-sm text-white disabled:opacity-50 dark:bg-white dark:text-neutral-900"
            >
              {isSubmitting ? "Moving..." : "Move to History"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
