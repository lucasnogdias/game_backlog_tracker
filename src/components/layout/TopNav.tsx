import Link from "next/link";
import styles from "./TopNav.module.css";

export function TopNav() {
  return (
    <nav className={styles.nav}>
      <div className={styles.inner}>
        <span className={styles.brand}>Game Backlog Tracker</span>
        <Link href="/backlog" className={styles.link}>
          Backlog
        </Link>
        <Link href="/history" className={styles.link}>
          History
        </Link>
        <Link href="/data" className={styles.link}>
          Data
        </Link>
      </div>
    </nav>
  );
}
