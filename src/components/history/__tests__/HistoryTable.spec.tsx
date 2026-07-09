import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HistoryTable } from "../HistoryTable";
import type { HistoryEntryDTO } from "@/types/history";

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

  it("calls onEdit with the entry when Edit is clicked", async () => {
    const user = userEvent.setup();
    const onEdit = jest.fn();
    const entry = makeEntry();
    render(
      <HistoryTable entries={[entry]} onEdit={onEdit} onDelete={jest.fn()} onMoveToBacklog={jest.fn()} />
    );

    await user.click(screen.getByRole("button", { name: "Edit" }));

    expect(onEdit).toHaveBeenCalledWith(entry);
  });

  it("calls onDelete with the entry when Delete is clicked", async () => {
    const user = userEvent.setup();
    const onDelete = jest.fn();
    const entry = makeEntry();
    render(
      <HistoryTable entries={[entry]} onEdit={jest.fn()} onDelete={onDelete} onMoveToBacklog={jest.fn()} />
    );

    await user.click(screen.getByRole("button", { name: "Delete" }));

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

    await user.click(screen.getByRole("button", { name: "Move to Backlog" }));

    expect(onMoveToBacklog).toHaveBeenCalledWith(entry);
  });
});
