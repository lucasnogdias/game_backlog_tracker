import { getPlaytimeTotal, getPresetRange } from "../playtime-summary";
import type { HistoryEntryDTO } from "@/types/history";

function entry(overrides: Partial<HistoryEntryDTO> = {}): HistoryEntryDTO {
  return {
    id: "entry",
    title: "Game",
    status: "Finished",
    playtimeMinutes: 120,
    finishedOn: "2026-07-14T00:00:00.000Z",
    releaseDate: null,
    notes: null,
    platform: null,
    coverImageUrl: null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("playtime summary", () => {
  const today = new Date("2026-07-14T12:00:00.000Z");

  it("includes all entries with playtime in the all-time total", () => {
    expect(
      getPlaytimeTotal([
        entry({ playtimeMinutes: 60 }),
        entry({ id: "recurrent", status: "Recurrent", playtimeMinutes: 90 }),
        entry({ id: "unknown", playtimeMinutes: null }),
      ])
    ).toBe(150);
  });

  it("uses inclusive finished dates and treats in-progress entries as today", () => {
    const range = { start: "2026-07-01", end: "2026-07-14" };

    expect(
      getPlaytimeTotal(
        [
          entry({ id: "start", playtimeMinutes: 10, finishedOn: "2026-07-01T00:00:00.000Z" }),
          entry({ id: "end", playtimeMinutes: 20, finishedOn: "2026-07-14T00:00:00.000Z" }),
          entry({ id: "progress", status: "In Progress", playtimeMinutes: 30, finishedOn: null }),
          entry({ id: "recurrent", status: "Recurrent", playtimeMinutes: 40 }),
          entry({ id: "outside", playtimeMinutes: 50, finishedOn: "2026-06-30T00:00:00.000Z" }),
          entry({ id: "undated", playtimeMinutes: 60, finishedOn: null }),
        ],
        range,
        today
      )
    ).toBe(60);
  });

  it("creates rolling calendar-month preset ranges ending today", () => {
    expect(getPresetRange(1, today)).toEqual({
      start: "2026-06-14",
      end: "2026-07-14",
    });
    expect(getPresetRange(12, today)).toEqual({
      start: "2025-07-14",
      end: "2026-07-14",
    });
    expect(getPresetRange(1, new Date("2026-03-31T12:00:00.000Z"))).toEqual({
      start: "2026-02-28",
      end: "2026-03-31",
    });
  });
});
