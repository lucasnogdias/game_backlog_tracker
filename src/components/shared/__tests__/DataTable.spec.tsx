import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DataTable, type DataTableColumn } from "../DataTable";

interface Item {
  id: string;
  name: string;
  notes: string | null;
}

const columns: DataTableColumn<Item>[] = [
  { header: "Name", variant: "emphasis", render: (i) => i.name },
  {
    header: "Notes",
    variant: "truncate",
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
        emptyMessage="Nothing here yet."
        renderActions={() => null}
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
        emptyMessage="Nothing here yet."
        renderActions={() => null}
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
        emptyMessage="Nothing here yet."
        renderActions={() => null}
      />
    );

    expect(screen.getByText("Truncated content")).toHaveAttribute(
      "title",
      "Truncated content"
    );
  });

  it("renders whatever renderActions returns for each item", async () => {
    const user = userEvent.setup();
    const onAction = jest.fn();
    const item = makeItem();

    render(
      <DataTable
        items={[item]}
        columns={columns}
        emptyMessage="Nothing here yet."
        renderActions={(i) => (
          <button type="button" onClick={() => onAction(i)}>
            Custom Action
          </button>
        )}
      />
    );

    await user.click(screen.getByRole("button", { name: "Custom Action" }));

    expect(onAction).toHaveBeenCalledWith(item);
  });
});
