import { listBacklogGames } from "@/lib/backlog";
import { BacklogClient } from "@/components/backlog/BacklogClient";
import styles from "@/styles/feature-page.module.css";

// Always fetch fresh from the DB — this page must never be statically
// pre-rendered at build time (there's no DB available during CI/build,
// and as a local app we always want live data anyway).
export const dynamic = "force-dynamic";

export default async function BacklogPage() {
  const games = await listBacklogGames();

  return (
    <main className={styles.main}>
      <h1 className={styles.heading}>Backlog</h1>
      <BacklogClient initialGames={games} />
    </main>
  );
}
