import Link from "next/link";

export function TopNav() {
  return (
    <nav className="border-b border-neutral-200 px-6 py-3 dark:border-neutral-800">
      <div className="mx-auto flex max-w-6xl items-center gap-6">
        <span className="font-bold">Game Backlog Tracker</span>
        <Link href="/backlog" className="text-sm hover:underline">
          Backlog
        </Link>
        <Link href="/history" className="text-sm hover:underline">
          History
        </Link>
      </div>
    </nav>
  );
}
