import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PasswordSettings } from "../PasswordSettings";

describe("PasswordSettings", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it("sets a password for a passwordless account", async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    });
    render(<PasswordSettings hasPassword={false} />);

    expect(screen.queryByLabelText("Current password")).not.toBeInTheDocument();
    await user.type(screen.getByLabelText("Set a password"), "long-enough-password");
    await user.click(screen.getByRole("button", { name: "Save password settings" }));

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/auth/password",
      expect.objectContaining({ method: "PATCH" })
    );
    expect(await screen.findByText("Password settings updated.")).toBeInTheDocument();
  });

  it("shows a password update error", async () => {
    const user = userEvent.setup();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Your current password is incorrect." }),
    });
    render(<PasswordSettings hasPassword />);
    await user.type(screen.getByLabelText("Current password"), "incorrect");
    await user.click(screen.getByRole("button", { name: "Save password settings" }));

    expect(await screen.findByText("Your current password is incorrect.")).toBeInTheDocument();
  });
});
