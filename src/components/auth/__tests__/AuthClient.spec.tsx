import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AuthClient } from "../AuthClient";

function response(body: unknown, ok = true) {
  return Promise.resolve({ ok, json: () => Promise.resolve(body) } as Response);
}

describe("AuthClient", () => {
  beforeEach(() => {
    global.fetch = jest.fn()
      .mockReturnValueOnce(response({ needsAccountSetup: false }))
      .mockReturnValueOnce(
        response([
          { username: "lucas", displayName: "Lucas", requiresPassword: true },
          { username: "guest", displayName: null, requiresPassword: false },
        ])
      );
  });

  it("selects a local account and only requests its password when required", async () => {
    const user = userEvent.setup();
    render(<AuthClient />);

    expect(await screen.findByRole("option", { name: "Lucas" })).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Username"), "guest");
    expect(screen.queryByLabelText("Password")).not.toBeInTheDocument();
  });

  it("switches to registration and reports an API error", async () => {
    const user = userEvent.setup();
    render(<AuthClient />);
    await screen.findByRole("option", { name: "Lucas" });
    await user.click(screen.getByRole("button", { name: "Create a local account" }));
    await user.type(screen.getByLabelText("Username"), "new-user");
    await user.type(screen.getByLabelText("Password"), "long-enough-password");
    (global.fetch as jest.Mock).mockReturnValueOnce(response({ error: "That username is already in use." }, false));
    await user.click(screen.getByRole("button", { name: "Create account" }));

    expect(await screen.findByText("That username is already in use.")).toBeInTheDocument();
  });
});
