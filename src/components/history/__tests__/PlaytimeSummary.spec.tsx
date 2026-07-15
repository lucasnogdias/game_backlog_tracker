import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlaytimeSummary } from "../PlaytimeSummary";
import type { HistoryEntryDTO } from "@/types/history";

function entry(overrides: Partial<HistoryEntryDTO> = {}): HistoryEntryDTO {
  return {
    id: "entry",
    title: "Game",
    status: "Finished",
    playtimeMinutes: 60,
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

describe("PlaytimeSummary", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-07-14T12:00:00.000Z"));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("shows the all-time total by default, including recurrent games", () => {
    render(
      <PlaytimeSummary
        entries={[
          entry({ playtimeMinutes: 60 }),
          entry({ id: "recurrent", status: "Recurrent", playtimeMinutes: 90 }),
        ]}
      />
    );

    expect(screen.getByText("2:30")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "All time" })).toHaveClass(
      "buttonActive"
    );
    expect(screen.getByLabelText("Filter by date range")).toHaveAttribute(
      "title",
      "Filter by date range"
    );
    expect(screen.getByRole("button", { name: "Past Month" })).not.toBeVisible();
  });

  it("filters by the selected preset and includes in-progress games as today", async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });
    render(
      <PlaytimeSummary
        entries={[
          entry({ id: "recent", playtimeMinutes: 60 }),
          entry({
            id: "progress",
            status: "In Progress",
            finishedOn: null,
            playtimeMinutes: 30,
          }),
          entry({
            id: "recurrent",
            status: "Recurrent",
            playtimeMinutes: 90,
          }),
          entry({
            id: "old",
            finishedOn: "2026-05-01T00:00:00.000Z",
            playtimeMinutes: 120,
          }),
        ]}
      />
    );

    fireEvent.click(screen.getByLabelText("Filter by date range"));
    await user.click(screen.getByRole("button", { name: "Past Month" }));

    expect(screen.getByText("1:30")).toBeInTheDocument();
    expect(
      screen.getByText(/in progress games count as today/i)
    ).toBeInTheDocument();
  });

  it("uses inclusive custom dates", () => {
    render(
      <PlaytimeSummary
        entries={[
          entry({
            id: "start",
            finishedOn: "2026-07-01T00:00:00.000Z",
            playtimeMinutes: 30,
          }),
          entry({
            id: "end",
            finishedOn: "2026-07-14T00:00:00.000Z",
            playtimeMinutes: 60,
          }),
          entry({
            id: "outside",
            finishedOn: "2026-07-15T00:00:00.000Z",
            playtimeMinutes: 120,
          }),
        ]}
      />
    );

    fireEvent.click(screen.getByLabelText("Filter by date range"));
    fireEvent.change(screen.getByLabelText("From"), {
      target: { value: "2026-07-01" },
    });
    fireEvent.change(screen.getByLabelText("To"), {
      target: { value: "2026-07-14" },
    });

    expect(screen.getByText("1:30")).toBeInTheDocument();
  });

  it("explains when a custom range is invalid", () => {
    render(<PlaytimeSummary entries={[entry()]} />);

    fireEvent.click(screen.getByLabelText("Filter by date range"));
    fireEvent.change(screen.getByLabelText("From"), {
      target: { value: "2026-07-15" },
    });
    fireEvent.change(screen.getByLabelText("To"), {
      target: { value: "2026-07-14" },
    });

    expect(
      screen.getByText("The start date must be on or before the end date.")
    ).toBeInTheDocument();
  });
});
