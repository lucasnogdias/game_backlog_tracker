"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface ActionsMenuItem {
  label: string;
  onClick: () => void;
  /** Renders the item in red text, for destructive actions like Delete. */
  destructive?: boolean;
}

interface ActionsMenuProps {
  items: ActionsMenuItem[];
}

// Keep in sync with the dropdown's width class below (w-40 = 10rem = 160px).
const MENU_WIDTH_PX = 160;

/**
 * A "..." kebab button that opens a dropdown of row/card actions on click.
 *
 * The dropdown is rendered through a portal into `document.body` with
 * `position: fixed`, anchored to the trigger button's on-screen position.
 * This avoids being clipped or forcing a scrollbar when the trigger sits
 * inside a container with `overflow-hidden`/`overflow-auto` (e.g. a table
 * wrapper or a card), which a plain `position: absolute` dropdown would be
 * constrained by.
 */
export function ActionsMenu({ items }: ActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(
    null
  );
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  function openMenu() {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) {
      setPosition({
        top: rect.bottom + 4,
        left: rect.right - MENU_WIDTH_PX,
      });
    }
    setIsOpen(true);
  }

  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target)) return;
      if (menuRef.current?.contains(target)) return;
      setIsOpen(false);
    }

    // Closes the menu on scroll (in any scrollable ancestor, hence `capture`)
    // rather than repositioning it, since it's a short-lived dropdown.
    function handleScroll() {
      setIsOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => (isOpen ? setIsOpen(false) : openMenu())}
        aria-label="Actions"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        className="rounded px-2 py-1 text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        &#8942;
      </button>

      {isOpen &&
        position &&
        createPortal(
          <div
            ref={menuRef}
            role="menu"
            style={{ top: position.top, left: position.left }}
            className="fixed z-50 w-40 rounded border border-neutral-200 bg-white py-1 text-sm shadow-lg dark:border-neutral-700 dark:bg-neutral-900"
          >
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                onClick={() => {
                  setIsOpen(false);
                  item.onClick();
                }}
                className={
                  "block w-full px-3 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800 " +
                  (item.destructive ? "text-red-600" : "text-neutral-700 dark:text-neutral-200")
                }
              >
                {item.label}
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
}
