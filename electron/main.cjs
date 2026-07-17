const { app, BrowserWindow, dialog, ipcMain, safeStorage } = require("electron");
const { spawn } = require("child_process");
const fs = require("fs");
const http = require("http");
const net = require("net");
const path = require("path");

let mainWindow;
let serverProcess;
let serverPort;
let isQuitting = false;

function packagedResourcePath(...segments) {
  return path.join(process.resourcesPath, ...segments);
}

function databasePath() {
  return path.join(app.getPath("userData"), "game-backlog-tracker.db");
}

function backupsPath() {
  return path.join(app.getPath("userData"), "backups");
}

function igdbCredentialsPath() {
  return path.join(app.getPath("userData"), "igdb-credentials.bin");
}

function rawgKeyPath() {
  return path.join(app.getPath("userData"), "rawg-api-key.bin");
}

function defaultSettingsPath() {
  return app.isPackaged
    ? packagedResourcePath("default-settings.json")
    : path.join(app.getAppPath(), ".electron-build", "default-settings.json");
}

function serverModulesPath() {
  return packagedResourcePath("next", "node_modules");
}

function defaultIgdbCredentials() {
  try {
    const settings = JSON.parse(fs.readFileSync(defaultSettingsPath(), "utf8"));
    if (
      typeof settings.igdbClientId === "string" &&
      typeof settings.igdbClientSecret === "string"
    ) {
      return {
        clientId: settings.igdbClientId,
        clientSecret: settings.igdbClientSecret,
      };
    }
  } catch {
    // Public builds intentionally have no default credentials.
  }
  return { clientId: "", clientSecret: "" };
}

function savedIgdbCredentials() {
  const credentialsPath = igdbCredentialsPath();
  if (!fs.existsSync(credentialsPath)) return null;
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error("Secure storage is unavailable on this system.");
  }
  const credentials = JSON.parse(
    safeStorage.decryptString(fs.readFileSync(credentialsPath))
  );
  if (
    typeof credentials.clientId !== "string" ||
    typeof credentials.clientSecret !== "string"
  ) {
    throw new Error("Saved IGDB credentials are invalid.");
  }
  return credentials;
}

function igdbCredentials() {
  return savedIgdbCredentials() || defaultIgdbCredentials();
}

function defaultRawgApiKey() {
  try {
    const settings = JSON.parse(fs.readFileSync(defaultSettingsPath(), "utf8"));
    return typeof settings.rawgApiKey === "string" ? settings.rawgApiKey : "";
  } catch {
    return "";
  }
}

function savedRawgApiKey() {
  const keyPath = rawgKeyPath();
  if (!fs.existsSync(keyPath)) return "";
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error("Secure storage is unavailable on this system.");
  }
  return safeStorage.decryptString(fs.readFileSync(keyPath));
}

function rawgApiKey() {
  return savedRawgApiKey() || defaultRawgApiKey();
}

function saveIgdbCredentials(clientId, clientSecret) {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error("Secure storage is unavailable on this system.");
  }
  fs.writeFileSync(
    igdbCredentialsPath(),
    safeStorage.encryptString(JSON.stringify({ clientId, clientSecret }))
  );
}

function saveRawgApiKey(apiKey) {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error("Secure storage is unavailable on this system.");
  }
  fs.writeFileSync(rawgKeyPath(), safeStorage.encryptString(apiKey));
}

function clearRawgApiKey() {
  fs.rmSync(rawgKeyPath(), { force: true });
}

function clearIgdbCredentials() {
  fs.rmSync(igdbCredentialsPath(), { force: true });
}

function runElectronNode(scriptPath, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [scriptPath, ...args], {
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: "1",
        NODE_PATH: [serverModulesPath(), process.env.NODE_PATH]
          .filter(Boolean)
          .join(path.delimiter),
      },
      stdio: ["ignore", "ignore", "pipe"],
    });
    let errorOutput = "";
    child.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) resolve();
      else {
        reject(
          new Error(
            errorOutput.trim() ||
              `Desktop database setup exited with code ${code}.`
          )
        );
      }
    });
  });
}

async function initializePackagedDatabase() {
  if (!app.isPackaged) return;
  await runElectronNode(packagedResourcePath("desktop", "database.cjs"), [
    databasePath(),
    packagedResourcePath("prisma", "migrations"),
    backupsPath(),
  ]);
}

