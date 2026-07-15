"use client";

import { useMemo, useState } from "react";
import type { HistoryEntryDTO } from "@/types/history";
import { formatPlaytime } from "@/lib/playtime";
import {
  getPlaytimeTotal,
  getPresetRange,
  type PlaytimeRange,
} from "@/lib/playtime-summary";
import styles from "./PlaytimeSummary.module.css";

interface PlaytimeSummaryProps {
  entries: HistoryEntryDTO[];
}

type SelectedRange = "all" | "month" | "six-months" | "year" | "custom";

function presetMonths(selectedRange: SelectedRange): number | null {
  if (selectedRange === "month") return 1;
  if (selectedRange === "six-months") return 6;
  if (selectedRange === "year") return 12;
  return null;
}

export function PlaytimeSummary({ entries }: PlaytimeSummaryProps) {
  const [selectedRange, setSelectedRange] = useState<SelectedRange>("all");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const range = useMemo<PlaytimeRange | undefined>(() => {
    const months = presetMonths(selectedRange);
    if (months) return getPresetRange(months);
    if (selectedRange === "custom" && customStart && customEnd) {
      return customStart <= customEnd
        ? { start: customStart, end: customEnd }
        : undefined;
    }
    return undefined;
  }, [customEnd, customStart, selectedRange]);

  const total = getPlaytimeTotal(entries, range);
  const hasInvalidCustomRange =
    selectedRange === "custom" &&
    Boolean(customStart && customEnd && customStart > customEnd);

  function selectRange(rangeName: SelectedRange) {
    setSelectedRange(rangeName);
  }

  return (
    <section className={styles.summary} aria-label="Playtime Summary">
      <details className={styles.accordion}>
        <summary
          aria-label="Filter by date range"
          title="Filter by date range"
          className={styles.accordionSummary}
        >
          <span className={styles.heading}>Playtime Summary</span>
          <span className={styles.total}>{formatPlaytime(total)}</span>
        </summary>
        <div className={styles.controls}>
          {(
            [
              ["all", "All time"],
              ["month", "Past Month"],
              ["six-months", "Past 6 months"],
              ["year", "Past year"],
            ] as const
          ).map(([rangeName, label]) => (
            <button
              key={rangeName}
              type="button"
              onClick={() => selectRange(rangeName)}
              className={`${styles.button} ${
                selectedRange === rangeName ? styles.buttonActive : ""
              }`}
            >
              {label}
            </button>
          ))}
          <label className={styles.dateLabel}>
            From
            <input
              type="date"
              value={customStart}
              onChange={(event) => {
                setCustomStart(event.target.value);
                selectRange("custom");
              }}
              className={styles.dateInput}
            />
          </label>
          <label className={styles.dateLabel}>
            To
            <input
              type="date"
              value={customEnd}
              onChange={(event) => {
                setCustomEnd(event.target.value);
                selectRange("custom");
              }}
              className={styles.dateInput}
            />
          </label>
        </div>
        {selectedRange !== "all" && (
          <p className={styles.rangeNote}>
            {hasInvalidCustomRange
              ? "The start date must be on or before the end date."
              : "Date ranges include both selected dates. In Progress games count as today; Recurrent games are included only in the all-time total."}
          </p>
        )}
      </details>
    </section>
  );
}
