import { listBacklogGames } from "@/lib/backlog";
import { BacklogClient } from "@/components/backlog/BacklogClient";

// Always fetch fresh from the DB — this page must never be statically
// pre-rendered at build time (there's no DB available during CI/build,
// and as a local app we always want live data anyway).
export const dynamic = "force-dynamic";

export default async function BacklogPage() {
  const games = await listBacklogGames();

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Backlog</h1>
      <BacklogClient initialGames={games} />
    </main>
  );
}
