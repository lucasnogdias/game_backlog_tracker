import { GameLookupSettings } from "@/components/settings/GameLookupSettings";
import styles from "@/styles/feature-page.module.css";

export default function SettingsPage() {
  return (
    <main className={styles.main}>
      <h1 className={styles.heading}>Settings</h1>
      <h2>Game Lookup</h2>
      <GameLookupSettings />
    </main>
  );
}
