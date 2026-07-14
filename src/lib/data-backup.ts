import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import Papa from "papaparse";
import { prisma } from "@/lib/prisma";
import { getOrCreateDefaultUser } from "@/lib/current-user";
import { HISTORY_STATUSES } from "@/types/history";

export const DATA_BACKUP_FORMAT = "game-backlog-tracker-data";
export const DATA_BACKUP_VERSION = 1;

const BACKLOG_HEADERS = ["id", "title", "owned", "platforms", "estimatedHours", "releaseDate", "hype", "notes", "coverImageUrl", "createdAt", "updatedAt"] as const;
const HISTORY_HEADERS = ["id", "title", "status", "playtimeMinutes", "finishedOn", "releaseDate", "notes", "platform", "coverImageUrl", "createdAt", "updatedAt"] as const;
const JOURNAL_HEADERS = ["id", "historyEntryId", "content", "createdAt"] as const;
const REQUIRED_FILES = ["manifest.json", "backlog.csv", "history.csv", "journals.csv"] as const;

type BacklogBackup = {
  id: string; title: string; owned: boolean; platforms: string[]; estimatedHours: number | null;
  releaseDate: Date | null; hype: number | null; notes: string | null; coverImageUrl: string | null;
  createdAt: Date; updatedAt: Date;
};
type HistoryBackup = {
  id: string; title: string; status: string; playtimeMinutes: number | null; finishedOn: Date | null;
  releaseDate: Date | null; notes: string | null; platform: string | null; coverImageUrl: string | null;
  createdAt: Date; updatedAt: Date;
};
type JournalBackup = { id: string; historyEntryId: string; content: string; createdAt: Date };

export type DataBackup = {
  manifest: { format: string; version: number; exportedAt: string };
  backlog: BacklogBackup[];
  history: HistoryBackup[];
  journals: JournalBackup[];
};

type Candidate = { id: string; title: string };
export type BackupConflict = {
  backupId: string; title: string; normalizedTitle: string; localCandidates: Candidate[];
};
export type BackupPreview = {
  manifest: DataBackup["manifest"];
  counts: { backlog: number; history: number; journals: number };
  conflicts: { backlog: BackupConflict[]; history: BackupConflict[] };
};

export type ConflictResolution = {
  action: "keep-local" | "replace-backup" | "keep-both";
  localId?: string;
};
export type BackupResolutions = {
  backlog?: Record<string, ConflictResolution>;
  history?: Record<string, ConflictResolution>;
};

function fail(message: string): never {
  throw new Error(message);
}

function date(value: string, context: string, nullable = false): Date | null {
  if (nullable && value === "") return null;
  const parsed = new Date(value);
  if (!value || Number.isNaN(parsed.getTime()) || parsed.toISOString() !== value) {
    fail(`${context} must be an ISO timestamp.`);
  }
  return parsed;
}

function required(value: string, context: string): string {
  if (!value.trim()) fail(`${context} is required.`);
  return value;
}

function nullable(value: string): string | null {
  return value === "" ? null : value;
}

function number(value: string, context: string, nullable = true, integer = false): number | null {
  if (nullable && value === "") return null;
  if (!/^-?(?:\d+|\d+\.\d+|\.\d+)$/.test(value)) fail(`${context} must be a number.`);
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || (integer && !Number.isInteger(parsed))) fail(`${context} must be a valid number.`);
  return parsed;
}

function csvRows(file: string, input: string, headers: readonly string[]): Record<string, string>[] {
  const parsed = Papa.parse<Record<string, string>>(input, { header: true, skipEmptyLines: "greedy" });
  if (parsed.errors.length) fail(`${file} is malformed: ${parsed.errors[0].message}`);
  const actual = parsed.meta.fields ?? [];
  if (actual.length !== headers.length || headers.some((header) => !actual.includes(header))) {
    fail(`${file} has invalid columns.`);
  }
  return parsed.data;
}

function distinctIds<T extends { id: string }>(items: T[], file: string) {
  const ids = new Set<string>();
  for (const item of items) {
    if (ids.has(item.id)) fail(`${file} contains duplicate id "${item.id}".`);
    ids.add(item.id);
  }
}

