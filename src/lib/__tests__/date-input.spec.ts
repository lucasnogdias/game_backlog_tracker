import { toMonthInputValue } from "@/lib/date-input";

describe("toMonthInputValue", () => {
  it("converts an ISO date to the value expected by a month input", () => {
    expect(toMonthInputValue("2026-07-01T00:00:00.000Z")).toBe("2026-07");
  });

  it("returns an empty value for an unset date", () => {
    expect(toMonthInputValue(null)).toBe("");
  });
});
