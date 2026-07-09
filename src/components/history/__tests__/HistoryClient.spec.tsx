import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HistoryClient } from "../HistoryClient";
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

function jsonResponse(body: unknown, ok = true) {
  return Promise.resolve({
    ok,
    json: () => Promise.resolve(body),
  } as Response);
}

describe("HistoryClient", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders the initial entries in list view by default", () => {
    render(<HistoryClient initialEntries={[makeEntry()]} />);

    expect(screen.getByText("Hollow Knight")).toBeInTheDocument();
    // List view renders a table
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("switches to card view when the Card button is clicked", async () => {
    const user = userEvent.setup();
    render(<HistoryClient initialEntries={[makeEntry()]} />);

    await user.click(screen.getByRole("button", { name: "Card" }));

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByText("Hollow Knight")).toBeInTheDocument();
  });

  it("adds a new entry via the Add Entry modal and POSTs it to the API", async () => {
    const user = userEvent.setup();
    const created = makeEntry({ id: "2", title: "Celeste" });
    (global.fetch as jest.Mock).mockReturnValueOnce(jsonResponse(created, true));

    render(<HistoryClient initialEntries={[]} />);

    await user.click(screen.getByRole("button", { name: "+ Add Game" }));
    await user.type(screen.getByLabelText("Title"), "Celeste");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(screen.getByText("Celeste")).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/history",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("edits an existing entry via the Edit modal and PATCHes it", async () => {
    const user = userEvent.setup();
    const entry = makeEntry();
    const updated = { ...entry, platform: "PC" };
    (global.fetch as jest.Mock).mockReturnValueOnce(jsonResponse(updated, true));

    render(<HistoryClient initialEntries={[entry]} />);

    await user.click(screen.getByRole("button", { name: "Actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Edit" }));
    const platformInput = screen.getByLabelText("Platform");
    await user.clear(platformInput);
    await user.type(platformInput, "PC");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/history/1",
        expect.objectContaining({ method: "PATCH" })
      );
    });
  });

  it("deletes an entry after confirming, and removes it from the list", async () => {
    const user = userEvent.setup();
    const entry = makeEntry();
    (global.fetch as jest.Mock).mockReturnValueOnce(
      jsonResponse({ success: true }, true)
    );

    render(<HistoryClient initialEntries={[entry]} />);

    await user.click(screen.getByRole("button", { name: "Actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Delete" }));
    expect(
      screen.getByText(/remove "hollow knight" from your history/i)
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(screen.queryByText("Hollow Knight")).not.toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/history/1",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("does not delete the entry if the confirmation is cancelled", async () => {
    const user = userEvent.setup();
    const entry = makeEntry();

    render(<HistoryClient initialEntries={[entry]} />);

    await user.click(screen.getByRole("button", { name: "Actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByText("Hollow Knight")).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("moves an entry back to the backlog after confirming, and removes it from the list", async () => {
    const user = userEvent.setup();
    const entry = makeEntry();
    (global.fetch as jest.Mock).mockReturnValueOnce(
      jsonResponse({ id: "backlog-1" }, true)
    );

    render(<HistoryClient initialEntries={[entry]} />);

    await user.click(screen.getByRole("button", { name: "Actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Move to Backlog" }));
    expect(
      screen.getByText(/move "hollow knight" back to your backlog/i)
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Move to Backlog" }));

    await waitFor(() => {
      expect(screen.queryByText("Hollow Knight")).not.toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/history/1/move-to-backlog",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("does not move the entry if the confirmation is cancelled", async () => {
    const user = userEvent.setup();
    const entry = makeEntry();

    render(<HistoryClient initialEntries={[entry]} />);

    await user.click(screen.getByRole("button", { name: "Actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Move to Backlog" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByText("Hollow Knight")).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("sorts entries according to the selected field and direction", async () => {
    const user = userEvent.setup();
    const entryA = makeEntry({
      id: "1",
      title: "Alpha Game",
      createdAt: "2024-01-01T00:00:00.000Z",
    });
    const entryB = makeEntry({
      id: "2",
      title: "Beta Game",
      createdAt: "2024-02-01T00:00:00.000Z",
    });

    render(<HistoryClient initialEntries={[entryA, entryB]} />);

    const rows = () => screen.getAllByRole("row").slice(1); // skip header row
    // Default sort: addedAt asc -> Alpha (added first) before Beta
    expect(rows()[0]).toHaveTextContent("Alpha Game");

    await user.selectOptions(screen.getByRole("combobox"), "title");
    // Direction is still "asc" at this point, so Alpha (A) still sorts first
    expect(rows()[0]).toHaveTextContent("Alpha Game");

    await user.click(
      screen.getByRole("button", { name: /toggle sort direction/i })
    );
    expect(rows()[0]).toHaveTextContent("Beta Game");
  });
});
