export {};

declare global {
  interface Window {
    desktopSettings?: {
      getGameLookupStatus: () => Promise<{
        canConfigure: boolean;
        configured: boolean;
      }>;
      saveRawgApiKey: (apiKey: string) => Promise<void>;
      clearRawgApiKey: () => Promise<void>;
    };
  }
}
