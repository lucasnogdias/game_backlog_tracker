import { listHistoryEntries } from "@/lib/history";
import { HistoryClient } from "@/components/history/HistoryClient";

// Always fetch fresh from the DB — this page must never be statically
// pre-rendered at build time (there's no DB available during CI/build,
// and as a local app we always want live data anyway).
export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const entries = await listHistoryEntries();

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-6 text-2xl font-bold">History</h1>
      <HistoryClient initialEntries={entries} />
    </main>
  );
}
