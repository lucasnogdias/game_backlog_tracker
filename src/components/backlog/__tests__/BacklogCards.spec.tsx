import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BacklogCards } from "../BacklogCards";
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

describe("BacklogCards", () => {
  it("renders an empty state message when there are no games", () => {
    render(
      <BacklogCards
        games={[]}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onSetCoverImage={jest.fn()}
        onMoveToHistory={jest.fn()}
      />
    );

    expect(
      screen.getByText(/no games in your backlog yet/i)
    ).toBeInTheDocument();
  });

  it("renders a placeholder button when no cover image is set", () => {
    const game = makeGame({ coverImageUrl: null });
    render(
      <BacklogCards
        games={[game]}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onSetCoverImage={jest.fn()}
        onMoveToHistory={jest.fn()}
      />
    );

    expect(
      screen.getByRole("button", { name: /add cover image/i })
    ).toBeInTheDocument();
  });

  it("renders an image when a cover image URL is set", () => {
    const game = makeGame({ coverImageUrl: "https://example.com/cover.jpg" });
    render(
      <BacklogCards
        games={[game]}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onSetCoverImage={jest.fn()}
        onMoveToHistory={jest.fn()}
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
    const game = makeGame({ coverImageUrl: null });

    render(
      <BacklogCards
        games={[game]}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onSetCoverImage={onSetCoverImage}
        onMoveToHistory={jest.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: /add cover image/i }));

    expect(promptSpy).toHaveBeenCalled();
    expect(onSetCoverImage).toHaveBeenCalledWith(
      game,
      "https://example.com/new-cover.jpg"
    );

    promptSpy.mockRestore();
  });

  it("does not call onSetCoverImage if the prompt is cancelled", async () => {
    const user = userEvent.setup();
    const onSetCoverImage = jest.fn();
    const promptSpy = jest.spyOn(window, "prompt").mockReturnValue(null);
    const game = makeGame({ coverImageUrl: null });

    render(
      <BacklogCards
        games={[game]}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onSetCoverImage={onSetCoverImage}
        onMoveToHistory={jest.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: /add cover image/i }));

    expect(onSetCoverImage).not.toHaveBeenCalled();

    promptSpy.mockRestore();
  });

  it("falls back to placeholder text for missing platforms and hype", () => {
    const game = makeGame({ platforms: [], hype: null });
    render(
      <BacklogCards
        games={[game]}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onSetCoverImage={jest.fn()}
        onMoveToHistory={jest.fn()}
      />
    );

    expect(screen.getByText("No platform set")).toBeInTheDocument();
    expect(screen.getByText("Hype: —/10")).toBeInTheDocument();
  });

  it("calls onEdit and onDelete when their buttons are clicked", async () => {
    const user = userEvent.setup();
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    const game = makeGame();

    render(
      <BacklogCards
        games={[game]}
        onEdit={onEdit}
        onDelete={onDelete}
        onSetCoverImage={jest.fn()}
        onMoveToHistory={jest.fn()}
      />
    );

    await user.click(screen.getByRole("button", { name: "Actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Delete" }));

    expect(onEdit).toHaveBeenCalledWith(game);
    expect(onDelete).toHaveBeenCalledWith(game);
  });

  it("calls onMoveToHistory with the game when Move to History is clicked", async () => {
    const user = userEvent.setup();
    const onMoveToHistory = jest.fn();
    const game = makeGame();

    render(
      <BacklogCards
        games={[game]}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onSetCoverImage={jest.fn()}
        onMoveToHistory={onMoveToHistory}
      />
    );

    await user.click(screen.getByRole("button", { name: "Move to History" }));

    expect(onMoveToHistory).toHaveBeenCalledWith(game);
  });
});
