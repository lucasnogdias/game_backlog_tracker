// Playtime is stored as total minutes but entered/displayed as "HH:mm".
// Hours are intentionally unbounded (not wrapped at 24) since games can
// easily exceed a day of playtime.

const PLAYTIME_PATTERN = /^(\d+):([0-5]?\d)$/;

/**
 * Parses a "HH:mm" string into total minutes. Returns null for empty input
 * and throws for anything else that doesn't match the expected format.
 */
export function parsePlaytime(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const match = PLAYTIME_PATTERN.exec(trimmed);
  if (!match) {
    throw new Error('Playtime must be in "HH:mm" format, e.g. 12:30');
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return hours * 60 + minutes;
}

/**
 * Formats total minutes back into a "HH:mm" string for display.
 */
export function formatPlaytime(totalMinutes: number | null): string {
  if (totalMinutes === null || Number.isNaN(totalMinutes)) return "";
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}:${minutes.toString().padStart(2, "0")}`;
}
