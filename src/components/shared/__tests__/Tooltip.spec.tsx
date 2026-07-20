import { act, fireEvent, render, screen } from "@testing-library/react";
import { Tooltip } from "../Tooltip";

describe("Tooltip", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("shows a multiline tooltip when text is truncated vertically", () => {
    jest.useFakeTimers();
    render(
      <Tooltip content="A long game title" multiline>
        A long game title
      </Tooltip>
    );
    const trigger = screen.getByText("A long game title");
    Object.defineProperties(trigger, {
      clientHeight: { configurable: true, value: 40 },
      clientWidth: { configurable: true, value: 200 },
      scrollHeight: { configurable: true, value: 60 },
      scrollWidth: { configurable: true, value: 200 },
    });
    jest
      .spyOn(trigger, "getBoundingClientRect")
      .mockReturnValue(
        new DOMRect(0, 0, 200, 40)
      );

    fireEvent.mouseEnter(trigger);
    act(() => {
      jest.advanceTimersByTime(350);
    });

    expect(screen.getByRole("tooltip")).toHaveTextContent("A long game title");
  });
});
