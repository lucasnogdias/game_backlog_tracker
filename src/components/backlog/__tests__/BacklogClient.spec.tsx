import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BacklogClient } from "../BacklogClient";
import type { BacklogGameDTO } from "@/types/backlog";

function makeGame(overrides: Partial<BacklogGameDTO> = {}): BacklogGameDTO {
  return {
    id: "1",
    title: "Hollow Knight",
    owned: true,
    platforms: ["Switch", "PC"],
    estimatedHours: 30,
    releaseDate: "2017-02-01T00:00:00.000Z",
    hype: 9,
    notes: "Recommended by a friend",
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

describe("BacklogClient", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders the initial games in list view by default", () => {
    render(<BacklogClient initialGames={[makeGame()]} />);

    expect(screen.getByText("Hollow Knight")).toBeInTheDocument();
    // List view renders a table
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("switches to card view when the Card button is clicked", async () => {
    const user = userEvent.setup();
    render(<BacklogClient initialGames={[makeGame()]} />);

    await user.click(screen.getByRole("button", { name: "Card" }));

    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByText("Hollow Knight")).toBeInTheDocument();
  });

  it("adds a new game via the Add Game modal and POSTs it to the API", async () => {
    const user = userEvent.setup();
    const created = makeGame({ id: "2", title: "Celeste", hype: 8 });
    (global.fetch as jest.Mock).mockReturnValueOnce(jsonResponse(created, true));

    render(<BacklogClient initialGames={[]} />);

    await user.click(screen.getByRole("button", { name: "+ Add Game" }));
    await user.type(screen.getByLabelText("Title"), "Celeste");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(screen.getByText("Celeste")).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/backlog",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("edits an existing game via the Edit modal and PATCHes it", async () => {
    const user = userEvent.setup();
    const game = makeGame();
    const updated = { ...game, hype: 10 };
    (global.fetch as jest.Mock).mockReturnValueOnce(jsonResponse(updated, true));

    render(<BacklogClient initialGames={[game]} />);

    await user.click(screen.getByRole("button", { name: "Edit" }));
    const hypeInput = screen.getByLabelText("Hype (1-10)");
    await user.clear(hypeInput);
    await user.type(hypeInput, "10");
    await user.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/backlog/1",
        expect.objectContaining({ method: "PATCH" })
      );
    });
  });

  it("deletes a game after confirming, and removes it from the list", async () => {
    const user = userEvent.setup();
    const game = makeGame();
    (global.fetch as jest.Mock).mockReturnValueOnce(
      jsonResponse({ success: true }, true)
    );

    render(<BacklogClient initialGames={[game]} />);

    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByText(/remove "hollow knight" from your backlog/i)).toBeInTheDocument();

    // Two "Delete" buttons now exist: the row action and the confirm dialog's.
    const deleteButtons = screen.getAllByRole("button", { name: "Delete" });
    await user.click(deleteButtons[deleteButtons.length - 1]);

    await waitFor(() => {
      expect(screen.queryByText("Hollow Knight")).not.toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/backlog/1",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("does not delete the game if the confirmation is cancelled", async () => {
    const user = userEvent.setup();
    const game = makeGame();

    render(<BacklogClient initialGames={[game]} />);

    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.getByText("Hollow Knight")).toBeInTheDocument();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("sorts games according to the selected field and direction", async () => {
    const user = userEvent.setup();
    const gameA = makeGame({ id: "1", title: "Alpha Game", hype: 3 });
    const gameB = makeGame({ id: "2", title: "Beta Game", hype: 9 });

    render(<BacklogClient initialGames={[gameA, gameB]} />);

    const rows = () => screen.getAllByRole("row").slice(1); // skip header row
    // Default sort: hype desc -> Beta (9) before Alpha (3)
    expect(rows()[0]).toHaveTextContent("Beta Game");

    await user.selectOptions(screen.getByRole("combobox"), "title");
    // Direction is still "desc" at this point, so Beta (B) sorts before Alpha (A)
    expect(rows()[0]).toHaveTextContent("Beta Game");

    await user.click(screen.getByRole("button", { name: /toggle sort direction/i }));
    expect(rows()[0]).toHaveTextContent("Alpha Game");
  });
});
