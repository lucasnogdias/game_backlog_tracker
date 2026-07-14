import styles from "@/styles/feature-page.module.css";
import { DataManagementClient } from "@/components/data/DataManagementClient";

export default function DataPage() {
  return (
    <main className={styles.main}>
      <h1 className={styles.heading}>Data Management</h1>
      <DataManagementClient />
    </main>
  );
}
