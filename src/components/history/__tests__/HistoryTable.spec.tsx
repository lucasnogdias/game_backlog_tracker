import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HistoryTable } from "../HistoryTable";
import type { HistoryEntryDTO } from "@/types/history";
import { HISTORY_STATUSES } from "@/types/history";
import { HISTORY_STATUS_CLASS_NAMES } from "../history-status-styles";
import styles from "../HistoryStatus.module.css";

function makeEntry(overrides: Partial<HistoryEntryDTO> = {}): HistoryEntryDTO {
  return {
    id: "1",
    title: "Hollow Knight",
    status: "Finished",
    playtimeMinutes: 1830, // 30:30
    finishedOn: "2024-03-15T00:00:00.000Z",
    releaseDate: "2017-02-01T00:00:00.000Z",
    notes: "Loved every second of it",
    platform: "Switch",
    coverImageUrl: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("HistoryTable", () => {
  it("renders an empty state message when there are no entries", () => {
    render(
      <HistoryTable entries={[]} onEdit={jest.fn()} onDelete={jest.fn()} onMoveToBacklog={jest.fn()} />
    );

    expect(
      screen.getByText(/no games in your history yet/i)
    ).toBeInTheDocument();
  });

  it("renders a row per entry with the expected fields", () => {
    const entry = makeEntry();
    render(
      <HistoryTable entries={[entry]} onEdit={jest.fn()} onDelete={jest.fn()} onMoveToBacklog={jest.fn()} />
    );

    expect(screen.getByText("Hollow Knight")).toBeInTheDocument();
    expect(screen.getByText("Finished")).toBeInTheDocument();
    expect(screen.getByText("30:30")).toBeInTheDocument();
    expect(screen.getByText("Switch")).toBeInTheDocument();
    expect(screen.getByText("2017")).toBeInTheDocument();
  });

  it("falls back to placeholder dashes for missing optional fields", () => {
    const entry = makeEntry({
      playtimeMinutes: null,
      finishedOn: null,
      releaseDate: null,
      platform: null,
      notes: null,
    });
    render(
      <HistoryTable entries={[entry]} onEdit={jest.fn()} onDelete={jest.fn()} onMoveToBacklog={jest.fn()} />
    );

    // Multiple "—" placeholders are expected (playtime, finished on, platform, release year, notes)
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(5);
  });

  it("colors the status text for every status", () => {
    const entries = HISTORY_STATUSES.map((status, index) =>
      makeEntry({ id: String(index), title: `${status} game`, status })
    );
    render(
      <HistoryTable
        entries={entries}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onMoveToBacklog={jest.fn()}
      />
    );

    for (const status of HISTORY_STATUSES) {
      expect(screen.getByText(status)).toHaveClass(styles[HISTORY_STATUS_CLASS_NAMES[status]]);
    }
  });

  it("calls onEdit with the entry when Edit is clicked", async () => {
    const user = userEvent.setup();
    const onEdit = jest.fn();
    const entry = makeEntry();
    render(
      <HistoryTable entries={[entry]} onEdit={onEdit} onDelete={jest.fn()} onMoveToBacklog={jest.fn()} />
    );

    await user.click(screen.getByRole("button", { name: "Actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Edit" }));

    expect(onEdit).toHaveBeenCalledWith(entry);
  });

  it("renders Add Journal Entry as a visible action and calls its callback", async () => {
    const user = userEvent.setup();
    const onAddJournalEntry = jest.fn();
    const entry = makeEntry();
    render(
      <HistoryTable
        entries={[entry]}
        onEdit={jest.fn()}
        onAddJournalEntry={onAddJournalEntry}
        onDelete={jest.fn()}
        onMoveToBacklog={jest.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "Add Journal Entry" }));

    expect(onAddJournalEntry).toHaveBeenCalledWith(entry);
    await user.click(screen.getByRole("button", { name: "Actions" }));
    expect(
      screen.queryByRole("menuitem", { name: "Add Journal Entry" })
    ).not.toBeInTheDocument();
  });

  it("calls onDelete with the entry when Delete is clicked", async () => {
    const user = userEvent.setup();
    const onDelete = jest.fn();
    const entry = makeEntry();
    render(
      <HistoryTable entries={[entry]} onEdit={jest.fn()} onDelete={onDelete} onMoveToBacklog={jest.fn()} />
    );

    await user.click(screen.getByRole("button", { name: "Actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Delete" }));

    expect(onDelete).toHaveBeenCalledWith(entry);
  });

  it("calls onMoveToBacklog with the entry when Move to Backlog is clicked", async () => {
    const user = userEvent.setup();
    const onMoveToBacklog = jest.fn();
    const entry = makeEntry();
    render(
      <HistoryTable
        entries={[entry]}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onMoveToBacklog={onMoveToBacklog}
      />
    );

    await user.click(screen.getByRole("button", { name: "Actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Move to Backlog" }));

    expect(onMoveToBacklog).toHaveBeenCalledWith(entry);
  });
});
