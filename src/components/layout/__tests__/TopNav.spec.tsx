import { render, screen } from "@testing-library/react";
import { TopNav } from "../TopNav";

describe("TopNav", () => {
  it("renders the app title and links to Backlog and History", () => {
    render(<TopNav />);

    expect(screen.getByText("Game Backlog Tracker")).toBeInTheDocument();

    const backlogLink = screen.getByRole("link", { name: "Backlog" });
    expect(backlogLink).toHaveAttribute("href", "/backlog");

    const historyLink = screen.getByRole("link", { name: "History" });
    expect(historyLink).toHaveAttribute("href", "/history");
  });
});
