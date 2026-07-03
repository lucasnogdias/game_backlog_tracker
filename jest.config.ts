import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  // Path to Next.js app to load next.config.js and .env files
  dir: "./",
});

const config: Config = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  coverageProvider: "v8",
  collectCoverageFrom: [
    "src/components/**/*.{ts,tsx}",
    "!src/components/**/*.d.ts",
  ],
  coverageDirectory: "coverage",
  coverageThreshold: {
    // "global" applies across all files matched by collectCoverageFrom. Kept
    // low for now since shared components (ConfirmDialog/TopNav) aren't
    // tested yet; the backlog-specific threshold below is the real gate.
    global: {
      statements: 60,
      branches: 45,
      functions: 45,
      lines: 60,
    },
    // Only the Backlog components are covered by tests so far. Enforce a
    // floor here so coverage can't silently regress; raise this, and
    // eventually the "global" threshold too, as more components gain tests.
    "./src/components/backlog/**/*.tsx": {
      statements: 90,
      branches: 80,
      functions: 70,
      lines: 90,
    },
  },
};

export default createJestConfig(config);
