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

  it("adds screenshots from drag and drop and the clipboard", () => {
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

    const droppedFile = new File(["image"], "greenpath.png", { type: "image/png" });
    fireEvent.drop(screen.getByText(/choose, drag and drop, or paste/i).parentElement!, {
      dataTransfer: { files: [droppedFile] },
    });
    expect(screen.getByText("greenpath.png")).toBeInTheDocument();

    const pastedFile = new File(["image"], "hornet.webp", { type: "image/webp" });
    fireEvent.paste(screen.getByRole("textbox", { name: "Journal Entry" }), {
      clipboardData: { files: [pastedFile] },
    });
    expect(screen.getByText("hornet.webp")).toBeInTheDocument();
  });

  it("previews the saved filename for pasted screenshots", () => {
    window.journalMedia = {
      save: jest.fn(),
      remove: jest.fn(),
      read: jest.fn(),
    };
    render(
      <JournalEntryModal
        gameTitle="Hollow Knight"
        journalEntryNumber={2}
        initialAttachments={[
          {
            id: "image-1",
            storageKey: "hollow-knight_journal_entry2_image1.png",
            originalName: "hollow-knight_journal_entry2_image1.png",
            mimeType: "image/png",
            size: 3,
            createdAt: "2026-01-01T00:00:00.000Z",
          },
          {
            id: "image-2",
            storageKey: "hollow-knight_journal_entry2_image2.png",
            originalName: "hollow-knight_journal_entry2_image2.png",
            mimeType: "image/png",
            size: 3,
            createdAt: "2026-01-01T00:01:00.000Z",
          },
        ]}
        onSubmit={jest.fn()}
        onClose={jest.fn()}
      />
    );

    fireEvent.click(
      screen.getByRole("button", {
        name: "Remove hollow-knight_journal_entry2_image1.png",
      })
    );
    fireEvent.paste(screen.getByRole("textbox", { name: "Journal Entry" }), {
      clipboardData: {
        files: [new File(["image"], "image.png", { type: "image/png" })],
      },
    });

    expect(
      screen.getByText("Hollow-Knight_journal_entry2_image3.png")
    ).toBeInTheDocument();
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
