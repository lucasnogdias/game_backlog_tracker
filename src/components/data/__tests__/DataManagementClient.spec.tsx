import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataManagementClient } from "../DataManagementClient";

function jsonResponse(body: unknown, ok = true) {
  return Promise.resolve({
    ok,
    json: () => Promise.resolve(body),
  } as Response);
}

const noConflictPreview = {
  manifest: { exportedAt: "2026-07-13T12:00:00.000Z" },
  counts: { backlog: 2, history: 1, journals: 3 },
  conflicts: { backlog: [], history: [] },
};

const conflictPreview = {
  manifest: { exportedAt: "2026-07-13T12:00:00.000Z" },
  counts: { backlog: 1, history: 1, journals: 0 },
  conflicts: {
    backlog: [
      {
        backupId: "backup-mario",
        title: "Mario 3",
        localCandidates: [
          { id: "local-mario", title: "Mario 3" },
          { id: "local-mario-alt", title: "Mario 3" },
        ],
      },
    ],
    history: [
      {
        backupId: "backup-zelda",
        title: "Zelda",
        localCandidates: [{ id: "local-zelda", title: "Zelda" }],
      },
    ],
  },
};

describe("DataManagementClient", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("links to the ZIP download endpoint", () => {
    render(<DataManagementClient />);

    expect(screen.getByRole("link", { name: "Download Backup" })).toHaveAttribute(
      "href",
      "/api/data-backup"
    );
  });

  it("previews a valid archive and applies an import with no conflicts", async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock)
      .mockReturnValueOnce(jsonResponse(noConflictPreview))
      .mockReturnValueOnce(
        jsonResponse({ imported: { backlog: 2, history: 1, journals: 3 } })
      );

    render(<DataManagementClient />);

    const archive = new File(["backup"], "backup.zip", {
      type: "application/zip",
    });
    await user.upload(screen.getByLabelText("Backup archive"), archive);
    await user.click(screen.getByRole("button", { name: "Preview Import" }));

    expect(
      await screen.findByText(/backup contains 2 backlog games, 1 history games/i)
    ).toHaveTextContent("No game title conflicts found.");

    await user.click(screen.getByRole("button", { name: "Apply Import" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/data-backup/apply",
        expect.objectContaining({ method: "POST", body: expect.any(FormData) })
      );
    });
    expect(
      await screen.findByText(/backup imported: 2 backlog games, 1 history games/i)
    ).toBeInTheDocument();
  });

  it("lets the user choose a resolution for each title conflict", async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock)
      .mockReturnValueOnce(jsonResponse(conflictPreview))
      .mockReturnValueOnce(
        jsonResponse({ imported: { backlog: 1, history: 1, journals: 0 } })
      );

    render(<DataManagementClient />);

    await user.upload(
      screen.getByLabelText("Backup archive"),
      new File(["backup"], "backup.zip", { type: "application/zip" })
    );
    await user.click(screen.getByRole("button", { name: "Preview Import" }));

    expect(
      await screen.findByRole("group", { name: "Mario 3" })
    ).toBeInTheDocument();
    expect(screen.getByText(/2 game title conflicts need review/i)).toBeInTheDocument();
    const [keepBoth] = screen.getAllByRole("radio", { name: "Keep both" });
    expect(keepBoth).not.toBeChecked();
    await user.click(keepBoth);
    expect(keepBoth).toBeChecked();
    await user.selectOptions(
      screen.getByLabelText("Current game to keep or replace"),
      "local-mario-alt"
    );

    await user.click(screen.getByRole("button", { name: "Apply Import" }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/data-backup/apply",
        expect.objectContaining({ method: "POST", body: expect.any(FormData) })
      );
    });
  });

  it("shows a validation error returned by the preview endpoint", async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockReturnValueOnce(
      jsonResponse({ error: "Archive is missing history.csv." }, false)
    );

    render(<DataManagementClient />);

    await user.upload(
      screen.getByLabelText("Backup archive"),
      new File(["backup"], "backup.zip", { type: "application/zip" })
    );
    await user.click(screen.getByRole("button", { name: "Preview Import" }));

    expect(
      await screen.findByText("Archive is missing history.csv.")
    ).toBeInTheDocument();
  });

  it("shows a fallback error when previewing fails without an Error response", async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockRejectedValueOnce("Network unavailable");

    render(<DataManagementClient />);

    await user.upload(
      screen.getByLabelText("Backup archive"),
      new File(["backup"], "backup.zip", { type: "application/zip" })
    );
    await user.click(screen.getByRole("button", { name: "Preview Import" }));

    expect(await screen.findByText("Unable to preview backup.")).toBeInTheDocument();
  });

  it("shows an import error when the apply endpoint returns an invalid response", async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock)
      .mockReturnValueOnce(jsonResponse(noConflictPreview))
      .mockReturnValueOnce(jsonResponse({}));

    render(<DataManagementClient />);

    await user.upload(
      screen.getByLabelText("Backup archive"),
      new File(["backup"], "backup.zip", { type: "application/zip" })
    );
    await user.click(screen.getByRole("button", { name: "Preview Import" }));
    await screen.findByText(/no game title conflicts found/i);
    await user.click(screen.getByRole("button", { name: "Apply Import" }));

    expect(await screen.findByText("Unable to import backup.")).toBeInTheDocument();
  });
});
