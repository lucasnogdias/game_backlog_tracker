const { spawnSync } = require("child_process");

const pnpm = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
const builderArgs = process.argv.slice(2);

if (builderArgs[0] === "--") {
  builderArgs.shift();
}

function run(args) {
  const result = spawnSync(pnpm, args, { stdio: "inherit" });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`pnpm ${args.join(" ")} failed with exit code ${result.status}.`);
  }
}

let packagingError;

try {
  run(["electron:rebuild"]);
  run(["electron:clean"]);
  run(["build"]);
  run(["electron:prepare"]);
  run(["exec", "electron-builder", ...builderArgs]);
} catch (error) {
  packagingError = error;
}

try {
  run(["rebuild", "better-sqlite3"]);
  run(["install", "--frozen-lockfile"]);
} catch (error) {
  if (!packagingError) {
    throw error;
  }
}

if (packagingError) {
  throw packagingError;
}
