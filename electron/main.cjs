const { app, BrowserWindow, dialog, ipcMain, safeStorage } = require("electron");
const { spawn } = require("child_process");
const { randomUUID } = require("crypto");
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

const JOURNAL_IMAGE_TYPES = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
};
const MAX_JOURNAL_IMAGE_SIZE = 10 * 1024 * 1024;

function journalImagesPath() {
  return path.join(app.getPath("userData"), "journal-images");
}

function safeFilenamePart(value) {
  return value
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "game";
}

function imageBuffer(data) {
  if (
    !data ||
    !(
      Buffer.isBuffer(data) ||
      data instanceof ArrayBuffer ||
      ArrayBuffer.isView(data)
    )
  ) {
    throw new Error("Screenshot data is invalid.");
  }
  return Buffer.from(data);
}

function imageMatchesType(buffer, mimeType) {
  if (mimeType === "image/png") {
    return buffer.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    );
  }
  if (mimeType === "image/jpeg") {
    return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  }
  return (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).equals(Buffer.from("RIFF")) &&
    buffer.subarray(8, 12).equals(Buffer.from("WEBP"))
  );
}

function journalImageFile(storageKey) {
  if (
    typeof storageKey !== "string" ||
    path.basename(storageKey) !== storageKey ||
    !/^[-_a-z0-9]+\.{1}[a-z0-9]+$/i.test(storageKey)
  ) {
    throw new Error("Screenshot reference is invalid.");
  }
  const root = journalImagesPath();
  const file = path.resolve(root, storageKey);
  if (!file.startsWith(`${root}${path.sep}`)) {
    throw new Error("Screenshot reference is invalid.");
  }
  return file;
}

function removeLegacyRawgKey() {
  fs.rmSync(path.join(app.getPath("userData"), "rawg-api-key.bin"), {
    force: true,
  });
}

function igdbCredentialsPath() {
  return path.join(app.getPath("userData"), "igdb-credentials.bin");
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

function saveIgdbCredentials(clientId, clientSecret) {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error("Secure storage is unavailable on this system.");
  }
  fs.writeFileSync(
    igdbCredentialsPath(),
    safeStorage.encryptString(JSON.stringify({ clientId, clientSecret }))
  );
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

ipcMain.handle("journal-media:save", (_event, payload) => {
  if (
    !payload ||
    typeof payload !== "object" ||
    typeof payload.historyEntryId !== "string" ||
    typeof payload.journalEntryId !== "string" ||
    typeof payload.gameTitle !== "string" ||
    !Number.isInteger(payload.journalEntryNumber) ||
    payload.journalEntryNumber < 1 ||
    !Object.hasOwn(JOURNAL_IMAGE_TYPES, payload.mimeType)
  ) {
    throw new Error("Screenshot details are invalid.");
  }
  const buffer = imageBuffer(payload.data);
  if (!buffer.length || buffer.length > MAX_JOURNAL_IMAGE_SIZE) {
    throw new Error("Each screenshot must be 10 MB or smaller.");
  }
  if (!imageMatchesType(buffer, payload.mimeType)) {
    throw new Error("The screenshot file does not match its image format.");
  }

  const extension = JOURNAL_IMAGE_TYPES[payload.mimeType];
  const filenamePrefix = `${safeFilenamePart(payload.gameTitle)}_journal_entry${payload.journalEntryNumber}`;
  fs.mkdirSync(journalImagesPath(), { recursive: true });
  const existingImageNumbers = fs
    .readdirSync(journalImagesPath())
    .map((file) => {
      const match = file.match(
        new RegExp(`^${filenamePrefix}_image(\\d+)\\.(png|jpg|webp)$`, "i")
      );
      return match ? Number(match[1]) : 0;
    });
  const imageNumber = Math.max(0, ...existingImageNumbers) + 1;
  const storageKey = `${filenamePrefix}_image${imageNumber}.${extension}`;
  const file = journalImageFile(storageKey);
  fs.writeFileSync(file, buffer, { flag: "wx" });
  return {
    id: randomUUID(),
    storageKey,
    originalName: storageKey,
    mimeType: payload.mimeType,
    size: buffer.length,
  };
});

ipcMain.handle("journal-media:remove", (_event, storageKey) => {
  fs.rmSync(journalImageFile(storageKey), { force: true });
});

ipcMain.handle("journal-media:remove-many", (_event, storageKeys) => {
  if (!Array.isArray(storageKeys)) throw new Error("Screenshot references are invalid.");
  for (const storageKey of storageKeys) {
    fs.rmSync(journalImageFile(storageKey), { force: true });
  }
});

ipcMain.handle("journal-media:get-directory", () => journalImagesPath());

ipcMain.handle("journal-media:read", (_event, storageKey) => {
  const file = journalImageFile(storageKey);
  const buffer = fs.readFileSync(file);
  const extension = path.extname(file).toLowerCase();
  const mimeType =
    extension === ".png"
      ? "image/png"
      : extension === ".jpg"
        ? "image/jpeg"
        : extension === ".webp"
          ? "image/webp"
          : null;
  if (!mimeType || !imageMatchesType(buffer, mimeType)) {
    throw new Error("Screenshot file is invalid.");
  }
  return `data:${mimeType};base64,${buffer.toString("base64")}`;
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
      removeLegacyRawgKey();
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
