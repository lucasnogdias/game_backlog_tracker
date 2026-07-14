import { strToU8, zipSync } from "fflate";

jest.mock("../prisma", () => ({ prisma: {} }));

import {
  DATA_BACKUP_FORMAT,
  DATA_BACKUP_VERSION,
  normalizeTitle,
  parseDataBackup,
} from "../data-backup";

const archive = (journals = "journal-1,history-1,First note,2026-01-01T00:00:00.000Z") =>
  zipSync({
    "manifest.json": strToU8(JSON.stringify({
      format: DATA_BACKUP_FORMAT,
      version: DATA_BACKUP_VERSION,
      exportedAt: "2026-01-01T00:00:00.000Z",
    })),
    "backlog.csv": strToU8("id,title,owned,platforms,estimatedHours,releaseDate,hype,notes,coverImageUrl,createdAt,updatedAt\nbacklog-1,  Game  ,true,\"[\"\"PS5\"\"]\",12.5,2026-01-01T00:00:00.000Z,8,note,,2026-01-01T00:00:00.000Z,2026-01-02T00:00:00.000Z"),
    "history.csv": strToU8("id,title,status,playtimeMinutes,finishedOn,releaseDate,notes,platform,coverImageUrl,createdAt,updatedAt\nhistory-1,History,Finished,60,2026-01-02T00:00:00.000Z,2026-01-01T00:00:00.000Z,note,PS5,,2026-01-01T00:00:00.000Z,2026-01-02T00:00:00.000Z"),
    "journals.csv": strToU8(`id,historyEntryId,content,createdAt\n${journals}`),
  });

describe("data backup parsing", () => {
  it("parses the versioned archive and preserves source values", () => {
    const backup = parseDataBackup(archive());

    expect(backup.backlog[0]).toMatchObject({
      id: "backlog-1",
      title: "  Game  ",
      platforms: ["PS5"],
      estimatedHours: 12.5,
    });
    expect(backup.history[0].status).toBe("Finished");
    expect(backup.journals[0].content).toBe("First note");
  });

  it("rejects journals whose source history record is absent", () => {
    expect(() => parseDataBackup(archive("journal-1,missing,First note,2026-01-01T00:00:00.000Z"))).toThrow(
      'Journal "journal-1" references a missing history entry.'
    );
  });

  it("normalizes whitespace and case for conflict detection", () => {
    expect(normalizeTitle("  The   GAME ")).toBe("the game");
  });
});
