import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GameLookupModal } from "@/components/shared/GameLookupModal";
import type { GameLookupResult } from "@/types/game-lookup";

const result: GameLookupResult = {
  id: 9767,
  title: "Hollow Knight",
  releaseDate: "2017-02-23",
  estimatedHours: 7,
};

function jsonResponse(body: unknown, ok = true) {
  return Promise.resolve({
    ok,
    json: () => Promise.resolve(body),
  } as Response);
}

describe("GameLookupModal", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it("searches with the initial title and returns a selected result", async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();
    (global.fetch as jest.Mock).mockReturnValueOnce(jsonResponse([result]));

    render(
      <GameLookupModal
        initialQuery="Hollow Knight"
        onSelect={onSelect}
        onClose={jest.fn()}
      />
    );

    expect(await screen.findByText("Hollow Knight")).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/game-lookup?query=Hollow%20Knight"
    );

    await user.click(screen.getByRole("button", { name: /hollow knight/i }));

    expect(onSelect).toHaveBeenCalledWith(result);
  });

  it("runs a manual search and shows an empty state for no matches", async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockReturnValueOnce(jsonResponse([]));

    render(
      <GameLookupModal initialQuery="" onSelect={jest.fn()} onClose={jest.fn()} />
    );

    await user.type(screen.getByLabelText("Search game title"), "Unknown Game");
    await user.click(screen.getByRole("button", { name: "Search" }));

    expect(await screen.findByText("No matching games found.")).toBeInTheDocument();
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/game-lookup?query=Unknown%20Game"
    );
  });

  it("shows the server error when the lookup fails", async () => {
    (global.fetch as jest.Mock).mockReturnValueOnce(
      jsonResponse({ error: "RAWG lookup failed." }, false)
    );

    render(
      <GameLookupModal
        initialQuery="Hollow Knight"
        onSelect={jest.fn()}
        onClose={jest.fn()}
      />
    );

    expect(await screen.findByText("RAWG lookup failed.")).toBeInTheDocument();
  });

  it("validates an empty manual search and can be cancelled", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    render(
      <GameLookupModal initialQuery="" onSelect={jest.fn()} onClose={onClose} />
    );

    await user.click(screen.getByRole("button", { name: "Search" }));
    expect(
      screen.getByText("Enter a game title to search.")
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });
});
