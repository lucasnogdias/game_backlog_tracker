/*
  Warnings:

  - Added the required column `userId` to the `BacklogGame` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `HistoryEntry` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "username" TEXT NOT NULL,
    "displayName" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'user',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_BacklogGame" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "owned" BOOLEAN NOT NULL DEFAULT false,
    "platforms" JSONB NOT NULL,
    "estimatedHours" REAL,
    "releaseDate" DATETIME,
    "hype" INTEGER,
    "notes" TEXT,
    "coverImageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BacklogGame_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_BacklogGame" ("coverImageUrl", "createdAt", "estimatedHours", "hype", "id", "notes", "owned", "platforms", "releaseDate", "title", "updatedAt") SELECT "coverImageUrl", "createdAt", "estimatedHours", "hype", "id", "notes", "owned", "platforms", "releaseDate", "title", "updatedAt" FROM "BacklogGame";
DROP TABLE "BacklogGame";
ALTER TABLE "new_BacklogGame" RENAME TO "BacklogGame";
CREATE INDEX "BacklogGame_userId_idx" ON "BacklogGame"("userId");
CREATE TABLE "new_HistoryEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "playtimeMinutes" INTEGER,
    "finishedOn" DATETIME,
    "releaseDate" DATETIME,
    "notes" TEXT,
    "platform" TEXT,
    "coverImageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "HistoryEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_HistoryEntry" ("coverImageUrl", "createdAt", "finishedOn", "id", "notes", "platform", "playtimeMinutes", "releaseDate", "status", "title", "updatedAt") SELECT "coverImageUrl", "createdAt", "finishedOn", "id", "notes", "platform", "playtimeMinutes", "releaseDate", "status", "title", "updatedAt" FROM "HistoryEntry";
DROP TABLE "HistoryEntry";
ALTER TABLE "new_HistoryEntry" RENAME TO "HistoryEntry";
CREATE INDEX "HistoryEntry_userId_idx" ON "HistoryEntry"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
