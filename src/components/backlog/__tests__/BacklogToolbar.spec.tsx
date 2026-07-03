import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BacklogToolbar } from "../BacklogToolbar";

describe("BacklogToolbar", () => {
  const baseProps = {
    view: "list" as const,
    onViewChange: jest.fn(),
    sortField: "hype" as const,
    sortDirection: "desc" as const,
    onSortChange: jest.fn(),
    onAddClick: jest.fn(),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders sort options, view toggle, and add button", () => {
    render(<BacklogToolbar {...baseProps} />);

    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "List" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Card" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "+ Add Game" })
    ).toBeInTheDocument();
  });

  it("calls onAddClick when the Add Game button is clicked", async () => {
    const user = userEvent.setup();
    render(<BacklogToolbar {...baseProps} />);

    await user.click(screen.getByRole("button", { name: "+ Add Game" }));

    expect(baseProps.onAddClick).toHaveBeenCalledTimes(1);
  });

  it("calls onViewChange with 'card' when the Card button is clicked", async () => {
    const user = userEvent.setup();
    render(<BacklogToolbar {...baseProps} />);

    await user.click(screen.getByRole("button", { name: "Card" }));

    expect(baseProps.onViewChange).toHaveBeenCalledWith("card");
  });

  it("calls onSortChange with the new field when the sort select changes", async () => {
    const user = userEvent.setup();
    render(<BacklogToolbar {...baseProps} />);

    await user.selectOptions(screen.getByRole("combobox"), "title");

    expect(baseProps.onSortChange).toHaveBeenCalledWith("title", "desc");
  });

  it("toggles sort direction when the direction button is clicked", async () => {
    const user = userEvent.setup();
    render(<BacklogToolbar {...baseProps} sortDirection="desc" />);

    await user.click(screen.getByRole("button", { name: /toggle sort direction/i }));

    expect(baseProps.onSortChange).toHaveBeenCalledWith("hype", "asc");
  });

  it("renders the ascending direction label when sortDirection is 'asc'", () => {
    render(<BacklogToolbar {...baseProps} sortDirection="asc" />);

    expect(screen.getByText("↑ Asc")).toBeInTheDocument();
  });
});
