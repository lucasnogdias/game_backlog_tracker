import styles from "@/styles/feature-page.module.css";
import { DataManagementClient } from "@/components/data/DataManagementClient";
import { requirePageUser } from "@/lib/page-auth";

export default async function DataPage() {
  await requirePageUser();
  return (
    <main className={styles.main}>
      <h1 className={styles.heading}>Data Management</h1>
      <DataManagementClient />
    </main>
  );
}
