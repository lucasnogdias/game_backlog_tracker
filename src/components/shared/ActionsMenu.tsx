"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import styles from "./ActionsMenu.module.css";

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
        className={styles.trigger}
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
            className={styles.menu}
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
                  item.destructive
                    ? `${styles.menuItem} ${styles.menuItemDestructive}`
                    : styles.menuItem
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
