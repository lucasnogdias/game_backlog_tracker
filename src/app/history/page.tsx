import { listHistoryEntries } from "@/lib/history";
import { HistoryClient } from "@/components/history/HistoryClient";
import styles from "@/styles/feature-page.module.css";

// Always fetch fresh from the DB — this page must never be statically
// pre-rendered at build time (there's no DB available during CI/build,
// and as a local app we always want live data anyway).
export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const entries = await listHistoryEntries();

  return (
    <main className={styles.main}>
      <h1 className={styles.heading}>History</h1>
      <HistoryClient initialEntries={entries} />
    </main>
  );
}
