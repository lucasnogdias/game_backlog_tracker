import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataTable, type DataTableColumn } from "../DataTable";

interface Item {
  id: string;
  name: string;
  notes: string | null;
}

const columns: DataTableColumn<Item>[] = [
  { header: "Name", className: "px-4 py-2 font-medium", render: (i) => i.name },
  {
    header: "Notes",
    className: "max-w-xs truncate px-4 py-2 text-neutral-500",
    cellTitle: (i) => i.notes ?? undefined,
    render: (i) => i.notes ?? "—",
  },
];

function makeItem(overrides: Partial<Item> = {}): Item {
  return { id: "1", name: "Item One", notes: "Some notes", ...overrides };
}

describe("DataTable", () => {
  it("renders the empty message when there are no items", () => {
    render(
      <DataTable
        items={[]}
        columns={columns}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        emptyMessage="Nothing here yet."
      />
    );

    expect(screen.getByText("Nothing here yet.")).toBeInTheDocument();
  });

  it("renders a header and a row per item using the column config", () => {
    const item = makeItem();
    render(
      <DataTable
        items={[item]}
        columns={columns}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        emptyMessage="Nothing here yet."
      />
    );

    expect(screen.getByRole("columnheader", { name: "Name" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Notes" })).toBeInTheDocument();
    expect(screen.getByText("Item One")).toBeInTheDocument();
    expect(screen.getByText("Some notes")).toBeInTheDocument();
  });

  it("applies the cellTitle attribute when provided", () => {
    const item = makeItem({ notes: "Truncated content" });
    render(
      <DataTable
        items={[item]}
        columns={columns}
        onEdit={jest.fn()}
        onDelete={jest.fn()}
        emptyMessage="Nothing here yet."
      />
    );

    expect(screen.getByText("Truncated content")).toHaveAttribute(
      "title",
      "Truncated content"
    );
  });

  it("calls onEdit and onDelete with the item when the row actions are clicked", async () => {
    const user = userEvent.setup();
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    const item = makeItem();

    render(
      <DataTable
        items={[item]}
        columns={columns}
        onEdit={onEdit}
        onDelete={onDelete}
        emptyMessage="Nothing here yet."
      />
    );

    await user.click(screen.getByRole("button", { name: "Edit" }));
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(onEdit).toHaveBeenCalledWith(item);
    expect(onDelete).toHaveBeenCalledWith(item);
  });
});
