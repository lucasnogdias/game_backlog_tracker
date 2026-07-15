const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopSettings", {
  getGameLookupStatus: () => ipcRenderer.invoke("game-lookup:status"),
  saveRawgApiKey: (apiKey) => ipcRenderer.invoke("game-lookup:save-key", apiKey),
  clearRawgApiKey: () => ipcRenderer.invoke("game-lookup:clear-key"),
});
