import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toolbar, type SortOption } from "../Toolbar";

type Field = "name" | "date";

const sortOptions: SortOption<Field>[] = [
  { value: "name", label: "Name" },
  { value: "date", label: "Date" },
];

describe("Toolbar", () => {
  const baseProps = {
    view: "list" as const,
    onViewChange: jest.fn(),
    sortField: "name" as Field,
    sortDirection: "asc" as const,
    onSortChange: jest.fn(),
    onAddClick: jest.fn(),
    sortOptions,
    directionLabel: (direction: "asc" | "desc") =>
      direction === "asc" ? "↑ Up" : "↓ Down",
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders sort options, direction label, view toggle, and default add button label", () => {
    render(<Toolbar {...baseProps} />);

    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByText("↑ Up")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "List" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Card" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "+ Add Game" })
    ).toBeInTheDocument();
  });

  it("renders a custom add button label when provided", () => {
    render(<Toolbar {...baseProps} addButtonLabel="+ Add Entry" />);

    expect(
      screen.getByRole("button", { name: "+ Add Entry" })
    ).toBeInTheDocument();
  });

  it("calls onAddClick when the add button is clicked", async () => {
    const user = userEvent.setup();
    render(<Toolbar {...baseProps} />);

    await user.click(screen.getByRole("button", { name: "+ Add Game" }));

    expect(baseProps.onAddClick).toHaveBeenCalledTimes(1);
  });

  it("calls onViewChange with 'card' when the Card button is clicked", async () => {
    const user = userEvent.setup();
    render(<Toolbar {...baseProps} />);

    await user.click(screen.getByRole("button", { name: "Card" }));

    expect(baseProps.onViewChange).toHaveBeenCalledWith("card");
  });

  it("calls onSortChange with the new field when the sort select changes", async () => {
    const user = userEvent.setup();
    render(<Toolbar {...baseProps} />);

    await user.selectOptions(screen.getByRole("combobox"), "date");

    expect(baseProps.onSortChange).toHaveBeenCalledWith("date", "asc");
  });

  it("toggles sort direction when the direction button is clicked", async () => {
    const user = userEvent.setup();
    render(<Toolbar {...baseProps} sortDirection="asc" />);

    await user.click(
      screen.getByRole("button", { name: /toggle sort direction/i })
    );

    expect(baseProps.onSortChange).toHaveBeenCalledWith("name", "desc");
  });
});
