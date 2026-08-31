import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TopNav } from "../TopNav";

jest.mock("next/navigation", () => ({
  useRouter: () => ({ replace: jest.fn(), refresh: jest.fn() }),
}));

describe("TopNav", () => {
  it("renders the app title and primary navigation links", () => {
    render(<TopNav user={{ username: "lucas", displayName: "Lucas" }} />);

    expect(screen.getByText("Game Backlog Tracker")).toBeInTheDocument();

    const backlogLink = screen.getByRole("link", { name: "Backlog" });
    expect(backlogLink).toHaveAttribute("href", "/backlog");

    const historyLink = screen.getByRole("link", { name: "History" });
    expect(historyLink).toHaveAttribute("href", "/history");

    const dataLink = screen.getByRole("link", { name: "Data" });
    expect(dataLink).toHaveAttribute("href", "/data");

    const settingsLink = screen.getByRole("link", { name: "Settings" });
    expect(settingsLink).toHaveAttribute("href", "/settings");
  });

  it("logs out and returns to the login page", async () => {
    const user = userEvent.setup();
    global.fetch = jest.fn().mockResolvedValue({ ok: true });
    render(<TopNav user={{ username: "lucas", displayName: null }} />);

    await user.click(screen.getByRole("button", { name: "Log out" }));
    expect(global.fetch).toHaveBeenCalledWith("/api/auth/logout", { method: "POST" });
  });
});