export function parseDataBackup(bytes: Uint8Array): DataBackup {
  let files: Record<string, Uint8Array>;
  try {
    files = unzipSync(bytes);
  } catch {
    fail("The uploaded file is not a valid ZIP archive.");
  }
  for (const file of REQUIRED_FILES) if (!files[file]) fail(`Archive is missing ${file}.`);

  let manifest: DataBackup["manifest"];
  try {
    manifest = JSON.parse(strFromU8(files["manifest.json"])) as DataBackup["manifest"];
  } catch {
    fail("manifest.json is not valid JSON.");
  }
  if (
    manifest?.format !== DATA_BACKUP_FORMAT ||
    manifest.version !== DATA_BACKUP_VERSION ||
    typeof manifest.exportedAt !== "string" ||
    !date(manifest.exportedAt, "manifest.exportedAt")
  ) fail("Archive manifest is invalid or uses an unsupported version.");

  const backlog = csvRows("backlog.csv", strFromU8(files["backlog.csv"]), BACKLOG_HEADERS).map((row, index) => {
    const context = `backlog.csv row ${index + 2}`;
    if (row.owned !== "true" && row.owned !== "false") fail(`${context} owned must be true or false.`);
    let platforms: unknown;
    try { platforms = JSON.parse(row.platforms); } catch { fail(`${context} platforms must be JSON.`); }
    if (!Array.isArray(platforms) || platforms.some((platform) => typeof platform !== "string")) fail(`${context} platforms must be an array of strings.`);
    return {
      id: required(row.id, `${context} id`), title: required(row.title, `${context} title`), owned: row.owned === "true",
      platforms, estimatedHours: number(row.estimatedHours, `${context} estimatedHours`),
      releaseDate: date(row.releaseDate, `${context} releaseDate`, true), hype: number(row.hype, `${context} hype`, true, true),
      notes: nullable(row.notes), coverImageUrl: nullable(row.coverImageUrl),
      createdAt: date(row.createdAt, `${context} createdAt`)!, updatedAt: date(row.updatedAt, `${context} updatedAt`)!,
    };
  });
  const history = csvRows("history.csv", strFromU8(files["history.csv"]), HISTORY_HEADERS).map((row, index) => {
    const context = `history.csv row ${index + 2}`;
    if (!HISTORY_STATUSES.includes(row.status as (typeof HISTORY_STATUSES)[number])) fail(`${context} has an invalid status.`);
    return {
      id: required(row.id, `${context} id`), title: required(row.title, `${context} title`), status: row.status,
      playtimeMinutes: number(row.playtimeMinutes, `${context} playtimeMinutes`, true, true),
      finishedOn: date(row.finishedOn, `${context} finishedOn`, true), releaseDate: date(row.releaseDate, `${context} releaseDate`, true),
      notes: nullable(row.notes), platform: nullable(row.platform), coverImageUrl: nullable(row.coverImageUrl),
      createdAt: date(row.createdAt, `${context} createdAt`)!, updatedAt: date(row.updatedAt, `${context} updatedAt`)!,
    };
  });
  const journals = csvRows("journals.csv", strFromU8(files["journals.csv"]), JOURNAL_HEADERS).map((row, index) => {
    const context = `journals.csv row ${index + 2}`;
    return {
      id: required(row.id, `${context} id`), historyEntryId: required(row.historyEntryId, `${context} historyEntryId`),
      content: required(row.content, `${context} content`), createdAt: date(row.createdAt, `${context} createdAt`)!,
    };
  });
  distinctIds(backlog, "backlog.csv");
  distinctIds(history, "history.csv");
  distinctIds(journals, "journals.csv");
  const historyIds = new Set(history.map((entry) => entry.id));
  for (const journal of journals) if (!historyIds.has(journal.historyEntryId)) fail(`Journal "${journal.id}" references a missing history entry.`);
  return { manifest, backlog, history, journals };
}

export function normalizeTitle(title: string): string {
  return title.trim().replace(/\s+/g, " ").toLowerCase();
}

