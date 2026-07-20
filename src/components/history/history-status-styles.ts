import type { HistoryStatus } from "@/types/history";

export const HISTORY_STATUS_CLASS_NAMES: Record<HistoryStatus, string> = {
  Finished: "finished",
  Completed: "completed",
  Paused: "paused",
  Abandoned: "abandoned",
  "In Progress": "inProgress",
  Recurrent: "recurrent",
};

export const HISTORY_STATUS_BORDER_COLORS: Record<HistoryStatus, string> = {
  Finished: "var(--color-status-finished)",
  Completed: "var(--color-status-completed)",
  Paused: "var(--color-status-paused)",
  Abandoned: "var(--color-status-abandoned)",
  "In Progress": "var(--color-status-in-progress)",
  Recurrent: "var(--color-status-recurrent)",
};
