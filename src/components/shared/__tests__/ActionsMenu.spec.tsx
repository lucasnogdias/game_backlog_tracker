import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ActionsMenu } from "../ActionsMenu";

describe("ActionsMenu", () => {
  it("does not show the menu items until the kebab button is clicked", () => {
    render(
      <ActionsMenu items={[{ label: "Edit", onClick: jest.fn() }]} />
    );

    expect(screen.queryByRole("menuitem", { name: "Edit" })).not.toBeInTheDocument();
  });

  it("opens the menu and shows all items when the kebab button is clicked", async () => {
    const user = userEvent.setup();
    render(
      <ActionsMenu
        items={[
          { label: "Edit", onClick: jest.fn() },
          { label: "Delete", onClick: jest.fn(), destructive: true },
        ]}
      />
    );

    await user.click(screen.getByRole("button", { name: "Actions" }));

    expect(screen.getByRole("menuitem", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Delete" })).toBeInTheDocument();
  });

  it("calls the item's onClick and closes the menu when an item is clicked", async () => {
    const user = userEvent.setup();
    const onEdit = jest.fn();
    render(<ActionsMenu items={[{ label: "Edit", onClick: onEdit }]} />);

    await user.click(screen.getByRole("button", { name: "Actions" }));
    await user.click(screen.getByRole("menuitem", { name: "Edit" }));

    expect(onEdit).toHaveBeenCalled();
    expect(screen.queryByRole("menuitem", { name: "Edit" })).not.toBeInTheDocument();
  });

  it("closes the menu when clicking outside of it", async () => {
    const user = userEvent.setup();
    render(
      <div>
        <ActionsMenu items={[{ label: "Edit", onClick: jest.fn() }]} />
        <button type="button">Outside</button>
      </div>
    );

    await user.click(screen.getByRole("button", { name: "Actions" }));
    expect(screen.getByRole("menuitem", { name: "Edit" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Outside" }));

    expect(screen.queryByRole("menuitem", { name: "Edit" })).not.toBeInTheDocument();
  });

  it("closes the menu when the page is scrolled", async () => {
    const user = userEvent.setup();
    render(<ActionsMenu items={[{ label: "Edit", onClick: jest.fn() }]} />);

    await user.click(screen.getByRole("button", { name: "Actions" }));
    expect(screen.getByRole("menuitem", { name: "Edit" })).toBeInTheDocument();

    fireEvent.scroll(document);

    expect(screen.queryByRole("menuitem", { name: "Edit" })).not.toBeInTheDocument();
  });
});
