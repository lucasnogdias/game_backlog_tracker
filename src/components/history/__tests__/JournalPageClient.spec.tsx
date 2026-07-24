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
    attachments: [],
  },
  {
    id: "journal-2",
    historyEntryId: "history-1",
    content: "Met Hornet.",
    createdAt: "2026-01-03T10:00:00.000Z",
    attachments: [],
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

  afterEach(() => {
    delete window.journalMedia;
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
      attachments: [],
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

  it("edits a journal entry without changing its chronological position", async () => {
    const user = userEvent.setup();
    const updated: JournalEntryDTO = {
      ...journalEntries[0],
      content: "Reached Greenpath and found Cornifer.",
    };
    (global.fetch as jest.Mock).mockReturnValueOnce(jsonResponse(updated));

    render(<JournalPageClient historyEntry={historyEntry} initialEntries={journalEntries} />);

    await user.click(screen.getAllByRole("button", { name: "Edit" })[0]);
    expect(screen.getByLabelText("Journal Entry")).toHaveValue("Reached Greenpath.");
    await user.clear(screen.getByLabelText("Journal Entry"));
    await user.type(
      screen.getByLabelText("Journal Entry"),
      "Reached Greenpath and found Cornifer."
    );
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(screen.getByText("Reached Greenpath and found Cornifer.")).toBeInTheDocument();
    });
    expect(screen.getAllByRole("article")[0]).toHaveTextContent(
      "Reached Greenpath and found Cornifer."
    );
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/history/history-1/journal/journal-1",
      expect.objectContaining({ method: "PATCH" })
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

  it("loads desktop screenshots through the preload bridge", async () => {
    window.journalMedia = {
      save: jest.fn(),
      remove: jest.fn(),
      read: jest.fn().mockResolvedValue("data:image/png;base64,aW1hZ2U="),
    };
    const entry: JournalEntryDTO = {
      ...journalEntries[0],
      attachments: [
        {
          id: "image-1",
          storageKey: "hollow-knight-journal-1-image-1.png",
          originalName: "greenpath.png",
          mimeType: "image/png",
          size: 5,
          createdAt: "2026-01-02T10:01:00.000Z",
        },
      ],
    };

    render(<JournalPageClient historyEntry={historyEntry} initialEntries={[entry]} />);

    expect(await screen.findByRole("img", { name: "greenpath.png" })).toHaveAttribute(
      "src",
      "data:image/png;base64,aW1hZ2U="
    );
    expect(window.journalMedia.read).toHaveBeenCalledWith(
      "hollow-knight-journal-1-image-1.png"
    );
  });

  it("saves selected screenshots and persists their metadata with a new entry", async () => {
    const user = userEvent.setup();
    const file = new File(["image"], "mantis.webp", { type: "image/webp" });
    Object.defineProperty(file, "arrayBuffer", {
      value: jest.fn().mockResolvedValue(new ArrayBuffer(3)),
    });
    window.journalMedia = {
      save: jest.fn().mockResolvedValue({
        id: "image-1",
        storageKey: "hollow-knight-journal-journal-3-image-1.webp",
        originalName: "mantis.webp",
        mimeType: "image/webp",
        size: 3,
      }),
      remove: jest.fn(),
      read: jest.fn(),
    };
    const created = {
      id: "journal-3",
      historyEntryId: "history-1",
      content: "Defeated the Mantis Lords.",
      createdAt: "2026-01-04T10:00:00.000Z",
      attachments: [],
    };
    const updated = {
      ...created,
      attachments: [
        {
          id: "image-1",
          storageKey: "hollow-knight-journal-journal-3-image-1.webp",
          originalName: "mantis.webp",
          mimeType: "image/webp",
          size: 3,
          createdAt: "2026-01-04T10:00:01.000Z",
        },
      ],
    };
    (global.fetch as jest.Mock)
      .mockReturnValueOnce(jsonResponse(created))
      .mockReturnValueOnce(jsonResponse(updated));

    render(<JournalPageClient historyEntry={historyEntry} initialEntries={[]} />);
    await user.click(screen.getByRole("button", { name: "+ Add Journal Entry" }));
    await user.type(screen.getByLabelText("Journal Entry"), created.content);
    await user.upload(screen.getByLabelText("Add screenshots"), file);
    await user.click(screen.getByRole("button", { name: "Save Entry" }));

    await waitFor(() => {
      expect(window.journalMedia!.save).toHaveBeenCalledWith(
        expect.objectContaining({ journalEntryId: "journal-3", name: "mantis.webp" })
      );
    });
    expect(global.fetch).toHaveBeenLastCalledWith(
      "/api/history/history-1/journal/journal-3",
      expect.objectContaining({ method: "PATCH" })
    );
  });

  it("removes detached desktop screenshot files after editing", async () => {
    const user = userEvent.setup();
    const attachment = {
      id: "image-1",
      storageKey: "hollow-knight-journal-journal-1-image-1.png",
      originalName: "greenpath.png",
      mimeType: "image/png" as const,
      size: 5,
      createdAt: "2026-01-02T10:01:00.000Z",
    };
    window.journalMedia = {
      save: jest.fn(),
      remove: jest.fn(),
      read: jest.fn().mockResolvedValue("data:image/png;base64,aW1hZ2U="),
    };
    const entry = { ...journalEntries[0], attachments: [attachment] };
    (global.fetch as jest.Mock).mockReturnValueOnce(
      jsonResponse({ ...entry, content: "Updated.", attachments: [] })
    );

    render(<JournalPageClient historyEntry={historyEntry} initialEntries={[entry]} />);
    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Remove greenpath.png" }));
    await user.clear(screen.getByLabelText("Journal Entry"));
    await user.type(screen.getByLabelText("Journal Entry"), "Updated.");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(window.journalMedia!.remove).toHaveBeenCalledWith(attachment.storageKey);
    });
  });
});
