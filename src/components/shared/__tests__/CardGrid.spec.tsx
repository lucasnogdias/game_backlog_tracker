import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CardGrid } from "../CardGrid";

interface Item {
  id: string;
  title: string;
  coverImageUrl: string | null;
  subtitle: string;
}

function makeItem(overrides: Partial<Item> = {}): Item {
  return {
    id: "1",
    title: "Item One",
    coverImageUrl: null,
    subtitle: "Some meta info",
    ...overrides,
  };
}

describe("CardGrid", () => {
  it("renders the empty message when there are no items", () => {
    render(
      <CardGrid
        items={[]}
        onSetCoverImage={jest.fn()}
        renderMeta={(i: Item) => <p>{i.subtitle}</p>}
        renderActions={() => null}
        emptyMessage="Nothing here yet."
      />
    );

    expect(screen.getByText("Nothing here yet.")).toBeInTheDocument();
  });

  it("renders a placeholder button when no cover image is set", () => {
    const item = makeItem();
    render(
      <CardGrid
        items={[item]}
        onSetCoverImage={jest.fn()}
        renderMeta={(i: Item) => <p>{i.subtitle}</p>}
        renderActions={() => null}
        emptyMessage="Nothing here yet."
      />
    );

    expect(
      screen.getByRole("button", { name: /add cover image/i })
    ).toBeInTheDocument();
    expect(screen.getByText("Some meta info")).toBeInTheDocument();
  });

  it("renders an image when a cover image URL is set", () => {
    const item = makeItem({ coverImageUrl: "https://example.com/cover.jpg" });
    render(
      <CardGrid
        items={[item]}
        onSetCoverImage={jest.fn()}
        renderMeta={(i: Item) => <p>{i.subtitle}</p>}
        renderActions={() => null}
        emptyMessage="Nothing here yet."
      />
    );

    const image = screen.getByRole("img", { name: "Item One cover art" });
    expect(image).toHaveAttribute("src", "https://example.com/cover.jpg");
  });

  it("prompts for a URL and calls onSetCoverImage when the placeholder is clicked", async () => {
    const user = userEvent.setup();
    const onSetCoverImage = jest.fn();
    const promptSpy = jest
      .spyOn(window, "prompt")
      .mockReturnValue("https://example.com/new-cover.jpg");
    const item = makeItem();

    render(
      <CardGrid
        items={[item]}
        onSetCoverImage={onSetCoverImage}
        renderMeta={(i: Item) => <p>{i.subtitle}</p>}
        renderActions={() => null}
        emptyMessage="Nothing here yet."
      />
    );

    await user.click(screen.getByRole("button", { name: /add cover image/i }));

    expect(onSetCoverImage).toHaveBeenCalledWith(
      item,
      "https://example.com/new-cover.jpg"
    );

    promptSpy.mockRestore();
  });

  it("does not call onSetCoverImage if the prompt is cancelled or blank", async () => {
    const user = userEvent.setup();
    const onSetCoverImage = jest.fn();
    const promptSpy = jest.spyOn(window, "prompt").mockReturnValue(null);
    const item = makeItem();

    render(
      <CardGrid
        items={[item]}
        onSetCoverImage={onSetCoverImage}
        renderMeta={(i: Item) => <p>{i.subtitle}</p>}
        renderActions={() => null}
        emptyMessage="Nothing here yet."
      />
    );

    await user.click(screen.getByRole("button", { name: /add cover image/i }));

    expect(onSetCoverImage).not.toHaveBeenCalled();

    promptSpy.mockRestore();
  });

  it("renders whatever renderActions returns for each item", async () => {
    const user = userEvent.setup();
    const onAction = jest.fn();
    const item = makeItem();

    render(
      <CardGrid
        items={[item]}
        onSetCoverImage={jest.fn()}
        renderMeta={(i: Item) => <p>{i.subtitle}</p>}
        renderActions={(i) => (
          <button type="button" onClick={() => onAction(i)}>
            Custom Action
          </button>
        )}
        emptyMessage="Nothing here yet."
      />
    );

    await user.click(screen.getByRole("button", { name: "Custom Action" }));

    expect(onAction).toHaveBeenCalledWith(item);
  });
});
