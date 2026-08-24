import { GameLookupSettings } from "@/components/settings/GameLookupSettings";
import styles from "@/styles/feature-page.module.css";
import pageStyles from "./page.module.css";
import packageJson from "../../../package.json";
import { requirePageUser } from "@/lib/page-auth";
import { AccountManagement } from "@/components/settings/AccountManagement";

export default async function SettingsPage() {
  const user = await requirePageUser();
  return (
    <main className={styles.main}>
      <h1 className={styles.heading}>Settings</h1>
      <h2>Game Lookup</h2>
      <GameLookupSettings />
      <AccountManagement
        isAdmin={user.role === "admin"}
        currentAccount={{
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          role: user.role === "admin" ? "admin" : "user",
          createdAt: user.createdAt.toISOString(),
        }}
      />
      <p className={pageStyles.version}>Version {packageJson.version}</p>
    </main>
  );
}