function conflictsFor<T extends { id: string; title: string }>(backup: T[], local: Candidate[]): BackupConflict[] {
  const byTitle = new Map<string, Candidate[]>();
  for (const entry of local) {
    const key = normalizeTitle(entry.title);
    byTitle.set(key, [...(byTitle.get(key) ?? []), entry]);
  }
  return backup.flatMap((entry) => {
    const normalizedTitle = normalizeTitle(entry.title);
    const localCandidates = byTitle.get(normalizedTitle) ?? [];
    return localCandidates.length ? [{ backupId: entry.id, title: entry.title, normalizedTitle, localCandidates }] : [];
  });
}

async function localCandidates() {
  const user = await getOrCreateDefaultUser();
  const [backlog, history] = await Promise.all([
    prisma.backlogGame.findMany({ where: { userId: user.id }, select: { id: true, title: true } }),
    prisma.historyEntry.findMany({ where: { userId: user.id }, select: { id: true, title: true } }),
  ]);
  return { user, backlog, history };
}

export async function previewDataBackup(backup: DataBackup): Promise<BackupPreview> {
  const local = await localCandidates();
  return {
    manifest: backup.manifest,
    counts: { backlog: backup.backlog.length, history: backup.history.length, journals: backup.journals.length },
    conflicts: {
      backlog: conflictsFor(backup.backlog, local.backlog),
      history: conflictsFor(backup.history, local.history),
    },
  };
}

function csv(rows: Record<string, string>[], fields: readonly string[]) {
  return Papa.unparse({ fields: [...fields], data: rows }, { newline: "\n" });
}
function iso(value: Date | null) { return value?.toISOString() ?? ""; }

export async function createDataBackup(): Promise<Uint8Array> {
  const user = await getOrCreateDefaultUser();
  const [backlog, history, journals] = await Promise.all([
    prisma.backlogGame.findMany({ where: { userId: user.id } }),
    prisma.historyEntry.findMany({ where: { userId: user.id } }),
    prisma.journalEntry.findMany({ where: { historyEntry: { userId: user.id } } }),
  ]);
  return zipSync({
    "manifest.json": strToU8(JSON.stringify({ format: DATA_BACKUP_FORMAT, version: DATA_BACKUP_VERSION, exportedAt: new Date().toISOString() }, null, 2)),
    "backlog.csv": strToU8(csv(backlog.map((entry) => ({ id: entry.id, title: entry.title, owned: String(entry.owned), platforms: JSON.stringify(entry.platforms), estimatedHours: String(entry.estimatedHours ?? ""), releaseDate: iso(entry.releaseDate), hype: String(entry.hype ?? ""), notes: entry.notes ?? "", coverImageUrl: entry.coverImageUrl ?? "", createdAt: entry.createdAt.toISOString(), updatedAt: entry.updatedAt.toISOString() })), BACKLOG_HEADERS)),
    "history.csv": strToU8(csv(history.map((entry) => ({ id: entry.id, title: entry.title, status: entry.status, playtimeMinutes: String(entry.playtimeMinutes ?? ""), finishedOn: iso(entry.finishedOn), releaseDate: iso(entry.releaseDate), notes: entry.notes ?? "", platform: entry.platform ?? "", coverImageUrl: entry.coverImageUrl ?? "", createdAt: entry.createdAt.toISOString(), updatedAt: entry.updatedAt.toISOString() })), HISTORY_HEADERS)),
    "journals.csv": strToU8(csv(journals.map((entry) => ({ id: entry.id, historyEntryId: entry.historyEntryId, content: entry.content, createdAt: entry.createdAt.toISOString() })), JOURNAL_HEADERS)),
  });
}

function resolve(conflict: BackupConflict, resolutions: Record<string, ConflictResolution> | undefined): { action: ConflictResolution["action"]; localId?: string } {
  const resolution = resolutions?.[conflict.backupId];
  if (!resolution || !["keep-local", "replace-backup", "keep-both"].includes(resolution.action)) {
    fail(`A valid resolution is required for "${conflict.title}".`);
  }
  if (resolution.action === "keep-both") return resolution;
  const localId = resolution.localId ?? (conflict.localCandidates.length === 1 ? conflict.localCandidates[0].id : undefined);
  if (!localId || !conflict.localCandidates.some((candidate) => candidate.id === localId)) {
    fail(`A valid local record must be selected for "${conflict.title}".`);
  }
  return { action: resolution.action, localId };
}

