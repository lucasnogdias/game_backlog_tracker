import Link from "next/link";
import styles from "./TopNav.module.css";

export function TopNav() {
  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <span className={styles.brand}>Game Backlog Tracker</span>
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
      </div>
    </nav>
  );
}
