import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { JournalPageClient } from "../JournalPageClient";
import type { HistoryEntryDTO } from "@/types/history";
import type { JournalEntryDTO } from "@/types/journal";

const historyEntry: HistoryEntryDTO = {
  id: "history-1",
  title: "Hollow Knight",
  status: "In Progress",
  playtimeMinutes: null,
  finishedOn: null,
  releaseDate: null,
  notes: null,
  platform: null,
  coverImageUrl: null,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const journalEntries: JournalEntryDTO[] = [
  {
    id: "journal-1",
    historyEntryId: "history-1",
    content: "Reached Greenpath.",
    createdAt: "2026-01-02T10:00:00.000Z",
  },
  {
    id: "journal-2",
    historyEntryId: "history-1",
    content: "Met Hornet.",
    createdAt: "2026-01-03T10:00:00.000Z",
  },
];

function jsonResponse(body: unknown, ok = true) {
  return Promise.resolve({
    ok,
    json: () => Promise.resolve(body),
  } as Response);
}

describe("JournalPageClient", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it("renders a game journal in chronological order by default", () => {
    render(
      <JournalPageClient
        historyEntry={historyEntry}
        initialEntries={[journalEntries[1], journalEntries[0]]}
      />
    );

    expect(
      screen.getByRole("heading", { name: "Hollow Knight Journal" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to history/i })).toHaveAttribute(
      "href",
      "/history"
    );

    const entries = screen.getAllByRole("article");
    expect(entries[0]).toHaveTextContent("Reached Greenpath.");
    expect(entries[1]).toHaveTextContent("Met Hornet.");
  });

  it("switches to newest-first ordering", async () => {
    const user = userEvent.setup();
    render(
      <JournalPageClient historyEntry={historyEntry} initialEntries={journalEntries} />
    );

    await user.click(screen.getByRole("button", { name: "Oldest first" }));

    const entries = screen.getAllByRole("article");
    expect(entries[0]).toHaveTextContent("Met Hornet.");
    expect(entries[1]).toHaveTextContent("Reached Greenpath.");
    expect(screen.getByRole("button", { name: "Newest first" })).toBeInTheDocument();
  });

  it("creates a journal entry from the page modal and shows it immediately", async () => {
    const user = userEvent.setup();
    const created: JournalEntryDTO = {
      id: "journal-3",
      historyEntryId: "history-1",
      content: "Defeated the Mantis Lords.",
      createdAt: "2026-01-04T10:00:00.000Z",
    };
    (global.fetch as jest.Mock).mockReturnValueOnce(jsonResponse(created));

    render(<JournalPageClient historyEntry={historyEntry} initialEntries={[]} />);

    await user.click(screen.getByRole("button", { name: "+ Add Journal Entry" }));
    await user.type(
      screen.getByLabelText("Journal Entry"),
      "Defeated the Mantis Lords."
    );
    await user.click(screen.getByRole("button", { name: "Save Entry" }));

    await waitFor(() => {
      expect(screen.getByText("Defeated the Mantis Lords.")).toBeInTheDocument();
    });
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/history/history-1/journal",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("keeps the modal open and surfaces an API error when saving fails", async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockReturnValueOnce(
      jsonResponse({ error: "Unable to save" }, false)
    );

    render(<JournalPageClient historyEntry={historyEntry} initialEntries={[]} />);

    await user.click(screen.getByRole("button", { name: "+ Add Journal Entry" }));
    await user.type(screen.getByLabelText("Journal Entry"), "Reached Greenpath.");
    await user.click(screen.getByRole("button", { name: "Save Entry" }));

    expect(
      await screen.findByText(
        "Something went wrong saving this journal entry. Please try again."
      )
    ).toBeInTheDocument();
  });

  it("renders an empty state when the game has no entries", () => {
    render(<JournalPageClient historyEntry={historyEntry} initialEntries={[]} />);

    expect(
      screen.getByText(/no journal entries yet/i)
    ).toBeInTheDocument();
  });
});