function validateResolutionValues(
  resolutions: BackupResolutions,
  type: "backlog" | "history",
  conflicts: BackupConflict[]
) {
  const values = resolutions[type] ?? {};
  if (!values || Array.isArray(values) || typeof values !== "object") fail(`${type} resolutions must be an object.`);
  const conflictsById = new Map(conflicts.map((conflict) => [conflict.backupId, conflict]));
  for (const [backupId, value] of Object.entries(values)) {
    if (!conflictsById.has(backupId)) fail(`Resolution references an unknown ${type} record.`);
    if (!value || Array.isArray(value) || typeof value !== "object" || !["keep-local", "replace-backup", "keep-both"].includes(value.action)) {
      fail(`Resolution for ${backupId} is invalid.`);
    }
    if (value.localId !== undefined && typeof value.localId !== "string") fail(`Resolution for ${backupId} has an invalid local id.`);
  }
  for (const conflict of conflicts) resolve(conflict, values);
}

export async function applyDataBackup(backup: DataBackup, resolutions: BackupResolutions) {
  if (!resolutions || Array.isArray(resolutions) || typeof resolutions !== "object" || Object.keys(resolutions).some((key) => key !== "backlog" && key !== "history")) {
    fail("Resolutions must be an object containing backlog and history choices.");
  }
  const user = await getOrCreateDefaultUser();
  return prisma.$transaction(async (tx) => {
    const [localBacklog, localHistory] = await Promise.all([
      tx.backlogGame.findMany({ where: { userId: user.id }, select: { id: true, title: true } }),
      tx.historyEntry.findMany({ where: { userId: user.id }, select: { id: true, title: true } }),
    ]);
    const backlogConflicts = conflictsFor(backup.backlog, localBacklog);
    const historyConflicts = conflictsFor(backup.history, localHistory);
    const backlogConflictById = new Map(backlogConflicts.map((conflict) => [conflict.backupId, conflict]));
    const historyConflictById = new Map(historyConflicts.map((conflict) => [conflict.backupId, conflict]));
    const historyIds = new Map<string, string>();
    validateResolutionValues(resolutions, "backlog", backlogConflicts);
    validateResolutionValues(resolutions, "history", historyConflicts);

    for (const entry of backup.backlog) {
      const { id: _id, ...data } = entry;
      void _id;
      const conflict = backlogConflictById.get(entry.id);
      if (!conflict) {
        await tx.backlogGame.create({ data: { userId: user.id, ...data } });
        continue;
      }
      const resolution = resolve(conflict, resolutions.backlog);
      if (resolution.action === "replace-backup") await tx.backlogGame.update({ where: { id: resolution.localId }, data });
      if (resolution.action === "keep-both") await tx.backlogGame.create({ data: { userId: user.id, ...data } });
    }
    for (const entry of backup.history) {
      const { id: _id, ...data } = entry;
      void _id;
      const conflict = historyConflictById.get(entry.id);
      if (!conflict) {
        const created = await tx.historyEntry.create({ data: { userId: user.id, ...data } });
        historyIds.set(entry.id, created.id);
        continue;
      }
      const resolution = resolve(conflict, resolutions.history);
      if (resolution.action === "keep-both") {
        const created = await tx.historyEntry.create({ data: { userId: user.id, ...data } });
        historyIds.set(entry.id, created.id);
      } else if (resolution.action === "replace-backup") {
        await tx.historyEntry.update({ where: { id: resolution.localId }, data });
        historyIds.set(entry.id, resolution.localId!);
      } else {
        historyIds.set(entry.id, resolution.localId!);
      }
    }
    for (const entry of backup.journals) {
      const existing = await tx.journalEntry.findUnique({ where: { id: entry.id }, select: { id: true } });
      if (!existing) {
        await tx.journalEntry.create({
          data: {
            id: entry.id,
            historyEntryId: historyIds.get(entry.historyEntryId)!,
            content: entry.content,
            createdAt: entry.createdAt,
          },
        });
      }
    }
    return { imported: { backlog: backup.backlog.length, history: backup.history.length, journals: backup.journals.length } };
  });
}
