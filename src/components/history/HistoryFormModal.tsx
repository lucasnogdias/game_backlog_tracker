"use client";

import { useState, FormEvent } from "react";
import type { HistoryEntryDTO, HistoryEntryInput } from "@/types/history";
import { HISTORY_STATUSES } from "@/types/history";
import { parsePlaytime, formatPlaytime } from "@/lib/playtime";

interface HistoryFormModalProps {
  initialEntry?: HistoryEntryDTO;
  onSubmit: (input: HistoryEntryInput) => Promise<void>;
  onClose: () => void;
}

function toDateInputValue(isoDate: string | null): string {
  if (!isoDate) return "";
  return isoDate.slice(0, 10); // "YYYY-MM-DD"
}

function toMonthInputValue(isoDate: string | null): string {
  if (!isoDate) return "";
  return isoDate.slice(0, 7); // "YYYY-MM"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-neutral-900">
        <h2 className="mb-4 text-lg font-semibold">
          {initialEntry ? "Edit Entry" : "Add Entry"}
        </h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1 text-sm">
            Title
            <input
              className="rounded border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Status
            <select
              className="rounded border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
              value={status}
              onChange={(e) =>
                setStatus(e.target.value as (typeof HISTORY_STATUSES)[number])
              }
            >
              {HISTORY_STATUSES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1 text-sm">
              Playtime (HH:mm)
              <input
                className="rounded border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
                value={playtime}
                placeholder="e.g. 45:30"
                onChange={(e) => setPlaytime(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Finished On
              <input
                type="date"
                className="rounded border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
                value={finishedOn}
                onChange={(e) => setFinishedOn(e.target.value)}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1 text-sm">
              Platform
              <input
                className="rounded border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
                value={platform}
                placeholder="e.g. Switch"
                onChange={(e) => setPlatform(e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Release Date
              <input
                type="month"
                className="rounded border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
                value={releaseDate}
                onChange={(e) => setReleaseDate(e.target.value)}
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-sm">
            Cover Image URL
            <input
              type="url"
              className="rounded border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
              value={coverImageUrl}
              placeholder="https://..."
              onChange={(e) => setCoverImageUrl(e.target.value)}
            />
          </label>

          <label className="flex flex-col gap-1 text-sm">
            Notes / Review
            <textarea
              className="rounded border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>

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
              {isSubmitting ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
