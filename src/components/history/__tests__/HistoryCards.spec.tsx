import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HistoryCards } from "../HistoryCards";
import type { HistoryEntryDTO } from "@/types/history";

function makeEntry(overrides: Partial<HistoryEntryDTO> = {}): HistoryEntryDTO {
  return {
    id: "1",
    title: "Hollow Knight",
    status: "Finished",
    playtimeMinutes: 1830,
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

describe("HistoryCards", () => {
  it("renders an empty state message when there are no entries", () => {
    render(
      <HistoryCards
        entries={[]}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onSetCoverImage={jest.fn()}
        onMoveToBacklog={jest.fn()}
      />
    );

    expect(
      screen.getByText(/no games in your history yet/i)
    ).toBeInTheDocument();
  });

  it("renders a placeholder button when no cover image is set", () => {
    const entry = makeEntry({ coverImageUrl: null });
    render(
      <HistoryCards
        entries={[entry]}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onSetCoverImage={jest.fn()}
        onMoveToBacklog={jest.fn()}
      />
    );

    expect(
      screen.getByRole("button", { name: /add cover image/i })
    ).toBeInTheDocument();
  });

  it("renders an image when a cover image URL is set", () => {
    const entry = makeEntry({ coverImageUrl: "https://example.com/cover.jpg" });
    render(
      <HistoryCards
        entries={[entry]}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onSetCoverImage={jest.fn()}
        onMoveToBacklog={jest.fn()}
      />
    );

    const image = screen.getByRole("img", { name: "Hollow Knight cover art" });
    expect(image).toHaveAttribute("src", "https://example.com/cover.jpg");
  });

  it("prompts for a URL and calls onSetCoverImage when the placeholder is clicked", async () => {
    const user = userEvent.setup();
    const onSetCoverImage = jest.fn();
    const promptSpy = jest
      .spyOn(window, "prompt")
      .mockReturnValue("https://example.com/new-cover.jpg");
    const entry = makeEntry({ coverImageUrl: null });

    render(
      <HistoryCards
        entries={[entry]}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onSetCoverImage={onSetCoverImage}
        onMoveToBacklog={jest.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: /add cover image/i }));

    expect(promptSpy).toHaveBeenCalled();
    expect(onSetCoverImage).toHaveBeenCalledWith(
      entry,
      "https://example.com/new-cover.jpg"
    );

    promptSpy.mockRestore();
  });

  it("does not call onSetCoverImage if the prompt is cancelled", async () => {
    const user = userEvent.setup();
    const onSetCoverImage = jest.fn();
    const promptSpy = jest.spyOn(window, "prompt").mockReturnValue(null);
    const entry = makeEntry({ coverImageUrl: null });

    render(
      <HistoryCards
        entries={[entry]}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onSetCoverImage={onSetCoverImage}
        onMoveToBacklog={jest.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: /add cover image/i }));

    expect(onSetCoverImage).not.toHaveBeenCalled();

    promptSpy.mockRestore();
  });

  it("falls back to placeholder text for missing platform and playtime", () => {
    const entry = makeEntry({ platform: null, playtimeMinutes: null });
    render(
      <HistoryCards
        entries={[entry]}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onSetCoverImage={jest.fn()}
        onMoveToBacklog={jest.fn()}
      />
    );

    expect(screen.getByText("No platform set")).toBeInTheDocument();
    expect(screen.getByText("Playtime: —")).toBeInTheDocument();
  });

  it("calls its visible and menu action callbacks with the entry", async () => {
    const user = userEvent.setup();
    const onEdit = jest.fn();
    const onAddJournalEntry = jest.fn();
    const onViewJournal = jest.fn();
    const onDelete = jest.fn();
    const entry = makeEntry();

    render(
      <HistoryCards
        entries={[entry]}
        onEdit={onEdit}
        onAddJournalEntry={onAddJournalEntry}
        onViewJournal={onViewJournal}
        onDelete={onDelete}
        onSetCoverImage={jest.fn()}
        onMoveToBacklog={jest.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "Actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Add Journal Entry" }));
    await user.click(screen.getByRole("button", { name: "Actions" }));
    await user.click(screen.getByRole("menuitem", { name: "View Journal" }));
    await user.click(screen.getByRole("button", { name: "Actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Delete" }));

    expect(onEdit).toHaveBeenCalledWith(entry);
    expect(onAddJournalEntry).toHaveBeenCalledWith(entry);
    expect(onViewJournal).toHaveBeenCalledWith(entry);
    expect(onDelete).toHaveBeenCalledWith(entry);
  });

  it("calls onMoveToBacklog with the entry when Move to Backlog is clicked", async () => {
    const user = userEvent.setup();
    const onMoveToBacklog = jest.fn();
    const entry = makeEntry();

    render(
      <HistoryCards
        entries={[entry]}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onSetCoverImage={jest.fn()}
        onMoveToBacklog={onMoveToBacklog}
      />
    );

    await user.click(screen.getByRole("button", { name: "Actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Move to Backlog" }));

    expect(onMoveToBacklog).toHaveBeenCalledWith(entry);
  });
});
