import { listBacklogGames } from "@/lib/backlog";
import { BacklogClient } from "@/components/backlog/BacklogClient";

export default async function BacklogPage() {
  const games = await listBacklogGames();

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-2xl font-bold">Backlog</h1>
      <BacklogClient initialGames={games} />
    </main>
  );
}
