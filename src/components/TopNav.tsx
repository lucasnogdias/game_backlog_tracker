import Link from "next/link";

export function TopNav() {
  return (
    <nav className="border-b border-neutral-200 px-6 py-3 dark:border-neutral-800">
      <div className="mx-auto flex max-w-6xl items-center gap-6">
        <span className="font-bold">Game Backlog Tracker</span>
        <Link href="/backlog" className="text-sm hover:underline">
          Backlog
        </Link>
        {/* History page lands in a future task */}
        <span className="text-sm text-neutral-400" title="Coming soon">
          History
        </span>
      </div>
    </nav>
  );
}
