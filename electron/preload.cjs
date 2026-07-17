const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktopSettings", {
  getGameLookupStatus: () => ipcRenderer.invoke("game-lookup:status"),
  saveIgdbCredentials: (clientId, clientSecret) =>
    ipcRenderer.invoke("game-lookup:save-credentials", clientId, clientSecret),
  clearIgdbCredentials: () => ipcRenderer.invoke("game-lookup:clear-credentials"),
});
