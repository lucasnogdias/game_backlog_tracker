"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import styles from "./TopNav.module.css";

interface TopNavProps {
  user: { username: string; displayName: string | null } | null;
}

export function TopNav({ user }: TopNavProps) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <span className={styles.brand}>Game Backlog Tracker</span>
        {user && (
          <>
            <Link href="/backlog" prefetch={false} className={styles.link}>
              Backlog
            </Link>
            <Link href="/history" prefetch={false} className={styles.link}>
              History
            </Link>
            <Link href="/data" className={styles.link}>
              Data
            </Link>
            <Link href="/settings" className={styles.link}>
              Settings
            </Link>
            <span className={styles.userName}>{user.displayName ?? user.username}</span>
            <button type="button" className={styles.logout} onClick={logout}>
              Log out
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
