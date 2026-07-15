import type { HistoryEntryDTO } from "@/types/history";

export type PlaytimeRange = {
  start: string;
  end: string;
};

function toDateOnly(value: string): string {
  return new Date(value).toISOString().slice(0, 10);
}

function isWithinRange(date: string, range: PlaytimeRange): boolean {
  return date >= range.start && date <= range.end;
}

export function getPlaytimeTotal(
  entries: HistoryEntryDTO[],
  range?: PlaytimeRange,
  today = new Date()
): number {
  const todayDate = toDateOnly(today.toISOString());

  return entries.reduce((total, entry) => {
    if (entry.playtimeMinutes === null) return total;
    if (!range) return total + entry.playtimeMinutes;
    if (entry.status === "Recurrent") return total;

    const relevantDate =
      entry.status === "In Progress" ? todayDate : entry.finishedOn
        ? toDateOnly(entry.finishedOn)
        : null;

    return relevantDate && isWithinRange(relevantDate, range)
      ? total + entry.playtimeMinutes
      : total;
  }, 0);
}

export function getPresetRange(
  months: number,
  today = new Date()
): PlaytimeRange {
  const end = toDateOnly(today.toISOString());
  const targetMonth = today.getUTCMonth() - months;
  const targetYear = today.getUTCFullYear() + Math.floor(targetMonth / 12);
  const normalizedMonth = ((targetMonth % 12) + 12) % 12;
  const lastDayOfTargetMonth = new Date(
    Date.UTC(targetYear, normalizedMonth + 1, 0)
  ).getUTCDate();
  const startDate = new Date(
    Date.UTC(
      targetYear,
      normalizedMonth,
      Math.min(today.getUTCDate(), lastDayOfTargetMonth)
    )
  );

  return { start: toDateOnly(startDate.toISOString()), end };
}
