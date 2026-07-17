"use client";

import { useCallback, useEffect, useState } from "react";

const GAME_VIEW_PREFERENCE_KEY = "game-backlog-tracker:view";

export type GameView = "list" | "card";

function isGameView(value: string | null): value is GameView {
  return value === "list" || value === "card";
}

export function useGameViewPreference(): [GameView, (view: GameView) => void] {
  const [view, setView] = useState<GameView>("list");

  useEffect(() => {
    const savedView = window.localStorage.getItem(GAME_VIEW_PREFERENCE_KEY);
    if (isGameView(savedView)) {
      setView(savedView);
    }
  }, []);

  const setPreferredView = useCallback((nextView: GameView) => {
    setView(nextView);
    window.localStorage.setItem(GAME_VIEW_PREFERENCE_KEY, nextView);
  }, []);

  return [view, setPreferredView];
}
