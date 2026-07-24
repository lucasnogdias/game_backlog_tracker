import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { JournalEntryModal } from "../JournalEntryModal";

describe("JournalEntryModal", () => {
  afterEach(() => {
    delete window.journalMedia;
  });

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
      expect(onSubmit).toHaveBeenCalledWith("Met Hornet today.", [], []);
    });
  });

  it("pre-fills and saves an existing entry", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    render(
      <JournalEntryModal
        gameTitle="Hollow Knight"
        initialContent="Met Hornet today."
        onSubmit={onSubmit}
        onClose={jest.fn()}
      />
    );

    expect(
      screen.getByRole("heading", { name: "Edit Journal Entry for Hollow Knight" })
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Journal Entry")).toHaveValue("Met Hornet today.");

    await user.type(screen.getByLabelText("Journal Entry"), " Again.");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(onSubmit).toHaveBeenCalledWith("Met Hornet today. Again.", [], []);
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
      await screen.findByText("Unable to save journal entry: Network error")
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

  it("adds and removes desktop screenshot files before saving", async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    window.journalMedia = {
      save: jest.fn(),
      remove: jest.fn(),
      read: jest.fn(),
    };
    render(
      <JournalEntryModal
        gameTitle="Hollow Knight"
        onSubmit={onSubmit}
        onClose={jest.fn()}
      />
    );

    const screenshot = new File(["image"], "hornet.png", { type: "image/png" });
    await user.upload(screen.getByLabelText("Add screenshots"), screenshot);
    expect(screen.getByText("hornet.png")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Remove hornet.png" }));
    expect(screen.queryByText("hornet.png")).not.toBeInTheDocument();
  });

  it("rejects unsupported and oversized screenshot files", () => {
    window.journalMedia = {
      save: jest.fn(),
      remove: jest.fn(),
      read: jest.fn(),
    };
    render(
      <JournalEntryModal
        gameTitle="Hollow Knight"
        onSubmit={jest.fn()}
        onClose={jest.fn()}
      />
    );

    fireEvent.change(screen.getByLabelText("Add screenshots"), {
      target: {
        files: [new File(["image"], "hornet.gif", { type: "image/gif" })],
      },
    });
    expect(
      screen.getByText(/screenshots must be png, jpeg, or webp/i)
    ).toBeInTheDocument();
  });
});
