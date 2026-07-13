import { formatDate, formatDateTime, formatMonthYear } from "../format-date";

describe("format-date", () => {
  it("formats dates with a fixed locale and UTC timezone", () => {
    expect(formatDate("2026-03-09T00:00:00.000Z")).toBe("9 Mar 2026");
    expect(formatMonthYear("2017-02-01T00:00:00.000Z")).toBe("Feb 2017");
  });

  it("formats timestamps with a fixed locale and UTC timezone", () => {
    expect(formatDateTime("2026-03-09T14:05:00.000Z")).toBe(
      "9 Mar 2026, 14:05"
    );
  });
});
