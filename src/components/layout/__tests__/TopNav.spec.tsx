import { render, screen } from "@testing-library/react";
import { TopNav } from "../TopNav";

describe("TopNav", () => {
  it("renders the app title and primary navigation links", () => {
    render(<TopNav />);

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
});
