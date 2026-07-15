import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GameFormModal } from "../GameFormModal";
import type { BacklogGameDTO } from "@/types/backlog";
import type { GameLookupResult } from "@/types/game-lookup";

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

describe("GameFormModal", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    delete window.desktopSettings;
    jest.restoreAllMocks();
  });

  it("renders the 'Add Game' heading and empty fields when no initialGame is given", () => {
    render(<GameFormModal onSubmit={jest.fn()} onClose={jest.fn()} />);

    expect(
      screen.getByRole("heading", { name: "Add Game" })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toHaveValue("");
  });

  it("renders the 'Edit Game' heading and pre-fills fields from initialGame", () => {
    render(
      <GameFormModal
        initialGame={makeGame()}
        onSubmit={jest.fn()}
        onClose={jest.fn()}
      />
    );

    expect(
      screen.getByRole("heading", { name: "Edit Game" })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toHaveValue("Hollow Knight");
    expect(screen.getByText("Switch")).toBeInTheDocument();
    expect(screen.getByText("PC")).toBeInTheDocument();
  });

  it("shows a validation error and does not submit when title is empty", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<GameFormModal onSubmit={onSubmit} onClose={jest.fn()} />);

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Title is required.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits the form with entered values", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    render(<GameFormModal onSubmit={onSubmit} onClose={jest.fn()} />);

    await user.type(screen.getByLabelText("Title"), "Celeste");
    await user.click(screen.getByLabelText("Owned"));
    await user.type(screen.getByLabelText("Hype (1-10)"), "8");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Celeste",
        owned: true,
        hype: 8,
      })
    );
  });

  it("adds and removes platform tags", async () => {
    const user = userEvent.setup();
    render(<GameFormModal onSubmit={jest.fn()} onClose={jest.fn()} />);

    const platformInput = screen.getByPlaceholderText("e.g. Switch");
    await user.type(platformInput, "PS5");
    await user.click(screen.getByRole("button", { name: "Add" }));

    expect(screen.getByText("PS5")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove PS5" }));

    expect(screen.queryByText("PS5")).not.toBeInTheDocument();
  });

  it("calls onClose when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(<GameFormModal onSubmit={jest.fn()} onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows an error message if onSubmit rejects", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn().mockRejectedValue(new Error("network error"));
    render(<GameFormModal onSubmit={onSubmit} onClose={jest.fn()} />);

    await user.type(screen.getByLabelText("Title"), "Celeste");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText(/something went wrong saving this game/i)
    ).toBeInTheDocument();
  });

  it("fills empty release date and estimated hours from a selected lookup result", async () => {
    const user = userEvent.setup();
    const lookupResult: GameLookupResult = {
      id: 9767,
      title: "Hollow Knight",
      releaseDate: "2017-02-23",
      estimatedHours: 7,
    };
    (global.fetch as jest.Mock).mockReturnValueOnce(
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([lookupResult]),
      } as Response)
    );

    render(<GameFormModal onSubmit={jest.fn()} onClose={jest.fn()} />);

    await user.type(screen.getByLabelText("Title"), "Hollow Knight");
    await user.click(screen.getByRole("button", { name: "Find details" }));
    await user.click(screen.getByRole("button", { name: /hollow knight/i }));

    expect(screen.getByLabelText("Est. Hours")).toHaveValue(7);
    expect(screen.getByLabelText("Release Date")).toHaveValue("2017-02");
  });

  it("asks before replacing lookup fields that already have values", async () => {
    const user = userEvent.setup();
    const lookupResult: GameLookupResult = {
      id: 9767,
      title: "Hollow Knight",
      releaseDate: "2017-02-23",
      estimatedHours: 7,
    };
    (global.fetch as jest.Mock).mockReturnValueOnce(
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([lookupResult]),
      } as Response)
    );

    render(
      <GameFormModal
        initialGame={makeGame()}
        onSubmit={jest.fn()}
        onClose={jest.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "Find details" }));
    await user.click(screen.getByRole("button", { name: /hollow knight/i }));

    expect(
      screen.getByText(
        /will replace the existing estimated hours and release date/i
      )
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Est. Hours")).toHaveValue(30);

    await user.click(screen.getByRole("button", { name: "Apply details" }));

    expect(screen.getByLabelText("Est. Hours")).toHaveValue(7);
    expect(screen.getByLabelText("Release Date")).toHaveValue("2017-02");
  });

  it("disables lookup and links to Settings when the packaged app has no key", async () => {
    Object.defineProperty(window, "desktopSettings", {
      configurable: true,
      value: {
        getGameLookupStatus: jest.fn().mockResolvedValue({
          canConfigure: true,
          configured: false,
        }),
      },
    });

    render(<GameFormModal onSubmit={jest.fn()} onClose={jest.fn()} />);

    expect(
      await screen.findByText("Game lookup is unavailable.")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Find details" })).toBeDisabled();
    expect(
      screen.getByRole("link", { name: "Configure it in Settings." })
    ).toHaveAttribute("href", "/settings");
  });
});
