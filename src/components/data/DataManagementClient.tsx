"use client";

import { ChangeEvent, useState } from "react";
import styles from "./DataManagementClient.module.css";

type Collection = "backlog" | "history";
type ResolutionAction = "keep-local" | "replace-backup" | "keep-both";

interface Candidate {
  id: string;
  title: string;
}

interface Conflict {
  backupId: string;
  title: string;
  localCandidates: Candidate[];
}

interface Preview {
  manifest: { exportedAt: string };
  counts: { backlog: number; history: number; journals: number };
  conflicts: Record<Collection, Conflict[]>;
}

interface Resolution {
  action: ResolutionAction;
  localId?: string;
}

type Resolutions = Record<Collection, Record<string, Resolution>>;

function defaultResolutions(preview: Preview): Resolutions {
  return {
    backlog: Object.fromEntries(
      preview.conflicts.backlog.map((conflict) => [
        conflict.backupId,
        { action: "keep-local", localId: conflict.localCandidates[0].id },
      ])
    ),
    history: Object.fromEntries(
      preview.conflicts.history.map((conflict) => [
        conflict.backupId,
        { action: "keep-local", localId: conflict.localCandidates[0].id },
      ])
    ),
  };
}

function conflictCount(preview: Preview): number {
  return preview.conflicts.backlog.length + preview.conflicts.history.length;
}

export function DataManagementClient() {
  const [archive, setArchive] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [resolutions, setResolutions] = useState<Resolutions | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleArchiveChange(event: ChangeEvent<HTMLInputElement>) {
    setArchive(event.target.files?.[0] ?? null);
    setPreview(null);
    setResolutions(null);
    setError(null);
    setSuccess(null);
  }

  async function previewArchive() {
    if (!archive) return;

    setIsPreviewing(true);
    setError(null);
    setSuccess(null);
    try {
      const form = new FormData();
      form.append("archive", archive);
      const response = await fetch("/api/data-backup/preview", {
        method: "POST",
        body: form,
      });
      const body = (await response.json()) as Preview | { error: string };
      if (!response.ok || !("conflicts" in body)) {
        throw new Error("error" in body ? body.error : "Unable to preview backup.");
      }
      setPreview(body);
      setResolutions(defaultResolutions(body));
    } catch (previewError) {
      setError(
        previewError instanceof Error
          ? previewError.message
          : "Unable to preview backup."
      );
    } finally {
      setIsPreviewing(false);
    }
  }

  function updateResolution(
    collection: Collection,
    backupId: string,
    update: Partial<Resolution>
  ) {
    setResolutions((current) => {
      if (!current) return current;
      return {
        ...current,
        [collection]: {
          ...current[collection],
          [backupId]: { ...current[collection][backupId], ...update },
        },
      };
    });
  }

  async function applyArchive() {
    if (!archive || !resolutions) return;

    setIsApplying(true);
    setError(null);
    setSuccess(null);
    try {
      const form = new FormData();
      form.append("archive", archive);
      form.append("resolutions", JSON.stringify(resolutions));
      const response = await fetch("/api/data-backup/apply", {
        method: "POST",
        body: form,
      });
      const body = (await response.json()) as
        | { imported: { backlog: number; history: number; journals: number } }
        | { error: string };
      if (!response.ok || !("imported" in body)) {
        throw new Error("error" in body ? body.error : "Unable to import backup.");
      }
      setSuccess(
        `Backup imported: ${body.imported.backlog} Backlog games, ${body.imported.history} History games, and ${body.imported.journals} Journal entries processed.`
      );
      setPreview(null);
      setResolutions(null);
      setArchive(null);
    } catch (applyError) {
      setError(
        applyError instanceof Error ? applyError.message : "Unable to import backup."
      );
    } finally {
      setIsApplying(false);
    }
  }

  return (
    <>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Export Backup</h2>
        <p className={styles.description}>
          Download a ZIP archive containing your Backlog, History, and Journal
          data as CSV files. Your account details and API keys are never included.
        </p>
        <a href="/api/data-backup" className={styles.button}>
          Download Backup
        </a>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Import Backup</h2>
        <p className={styles.description}>
          Upload a backup ZIP to validate it before any data changes. Matching
          game titles are reviewed individually; unrelated current data stays
          untouched.
        </p>
        <label>
          Backup archive
          <input
            type="file"
            accept=".zip,application/zip"
            onChange={handleArchiveChange}
            className={styles.fileInput}
          />
        </label>
        <button
          type="button"
          onClick={previewArchive}
          disabled={!archive || isPreviewing}
          className={styles.button}
        >
          {isPreviewing ? "Validating..." : "Preview Import"}
        </button>

        {error && <p className={styles.error}>{error}</p>}
        {success && <p className={styles.status}>{success}</p>}

        {preview && resolutions && (
          <>
            <p className={styles.previewSummary}>
              Backup contains {preview.counts.backlog} Backlog games,{" "}
              {preview.counts.history} History games, and{" "}
              {preview.counts.journals} Journal entries.{" "}
              {conflictCount(preview) === 0
                ? "No game title conflicts found."
                : `${conflictCount(preview)} game title conflict${
                    conflictCount(preview) === 1 ? "" : "s"
                  } need review.`}
            </p>

            {(["backlog", "history"] as const).map((collection) =>
              preview.conflicts[collection].length > 0 ? (
                <div key={collection}>
                  <h3>
                    {collection === "backlog" ? "Backlog" : "History"} Conflicts
                  </h3>
                  <div className={styles.conflictList}>
                    {preview.conflicts[collection].map((conflict) => {
                      const resolution = resolutions[collection][conflict.backupId];
                      return (
                        <fieldset key={conflict.backupId} className={styles.conflict}>
                          <legend className={styles.conflictTitle}>
                            {conflict.title}
                          </legend>
                          <div className={styles.resolutionOptions}>
                            {(
                              [
                                ["keep-local", "Keep local"],
                                ["replace-backup", "Replace with backup"],
                                ["keep-both", "Keep both"],
                              ] as const
                            ).map(([action, label]) => (
                              <label key={action}>
                                <input
                                  type="radio"
                                  name={`${collection}-${conflict.backupId}`}
                                  checked={resolution.action === action}
                                  onChange={() =>
                                    updateResolution(collection, conflict.backupId, {
                                      action,
                                    })
                                  }
                                />{" "}
                                {label}
                              </label>
                            ))}
                          </div>
                          {conflict.localCandidates.length > 1 && (
                            <label className={styles.candidateLabel}>
                              Current game to keep or replace
                              <select
                                value={resolution.localId}
                                onChange={(event) =>
                                  updateResolution(collection, conflict.backupId, {
                                    localId: event.target.value,
                                  })
                                }
                                className={styles.candidateSelect}
                              >
                                {conflict.localCandidates.map((candidate) => (
                                  <option key={candidate.id} value={candidate.id}>
                                    {candidate.title}
                                  </option>
                                ))}
                              </select>
                            </label>
                          )}
                        </fieldset>
                      );
                    })}
                  </div>
                </div>
              ) : null
            )}

            <button
              type="button"
              onClick={applyArchive}
              disabled={isApplying}
              className={styles.button}
            >
              {isApplying ? "Importing..." : "Apply Import"}
            </button>
          </>
        )}
      </section>
    </>
  );
}
