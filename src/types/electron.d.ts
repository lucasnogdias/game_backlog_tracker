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
    journalMedia?: {
      save: (payload: {
        historyEntryId: string;
        journalEntryId: string;
        gameTitle: string;
        name: string;
        mimeType: "image/png" | "image/jpeg" | "image/webp";
        data: ArrayBuffer;
      }) => Promise<import("./journal").JournalImageAttachmentInput>;
      remove: (storageKey: string) => Promise<void>;
      read: (storageKey: string) => Promise<string>;
    };
  }
}
