const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");

for (const directory of [".next", ".electron-build"]) {
  fs.rmSync(path.join(root, directory), { force: true, recursive: true });
}
