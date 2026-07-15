const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

const root = path.resolve(__dirname, "..");
const standalone = path.join(root, ".next", "standalone");
const buildDirectory = path.join(root, ".electron-build");

function copyDirectory(source, destination) {
  if (fs.existsSync(source)) {
    fs.cpSync(source, destination, { recursive: true });
  }
}

function isWithin(pathname, directory) {
  const relative = path.relative(directory, pathname);
  return !relative.startsWith("..") && !path.isAbsolute(relative);
}

function repairSymlinks(root, sourceRoot, directory = root) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      repairSymlinks(root, sourceRoot, entryPath);
      continue;
    }
    if (!entry.isSymbolicLink()) continue;

    const target = fs.realpathSync(entryPath);
    if (!isWithin(target, root) && !isWithin(target, sourceRoot)) {
      fs.unlinkSync(entryPath);
      if (fs.statSync(target).isDirectory()) {
        fs.cpSync(target, entryPath, { dereference: true, recursive: true });
        repairSymlinks(root, sourceRoot, entryPath);
      } else {
        fs.copyFileSync(target, entryPath);
      }
      continue;
    }

    const packagedTarget = isWithin(target, root)
      ? target
      : path.join(root, path.relative(sourceRoot, target));
    fs.unlinkSync(entryPath);
    const isDirectory = fs.statSync(packagedTarget).isDirectory();
    const linkTarget =
      process.platform === "win32" && isDirectory
        ? packagedTarget
        : path.relative(path.dirname(entryPath), packagedTarget);
    fs.symlinkSync(
      linkTarget,
      entryPath,
      isDirectory ? (process.platform === "win32" ? "junction" : "dir") : "file"
    );
  }
}

if (!fs.existsSync(standalone)) {
  throw new Error("Run the Next.js build before preparing the Electron package.");
}

fs.mkdirSync(buildDirectory, { recursive: true });
copyDirectory(path.join(root, "public"), path.join(standalone, "public"));
copyDirectory(
  path.join(root, ".next", "static"),
  path.join(standalone, ".next", "static")
);
for (const file of fs.readdirSync(standalone)) {
  if (file.startsWith(".env")) {
    fs.rmSync(path.join(standalone, file), { force: true });
  }
}

const serverModules = path.join(buildDirectory, "server-modules");
const desktopScripts = path.join(buildDirectory, "desktop");
fs.rmSync(serverModules, { force: true, recursive: true });
fs.rmSync(desktopScripts, { force: true, recursive: true });
copyDirectory(path.join(standalone, "node_modules"), serverModules);
repairSymlinks(
  serverModules,
  path.join(standalone, "node_modules")
);
fs.mkdirSync(desktopScripts, { recursive: true });
fs.copyFileSync(
  path.join(root, "electron", "database.cjs"),
  path.join(desktopScripts, "database.cjs")
);

let rawgApiKey = "";
if (process.env.INCLUDE_RAWG_KEY === "true") {
  dotenv.config({ path: path.join(root, ".env.private") });
  rawgApiKey = process.env.RAWG_API_KEY?.trim() ?? "";
  if (!rawgApiKey) {
    throw new Error(
      "Private builds require RAWG_API_KEY in the ignored .env.private file."
    );
  }
}

fs.writeFileSync(
  path.join(buildDirectory, "default-settings.json"),
  JSON.stringify({ rawgApiKey })
);
