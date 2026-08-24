const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopSettings", {
  getGameLookupStatus: () => ipcRenderer.invoke("game-lookup:status"),
  saveIgdbCredentials: (clientId, clientSecret) =>
    ipcRenderer.invoke("game-lookup:save-credentials", clientId, clientSecret),
  clearIgdbCredentials: () => ipcRenderer.invoke("game-lookup:clear-credentials"),
});

contextBridge.exposeInMainWorld("journalMedia", {
  save: (payload) => ipcRenderer.invoke("journal-media:save", payload),
  remove: (storageKey) => ipcRenderer.invoke("journal-media:remove", storageKey),
  removeMany: (storageKeys) => ipcRenderer.invoke("journal-media:remove-many", storageKeys),
  getDirectory: () => ipcRenderer.invoke("journal-media:get-directory"),
  read: (storageKey) => ipcRenderer.invoke("journal-media:read", storageKey),
});
