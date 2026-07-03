import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HistoryFormModal } from "../HistoryFormModal";
import type { HistoryEntryDTO } from "@/types/history";

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
});
