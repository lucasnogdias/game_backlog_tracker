import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MoveToHistoryModal } from "../MoveToHistoryModal";
import type { BacklogGameDTO } from "@/types/backlog";

function makeGame(overrides: Partial<BacklogGameDTO> = {}): BacklogGameDTO {
  return {
    id: "1",
    title: "Hollow Knight",
    owned: true,
    platforms: ["Switch"],
    estimatedHours: 30,
    releaseDate: "2017-02-01T00:00:00.000Z",
    hype: 9,
    notes: null,
    coverImageUrl: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("MoveToHistoryModal", () => {
  it("submits with the default status and the single platform auto-selected", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const game = makeGame();

    render(
      <MoveToHistoryModal game={game} onSubmit={onSubmit} onClose={jest.fn()} />
    );

    expect(
      screen.getByText(/move "hollow knight" to history/i)
    ).toBeInTheDocument();
    // Single platform: no platform picker shown.
    expect(screen.queryByLabelText("Platform")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Move to History" }));

    expect(onSubmit).toHaveBeenCalledWith({
      status: "In Progress",
      platform: "Switch",
    });
  });

  it("requires a platform choice when the game has multiple platforms", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const game = makeGame({ platforms: ["Switch", "PC"] });

    render(
      <MoveToHistoryModal game={game} onSubmit={onSubmit} onClose={jest.fn()} />
    );

    await user.click(screen.getByRole("button", { name: "Move to History" }));

    expect(
      screen.getByText(/please select a platform/i)
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    await user.selectOptions(screen.getByLabelText("Platform"), "PC");
    await user.click(screen.getByRole("button", { name: "Move to History" }));

    expect(onSubmit).toHaveBeenCalledWith({ status: "In Progress", platform: "PC" });
  });

  it("lets the user change the status before submitting", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    const game = makeGame();

    render(
      <MoveToHistoryModal game={game} onSubmit={onSubmit} onClose={jest.fn()} />
    );

    await user.selectOptions(screen.getByLabelText("Status"), "Finished");
    await user.click(screen.getByRole("button", { name: "Move to History" }));

    expect(onSubmit).toHaveBeenCalledWith({
      status: "Finished",
      platform: "Switch",
    });
  });

  it("shows an error message when onSubmit rejects", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn().mockRejectedValue(new Error("boom"));
    const game = makeGame();

    render(
      <MoveToHistoryModal game={game} onSubmit={onSubmit} onClose={jest.fn()} />
    );

    await user.click(screen.getByRole("button", { name: "Move to History" }));

    expect(
      await screen.findByText(/something went wrong moving this game/i)
    ).toBeInTheDocument();
  });

  it("calls onClose when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();
    const game = makeGame();

    render(
      <MoveToHistoryModal game={game} onSubmit={jest.fn()} onClose={onClose} />
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onClose).toHaveBeenCalled();
  });
});
