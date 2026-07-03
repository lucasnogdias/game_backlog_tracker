import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HistoryToolbar } from "../HistoryToolbar";

describe("HistoryToolbar", () => {
  const baseProps = {
    view: "list" as const,
    onViewChange: jest.fn(),
    sortField: "addedAt" as const,
    sortDirection: "asc" as const,
    onSortChange: jest.fn(),
    onAddClick: jest.fn(),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders sort options, view toggle, and add button", () => {
    render(<HistoryToolbar {...baseProps} />);

    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "List" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Card" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "+ Add Game" })
    ).toBeInTheDocument();
  });

  it("calls onAddClick when the Add Game button is clicked", async () => {
    const user = userEvent.setup();
    render(<HistoryToolbar {...baseProps} />);

    await user.click(screen.getByRole("button", { name: "+ Add Game" }));

    expect(baseProps.onAddClick).toHaveBeenCalledTimes(1);
  });

  it("calls onViewChange with 'card' when the Card button is clicked", async () => {
    const user = userEvent.setup();
    render(<HistoryToolbar {...baseProps} />);

    await user.click(screen.getByRole("button", { name: "Card" }));

    expect(baseProps.onViewChange).toHaveBeenCalledWith("card");
  });

  it("calls onSortChange with the new field when the sort select changes", async () => {
    const user = userEvent.setup();
    render(<HistoryToolbar {...baseProps} />);

    await user.selectOptions(screen.getByRole("combobox"), "title");

    expect(baseProps.onSortChange).toHaveBeenCalledWith("title", "asc");
  });

  it("toggles sort direction when the direction button is clicked", async () => {
    const user = userEvent.setup();
    render(<HistoryToolbar {...baseProps} sortDirection="asc" />);

    await user.click(
      screen.getByRole("button", { name: /toggle sort direction/i })
    );

    expect(baseProps.onSortChange).toHaveBeenCalledWith("addedAt", "desc");
  });

  it("renders the newest-first direction label when sortDirection is 'desc'", () => {
    render(<HistoryToolbar {...baseProps} sortDirection="desc" />);

    expect(screen.getByText("↓ Newest first")).toBeInTheDocument();
  });

  it("renders the oldest-first direction label when sortDirection is 'asc'", () => {
    render(<HistoryToolbar {...baseProps} sortDirection="asc" />);

    expect(screen.getByText("↑ Oldest first")).toBeInTheDocument();
  });
});
