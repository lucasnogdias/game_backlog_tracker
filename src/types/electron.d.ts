export {};

declare global {
  interface Window {
    desktopSettings?: {
      getGameLookupStatus: () => Promise<{
        canConfigure: boolean;
        configured: boolean;
        rawgConfigured: boolean;
      }>;
      saveIgdbCredentials: (
        clientId: string,
        clientSecret: string
      ) => Promise<void>;
      clearIgdbCredentials: () => Promise<void>;
      saveRawgApiKey: (apiKey: string) => Promise<void>;
      clearRawgApiKey: () => Promise<void>;
    };
  }
}
