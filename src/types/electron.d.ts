export {};

declare global {
  interface Window {
    desktopSettings?: {
      getGameLookupStatus: () => Promise<{
        canConfigure: boolean;
        configured: boolean;
      }>;
      saveIgdbCredentials: (
        clientId: string,
        clientSecret: string
      ) => Promise<void>;
      clearIgdbCredentials: () => Promise<void>;
    };
  }
}
