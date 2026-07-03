-- CreateTable
CREATE TABLE "BacklogGame" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "owned" BOOLEAN NOT NULL DEFAULT false,
    "platforms" JSONB NOT NULL,
    "estimatedHours" REAL,
    "releaseDate" DATETIME,
    "hype" INTEGER,
    "notes" TEXT,
    "coverImageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "HistoryEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "playtimeMinutes" INTEGER,
    "finishedOn" DATETIME,
    "releaseDate" DATETIME,
    "notes" TEXT,
    "platform" TEXT,
    "coverImageUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
