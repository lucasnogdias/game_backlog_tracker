import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { JournalEntryModal } from "../JournalEntryModal";

describe("JournalEntryModal", () => {
  it("renders the game title and requires content", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();

    render(
      <JournalEntryModal
        gameTitle="Hollow Knight"
        onSubmit={onSubmit}
        onClose={jest.fn()}
      />
    );

    expect(
      screen.getByRole("heading", { name: "Add Journal Entry for Hollow Knight" })
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Save Entry" }));

    expect(
      screen.getByText("Journal entry content is required.")
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits trimmed content and closes through its parent callback", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn().mockResolvedValue(undefined);

    render(
      <JournalEntryModal
        gameTitle="Hollow Knight"
        onSubmit={onSubmit}
        onClose={jest.fn()}
      />
    );

    await user.type(screen.getByLabelText("Journal Entry"), "  Met Hornet today.  ");
    await user.click(screen.getByRole("button", { name: "Save Entry" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith("Met Hornet today.");
    });
  });

  it("shows a save error when the parent action fails", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn().mockRejectedValue(new Error("Network error"));

    render(
      <JournalEntryModal
        gameTitle="Hollow Knight"
        onSubmit={onSubmit}
        onClose={jest.fn()}
      />
    );

    await user.type(screen.getByLabelText("Journal Entry"), "Met Hornet today.");
    await user.click(screen.getByRole("button", { name: "Save Entry" }));

    expect(
      await screen.findByText(
        "Something went wrong saving this journal entry. Please try again."
      )
    ).toBeInTheDocument();
  });

  it("calls onClose when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const onClose = jest.fn();

    render(
      <JournalEntryModal
        gameTitle="Hollow Knight"
        onSubmit={jest.fn()}
        onClose={onClose}
      />
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
