"use client";

import { useState, FormEvent } from "react";
import type { BacklogGameDTO, BacklogGameInput } from "@/types/backlog";

interface GameFormModalProps {
  initialGame?: BacklogGameDTO;
  onSubmit: (input: BacklogGameInput) => Promise<void>;
  onClose: () => void;
}

function toMonthInputValue(isoDate: string | null): string {
  if (!isoDate) return "";
  return isoDate.slice(0, 7); // "YYYY-MM"
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-neutral-900">
        <h2 className="mb-4 text-lg font-semibold">
          {initialGame ? "Edit Game" : "Add Game"}
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

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={owned}
              onChange={(e) => setOwned(e.target.checked)}
            />
            Owned
          </label>

          <div className="flex flex-col gap-1 text-sm">
            Platforms
            <div className="flex flex-wrap gap-2">
              {platforms.map((platform) => (
                <span
                  key={platform}
                  className="flex items-center gap-1 rounded-full bg-neutral-200 px-3 py-1 text-xs dark:bg-neutral-700"
                >
                  {platform}
                  <button
                    type="button"
                    onClick={() => removePlatform(platform)}
                    aria-label={`Remove ${platform}`}
                    className="text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                className="flex-1 rounded border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
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
                className="rounded border border-neutral-300 px-3 py-2 text-sm dark:border-neutral-700"
              >
                Add
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex flex-col gap-1 text-sm">
              Est. Hours
              <input
                type="number"
                min={0}
                step={0.5}
                className="rounded border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
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
            Hype (1-10)
            <input
              type="number"
              min={1}
              max={10}
              className="rounded border border-neutral-300 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-800"
              value={hype}
              onChange={(e) => setHype(e.target.value)}
            />
          </label>

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
            Notes
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
