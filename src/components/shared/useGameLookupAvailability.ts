"use client";

import { useEffect, useState } from "react";

interface GameLookupAvailability {
  available: boolean;
  canConfigure: boolean;
}

export function useGameLookupAvailability(): GameLookupAvailability {
  const [availability, setAvailability] = useState<GameLookupAvailability>({
    available: true,
    canConfigure: false,
  });

  useEffect(() => {
    if (!window.desktopSettings) return;

    void window.desktopSettings
      .getGameLookupStatus()
      .then((status) => {
        setAvailability({
          available: status.configured,
          canConfigure: status.canConfigure,
        });
      })
      .catch(() => {
        setAvailability({ available: false, canConfigure: false });
      });
  }, []);

  return availability;
}
