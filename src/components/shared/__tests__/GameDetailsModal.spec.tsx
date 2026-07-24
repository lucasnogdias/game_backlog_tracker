import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GameDetailsModal } from "../GameDetailsModal";
import type { BacklogGameDTO } from "@/types/backlog";
import type { HistoryEntryDTO } from "@/types/history";

const backlogGame: BacklogGameDTO = {
  id: "backlog-1",
  title: "Hollow Knight",
  owned: true,
  platforms: ["Switch", "PC"],
  estimatedHours: 30,
  releaseDate: "2017-02-01T00:00:00.000Z",
  hype: 9,
  notes: "Recommended by a friend",
  coverImageUrl: "https://example.com/cover.jpg",
  createdAt: "2024-01-01T12:00:00.000Z",
  updatedAt: "2024-02-01T12:00:00.000Z",
};

const historyEntry: HistoryEntryDTO = {
  id: "history-1",
  title: "Celeste",
  status: "Finished",
  playtimeMinutes: 1830,
  finishedOn: "2024-03-15T00:00:00.000Z",
  releaseDate: "2018-01-25T00:00:00.000Z",
  notes: "A brilliant platformer",
  platform: "Switch",
  coverImageUrl: null,
  createdAt: "2024-01-01T12:00:00.000Z",
  updatedAt: "2024-02-01T12:00:00.000Z",
};

describe("GameDetailsModal", () => {
  it("renders all Backlog fields with its cover art", () => {
    render(
      <GameDetailsModal
        details={{ type: "backlog", game: backlogGame }}
        onClose={jest.fn()}
        onEdit={jest.fn()}
      />
    );

    expect(screen.getByRole("dialog", { name: "Hollow Knight" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Hollow Knight cover art" })).toHaveAttribute(
      "src",
      backlogGame.coverImageUrl
    );
    expect(screen.getByText("Owned")).toBeInTheDocument();
    expect(screen.getByText("Switch, PC")).toBeInTheDocument();
    expect(screen.getByText("9/10")).toBeInTheDocument();
    expect(screen.getByText("30h")).toBeInTheDocument();
    expect(screen.getByText("Recommended by a friend")).toBeInTheDocument();
    expect(screen.getByText("Feb 2017")).toBeInTheDocument();
  });

  it("renders all History fields and a cover fallback", () => {
    render(
      <GameDetailsModal
        details={{ type: "history", entry: historyEntry }}
        onClose={jest.fn()}
        onEdit={jest.fn()}
      />
    );

    expect(screen.getByText("Finished")).toBeInTheDocument();
    expect(screen.getByText("30:30")).toBeInTheDocument();
    expect(screen.getByText("15 Mar 2024")).toBeInTheDocument();
    expect(screen.getByText("A brilliant platformer")).toBeInTheDocument();
    expect(screen.getByLabelText("No cover art available")).toBeInTheDocument();
  });

  it("renders fallback values for optional Backlog and History fields", () => {
    const { rerender } = render(
      <GameDetailsModal
        details={{
          type: "backlog",
          game: {
            ...backlogGame,
            owned: false,
            platforms: [],
            estimatedHours: null,
            releaseDate: null,
            hype: null,
            notes: null,
            coverImageUrl: null,
          },
        }}
        onClose={jest.fn()}
        onEdit={jest.fn()}
      />
    );

    expect(screen.getByText("Not owned")).toBeInTheDocument();
    expect(screen.getAllByText("—")).toHaveLength(5);
    expect(screen.getByLabelText("No cover art available")).toBeInTheDocument();

    rerender(
      <GameDetailsModal
        details={{
          type: "history",
          entry: {
            ...historyEntry,
            playtimeMinutes: null,
            finishedOn: null,
            releaseDate: null,
            platform: null,
            notes: null,
          },
        }}
        onClose={jest.fn()}
        onEdit={jest.fn()}
      />
    );

    expect(screen.getAllByText("—")).toHaveLength(5);
  });

  it("opens the supplied edit form", async () => {
    const user = userEvent.setup();
    const onEdit = jest.fn();
    render(
      <GameDetailsModal
        details={{ type: "backlog", game: backlogGame }}
        onClose={jest.fn()}
        onEdit={onEdit}
      />
    );

    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(onEdit).toHaveBeenCalledTimes(1);
  });

  it.each([
    ["the close button", async (user: ReturnType<typeof userEvent.setup>, onClose: jest.Mock) => {
      await user.click(screen.getByRole("button", { name: "Close details" }));
      expect(onClose).toHaveBeenCalledTimes(1);
    }],
    ["the overlay", async (user: ReturnType<typeof userEvent.setup>, onClose: jest.Mock) => {
      await user.click(screen.getByTestId("details-overlay"));
      expect(onClose).toHaveBeenCalledTimes(1);
    }],
    ["Escape", async (user: ReturnType<typeof userEvent.setup>, onClose: jest.Mock) => {
      await user.keyboard("{Escape}");
      expect(onClose).toHaveBeenCalledTimes(1);
    }],
  ])("closes with %s", async (_dismissal, dismiss) => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    render(
      <GameDetailsModal
        details={{ type: "backlog", game: backlogGame }}
        onClose={onClose}
        onEdit={jest.fn()}
      />
    );

    await dismiss(user, onClose);
  });
});
