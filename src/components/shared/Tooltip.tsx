"use client";

import {
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import styles from "./Tooltip.module.css";

interface TooltipProps {
  content: string;
  children: ReactNode;
  multiline?: boolean;
}

const SHOW_DELAY_MS = 350;

export function Tooltip({ content, children, multiline = false }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tooltipId = useId();

  function show() {
    const trigger = document.getElementById(tooltipId);
    if (
      !trigger ||
      (trigger.scrollWidth <= trigger.clientWidth &&
        trigger.scrollHeight <= trigger.clientHeight)
    ) {
      return;
    }

    const bounds = trigger.getBoundingClientRect();
    setPosition({
      left: Math.min(bounds.left, window.innerWidth - 20),
      top: bounds.bottom + 8,
    });
    timer.current = setTimeout(() => setIsVisible(true), SHOW_DELAY_MS);
  }

  function hide() {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    setIsVisible(false);
  }

  useEffect(() => hide, []);

  return (
    <>
      <span
        id={tooltipId}
        className={`${styles.trigger} ${multiline ? styles.multilineTrigger : ""}`}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        tabIndex={0}
        aria-describedby={isVisible ? `${tooltipId}-tooltip` : undefined}
      >
        {children}
      </span>
      {isVisible &&
        createPortal(
          <span
            id={`${tooltipId}-tooltip`}
            role="tooltip"
            className={styles.tooltip}
            style={position}
          >
            {content}
          </span>,
          document.body
        )}
    </>
  );
}
