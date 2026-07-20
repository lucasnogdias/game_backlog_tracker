import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HistoryFormModal } from "../HistoryFormModal";
import type { HistoryEntryDTO } from "@/types/history";
import type { GameLookupResult } from "@/types/game-lookup";

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

describe("HistoryFormModal", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    delete window.desktopSettings;
    jest.restoreAllMocks();
  });

  it("renders the 'Add Entry' heading and empty fields when no initialEntry is given", () => {
    render(<HistoryFormModal onSubmit={jest.fn()} onClose={jest.fn()} />);

    expect(
      screen.getByRole("heading", { name: "Add Entry" })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toHaveValue("");
    expect(screen.getByLabelText("Status")).toHaveValue("In Progress");
  });

  it("renders the 'Edit Entry' heading and pre-fills fields from initialEntry", () => {
    render(
      <HistoryFormModal
        initialEntry={makeEntry()}
        onSubmit={jest.fn()}
        onClose={jest.fn()}
      />
    );

    expect(
      screen.getByRole("heading", { name: "Edit Entry" })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toHaveValue("Hollow Knight");
    expect(screen.getByLabelText("Status")).toHaveValue("Finished");
    expect(screen.getByLabelText("Playtime (HH:mm)")).toHaveValue("30:30");
    expect(screen.getByLabelText("Platform")).toHaveValue("Switch");
  });

  it("shows a validation error and does not submit when title is empty", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<HistoryFormModal onSubmit={onSubmit} onClose={jest.fn()} />);

    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Title is required.")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits the form with only title and status filled in", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    render(<HistoryFormModal onSubmit={onSubmit} onClose={jest.fn()} />);

    await user.type(screen.getByLabelText("Title"), "Celeste");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Celeste",
        status: "In Progress",
        playtimeMinutes: null,
        finishedOn: null,
        platform: null,
      })
    );
  });

  it("advances from the platform field to the release date on Enter", async () => {
    const user = userEvent.setup();
    render(<HistoryFormModal onSubmit={jest.fn()} onClose={jest.fn()} />);

    await user.click(screen.getByLabelText("Platform"));
    await user.keyboard("{Enter}");

    expect(screen.getByLabelText("Release Date")).toHaveFocus();
  });

  it("submits when Enter is pressed in Notes", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    render(<HistoryFormModal onSubmit={onSubmit} onClose={jest.fn()} />);

    await user.type(screen.getByLabelText("Title"), "Celeste");
    await user.click(screen.getByLabelText("Notes / Review"));
    await user.keyboard("{Enter}");

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Celeste" })
    );
  });

  it("submits the selected status when changed", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    render(<HistoryFormModal onSubmit={onSubmit} onClose={jest.fn()} />);

    await user.type(screen.getByLabelText("Title"), "Celeste");
    await user.selectOptions(screen.getByLabelText("Status"), "Abandoned");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ status: "Abandoned" })
    );
  });

  it("submits all optional fields once filled in", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    render(<HistoryFormModal onSubmit={onSubmit} onClose={jest.fn()} />);

    await user.type(screen.getByLabelText("Title"), "Celeste");
    await user.type(screen.getByLabelText("Finished On"), "2024-05-01");
    await user.type(screen.getByLabelText("Platform"), "PC");
    await user.type(screen.getByLabelText("Release Date"), "2018-01");
    await user.type(
      screen.getByLabelText("Cover Image URL"),
      "https://example.com/celeste.jpg"
    );
    await user.type(screen.getByLabelText("Notes / Review"), "A tough climb");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Celeste",
        finishedOn: "2024-05-01",
        platform: "PC",
        releaseDate: "2018-01-01",
        coverImageUrl: "https://example.com/celeste.jpg",
        notes: "A tough climb",
      })
    );
  });

  it("parses a HH:mm playtime value into minutes on submit", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    render(<HistoryFormModal onSubmit={onSubmit} onClose={jest.fn()} />);

    await user.type(screen.getByLabelText("Title"), "Celeste");
    await user.type(screen.getByLabelText("Playtime (HH:mm)"), "45:30");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ playtimeMinutes: 45 * 60 + 30 })
    );
  });

  it("shows a validation error for a malformed playtime value", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<HistoryFormModal onSubmit={onSubmit} onClose={jest.fn()} />);

    await user.type(screen.getByLabelText("Title"), "Celeste");
    await user.type(screen.getByLabelText("Playtime (HH:mm)"), "not-a-time");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText(/playtime must be in "HH:mm" format/i)
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("calls onClose when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(<HistoryFormModal onSubmit={jest.fn()} onClose={onClose} />);

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows an error message if onSubmit rejects", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn().mockRejectedValue(new Error("network error"));
    render(<HistoryFormModal onSubmit={onSubmit} onClose={jest.fn()} />);

    await user.type(screen.getByLabelText("Title"), "Celeste");
    await user.click(screen.getByRole("button", { name: "Save" }));

    expect(
      await screen.findByText(/something went wrong saving this entry/i)
    ).toBeInTheDocument();
  });

  it("fills an empty release date from a selected lookup result", async () => {
    const user = userEvent.setup();
    const lookupResult: GameLookupResult = {
      id: 9767,
      title: "Hollow Knight: Silksong",
      releaseDate: "2017-02-23",
      coverImageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1rgi.jpg",
    };
    (global.fetch as jest.Mock).mockReturnValueOnce(
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([lookupResult]),
      } as Response)
    );

    render(<HistoryFormModal onSubmit={jest.fn()} onClose={jest.fn()} />);

    await user.type(screen.getByLabelText("Title"), "Hollow Knight");
    await user.click(screen.getByRole("button", { name: "Find details" }));
    await user.click(screen.getByRole("button", { name: /hollow knight/i }));

    expect(screen.getByLabelText("Release Date")).toHaveValue("2017-02");
    expect(screen.getByLabelText("Title")).toHaveValue("Hollow Knight: Silksong");
    expect(screen.getByLabelText("Cover Image URL")).toHaveValue(
      "https://images.igdb.com/igdb/image/upload/t_cover_big/co1rgi.jpg"
    );
  });

  it("asks before replacing an existing release date from a lookup result", async () => {
    const user = userEvent.setup();
    const lookupResult: GameLookupResult = {
      id: 9767,
      title: "Hollow Knight",
      releaseDate: "2017-02-23",
      coverImageUrl: "https://images.igdb.com/igdb/image/upload/t_cover_big/co1rgi.jpg",
    };
    (global.fetch as jest.Mock).mockReturnValueOnce(
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([lookupResult]),
      } as Response)
    );

    render(
      <HistoryFormModal
        initialEntry={makeEntry()}
        onSubmit={jest.fn()}
        onClose={jest.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "Find details" }));
    await user.click(screen.getByRole("button", { name: /hollow knight/i }));

    expect(
      screen.getByText(/will replace the existing release date/i)
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Apply details" }));

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

    render(<HistoryFormModal onSubmit={jest.fn()} onClose={jest.fn()} />);

    expect(
      await screen.findByText("Game lookup is unavailable.")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Find details" })).toBeDisabled();
    expect(
      screen.getByRole("link", { name: "Configure it in Settings." })
    ).toHaveAttribute("href", "/settings");
  });
});
