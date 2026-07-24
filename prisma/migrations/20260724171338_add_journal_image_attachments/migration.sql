-- CreateTable
CREATE TABLE "JournalImageAttachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "journalEntryId" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JournalImageAttachment_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "JournalEntry" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "JournalImageAttachment_storageKey_key" ON "JournalImageAttachment"("storageKey");

-- CreateIndex
CREATE INDEX "JournalImageAttachment_journalEntryId_idx" ON "JournalImageAttachment"("journalEntryId");
