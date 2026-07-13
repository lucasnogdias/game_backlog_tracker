-- CreateTable
CREATE TABLE "JournalEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "historyEntryId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JournalEntry_historyEntryId_fkey" FOREIGN KEY ("historyEntryId") REFERENCES "HistoryEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "JournalEntry_historyEntryId_createdAt_idx" ON "JournalEntry"("historyEntryId", "createdAt");
