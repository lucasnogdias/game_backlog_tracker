import { notFound } from "next/navigation";
import { JournalPageClient } from "@/components/history/JournalPageClient";
import { getHistoryEntryById } from "@/lib/history";
import { listJournalEntries } from "@/lib/journal";
import styles from "@/styles/feature-page.module.css";

export const dynamic = "force-dynamic";

export default async function JournalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const historyEntry = await getHistoryEntryById(id);

  if (!historyEntry) notFound();

  const entries = await listJournalEntries(id);

  return (
    <main className={styles.main}>
      <JournalPageClient historyEntry={historyEntry} initialEntries={entries} />
    </main>
  );
}
