import { GameLookupSettings } from "@/components/settings/GameLookupSettings";
import styles from "@/styles/feature-page.module.css";
import pageStyles from "./page.module.css";
import packageJson from "../../../package.json";
import { requirePageUser } from "@/lib/page-auth";

export default async function SettingsPage() {
  await requirePageUser();
  return (
    <main className={styles.main}>
      <h1 className={styles.heading}>Settings</h1>
      <h2>Game Lookup</h2>
      <GameLookupSettings />
      <p className={pageStyles.version}>Version {packageJson.version}</p>
    </main>
  );
}
