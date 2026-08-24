import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AccountManagement } from "../AccountManagement";

const currentAccount = {
  id: "user-1",
  username: "lucas",
  displayName: "Lucas",
  role: "admin" as const,
  createdAt: "2026-08-01T00:00:00.000Z",
};
const secondAccount = {
  id: "user-2",
  username: "tester",
  displayName: null,
  role: "user" as const,
  createdAt: "2026-08-02T00:00:00.000Z",
};

describe("AccountManagement", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it("lets admins promote another account", async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve([currentAccount, secondAccount]) })
      .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ ...secondAccount, role: "admin" }) });
    render(<AccountManagement currentAccount={currentAccount} isAdmin />);

    await user.click(await screen.findByRole("button", { name: "Make administrator" }));
    await waitFor(() =>
      expect(global.fetch).toHaveBeenLastCalledWith(
        "/api/users/user-2",
        expect.objectContaining({ method: "PATCH" })
      )
    );
    expect(screen.getAllByText("admin")).toHaveLength(2);
  });

  it("shows only the current account to standard users", async () => {
    render(<AccountManagement currentAccount={{ ...secondAccount, role: "user" }} isAdmin={false} />);

    expect(await screen.findByText("tester")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /make administrator/i })).not.toBeInTheDocument();
  });
});
