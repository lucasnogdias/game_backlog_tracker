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
    // "global" is a safety net for the aggregate total. All files under
    // src/components currently live in one of the thresholded subfolders
    // below, which are the real gate.
    global: {
      statements: 90,
      branches: 80,
      functions: 70,
      lines: 90,
    },
    // Backlog and History components are covered by tests so far. Enforce a
    // floor here so coverage can't silently regress; raise this, and
    // eventually the "global" threshold too, as more components gain tests.
    "./src/components/backlog/**/*.tsx": {
      statements: 90,
      branches: 80,
      functions: 70,
      lines: 90,
    },
    "./src/components/history/**/*.tsx": {
      statements: 90,
      branches: 80,
      functions: 70,
      lines: 90,
    },
    // Shared, composable primitives used by both Backlog and History views.
    "./src/components/shared/**/*.tsx": {
      statements: 90,
      branches: 80,
      functions: 70,
      lines: 90,
    },
    // App-level chrome (e.g. TopNav), rendered once at the root layout.
    "./src/components/layout/**/*.tsx": {
      statements: 90,
      branches: 80,
      functions: 70,
      lines: 90,
    },
  },
};

export default createJestConfig(config);