function findAvailablePort() {
  return new Promise((resolve, reject) => {
    const listener = net.createServer();
    listener.once("error", reject);
    listener.listen(0, "127.0.0.1", () => {
      const address = listener.address();
      const port = typeof address === "object" && address ? address.port : null;
      listener.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

function waitForServer(port) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    const check = () => {
      const request = http.get(`http://127.0.0.1:${port}`, (response) => {
        response.resume();
        if (response.statusCode && response.statusCode < 500) {
          resolve();
        } else {
          retry();
        }
      });
      request.on("error", retry);
      request.setTimeout(500, () => request.destroy());
    };
    const retry = () => {
      attempts += 1;
      if (attempts >= 50) {
        reject(new Error("The packaged app server did not start."));
        return;
      }
      setTimeout(check, 100);
    };
    check();
  });
}

async function startPackagedServer() {
  serverPort = await findAvailablePort();
  const serverPath = packagedResourcePath("next", "server.js");
  const child = spawn(process.execPath, [serverPath], {
    env: {
      ...process.env,
      DATABASE_URL: `file:${databasePath()}`,
      ELECTRON_RUN_AS_NODE: "1",
      HOSTNAME: "127.0.0.1",
      NEXT_TELEMETRY_DISABLED: "1",
      NODE_PATH: [serverModulesPath(), process.env.NODE_PATH]
        .filter(Boolean)
        .join(path.delimiter),
      NODE_ENV: "production",
      PORT: String(serverPort),
      IGDB_CLIENT_ID: igdbCredentials().clientId,
      IGDB_CLIENT_SECRET: igdbCredentials().clientSecret,
      RAWG_API_KEY: rawgApiKey(),
    },
    stdio: "pipe",
  });
  serverProcess = child;
  child.stderr.on("data", (data) => console.error(data.toString()));
  child.once("exit", () => {
    if (serverProcess === child) {
      serverProcess = undefined;
    }
  });
  try {
    await waitForServer(serverPort);
  } catch (error) {
    await stopPackagedServer();
    throw error;
  }
}

function stopPackagedServer() {
  const child = serverProcess;
  if (!child) return Promise.resolve();

  serverProcess = undefined;
  return new Promise((resolve) => {
    if (child.exitCode !== null) {
      resolve();
      return;
    }
    child.once("exit", resolve);
    child.kill();
  });
}

async function loadApplication() {
  if (app.isPackaged) {
    if (!serverProcess) {
      await startPackagedServer();
    }
    await mainWindow.loadURL(`http://127.0.0.1:${serverPort}`);
    return;
  }
  await mainWindow.loadURL(
    process.env.ELECTRON_RENDERER_URL ?? "http://127.0.0.1:3000"
  );
}

async function restartPackagedServer() {
  if (!app.isPackaged) {
    throw new Error("Game lookup settings are available in the packaged app.");
  }
  await stopPackagedServer();
  await loadApplication();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 900,
    minHeight: 650,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, "preload.cjs"),
    },
  });
}

ipcMain.handle("game-lookup:status", () => ({
  canConfigure: app.isPackaged && safeStorage.isEncryptionAvailable(),
  configured: Boolean(
    igdbCredentials().clientId && igdbCredentials().clientSecret
  ),
  rawgConfigured: Boolean(rawgApiKey()),
}));

ipcMain.handle(
  "game-lookup:save-credentials",
  async (_event, clientId, clientSecret) => {
    if (
      typeof clientId !== "string" ||
      !clientId.trim() ||
      typeof clientSecret !== "string" ||
      !clientSecret.trim()
    ) {
      throw new Error("An IGDB client ID and client secret are required.");
    }
    if (!app.isPackaged) {
      throw new Error("Game lookup settings are available in the packaged app.");
    }
    saveIgdbCredentials(clientId.trim(), clientSecret.trim());
    await restartPackagedServer();
  }
);

ipcMain.handle("game-lookup:clear-credentials", async () => {
  if (!app.isPackaged) {
    throw new Error("Game lookup settings are available in the packaged app.");
  }
  clearIgdbCredentials();
  await restartPackagedServer();
});

ipcMain.handle("game-lookup:save-rawg-key", async (_event, apiKey) => {
  if (typeof apiKey !== "string" || !apiKey.trim()) {
    throw new Error("A RAWG API key is required.");
  }
  if (!app.isPackaged) {
    throw new Error("Game lookup settings are available in the packaged app.");
  }
  saveRawgApiKey(apiKey.trim());
  await restartPackagedServer();
});

ipcMain.handle("game-lookup:clear-rawg-key", async () => {
  if (!app.isPackaged) {
    throw new Error("Game lookup settings are available in the packaged app.");
  }
  clearRawgApiKey();
  await restartPackagedServer();
});

const hasSingleInstanceLock = app.requestSingleInstanceLock();

if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  });

  app.whenReady().then(async () => {
    try {
      await initializePackagedDatabase();
      createWindow();
      await loadApplication();
    } catch (error) {
      await dialog.showMessageBox({
        type: "error",
        title: "Game Backlog Tracker could not update its data",
        message: error instanceof Error ? error.message : "Unknown startup error.",
      });
      app.quit();
    }
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
      void loadApplication();
    }
  });

  app.on("before-quit", (event) => {
    if (isQuitting || !serverProcess) return;
    event.preventDefault();
    isQuitting = true;
    void stopPackagedServer().finally(() => app.quit());
  });
}
