import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BacklogTable } from "../BacklogTable";
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

describe("BacklogTable", () => {
  it("renders an empty state message when there are no games", () => {
    render(<BacklogTable games={[]} onEdit={jest.fn()} onDelete={jest.fn()} onMoveToHistory={jest.fn()} />);

    expect(
      screen.getByText(/no games in your backlog yet/i)
    ).toBeInTheDocument();
  });

  it("renders a row per game with the expected fields", () => {
    const game = makeGame();
    render(
      <BacklogTable games={[game]} onEdit={jest.fn()} onDelete={jest.fn()} onMoveToHistory={jest.fn()} />
    );

    expect(screen.getByText("Hollow Knight")).toBeInTheDocument();
    expect(screen.getByText("Switch, PC")).toBeInTheDocument();
    expect(screen.getByText("30h")).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
    expect(screen.getByText("✅")).toBeInTheDocument();
  });

  it("falls back to placeholder dashes for missing optional fields", () => {
    const game = makeGame({
      owned: false,
      platforms: [],
      estimatedHours: null,
      releaseDate: null,
      hype: null,
      notes: null,
    });
    render(
      <BacklogTable games={[game]} onEdit={jest.fn()} onDelete={jest.fn()} onMoveToHistory={jest.fn()} />
    );

    // Multiple "—" placeholders are expected (owned, platform, hours, date, hype, notes)
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(5);
  });

  it("calls onEdit with the game when Edit is clicked", async () => {
    const user = userEvent.setup();
    const onEdit = jest.fn();
    const game = makeGame();
    render(<BacklogTable games={[game]} onEdit={onEdit} onDelete={jest.fn()} onMoveToHistory={jest.fn()} />);

    await user.click(screen.getByRole("button", { name: "Edit" }));

    expect(onEdit).toHaveBeenCalledWith(game);
  });

  it("calls onDelete with the game when Delete is clicked", async () => {
    const user = userEvent.setup();
    const onDelete = jest.fn();
    const game = makeGame();
    render(
      <BacklogTable games={[game]} onEdit={jest.fn()} onDelete={onDelete} onMoveToHistory={jest.fn()} />
    );

    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(onDelete).toHaveBeenCalledWith(game);
  });

  it("calls onMoveToHistory with the game when Move to History is clicked", async () => {
    const user = userEvent.setup();
    const onMoveToHistory = jest.fn();
    const game = makeGame();
    render(
      <BacklogTable
        games={[game]}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        onMoveToHistory={onMoveToHistory}
      />
    );

    await user.click(screen.getByRole("button", { name: "Move to History" }));

    expect(onMoveToHistory).toHaveBeenCalledWith(game);
  });
});
