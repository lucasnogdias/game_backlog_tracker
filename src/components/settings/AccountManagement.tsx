"use client";

import { useEffect, useState } from "react";
import type { AccountDTO } from "@/lib/accounts";
import shared from "@/styles/shared.module.css";
import styles from "./AccountManagement.module.css";

interface AccountManagementProps {
  currentAccount: AccountDTO;
  isAdmin: boolean;
}

export function AccountManagement({
  currentAccount,
  isAdmin,
}: AccountManagementProps) {
  const [accounts, setAccounts] = useState<AccountDTO[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<AccountDTO | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      setAccounts([currentAccount]);
      return;
    }
    void fetch("/api/users")
      .then(async (response) => {
        const body = (await response.json()) as AccountDTO[] | { error: string };
        if (!response.ok || !Array.isArray(body)) {
          throw new Error("error" in body ? body.error : "Unable to load accounts.");
        }
        setAccounts(body);
      })
      .catch((loadError) =>
        setError(loadError instanceof Error ? loadError.message : "Unable to load accounts.")
      );
  }, [currentAccount, isAdmin]);

  async function updateRole(account: AccountDTO) {
    const nextRole = account.role === "admin" ? "user" : "admin";
    setError(null);
    const response = await fetch(`/api/users/${account.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: nextRole }),
    });
    const body = (await response.json()) as AccountDTO | { error: string };
    if (!response.ok || !("role" in body)) {
      setError("error" in body ? body.error : "Unable to update account.");
      return;
    }
    setAccounts((current) =>
      current.map((entry) => (entry.id === body.id ? body : entry))
    );
  }

  async function deleteAccount(account: AccountDTO) {
    setError(null);
    const response = await fetch(`/api/users/${account.id}`, { method: "DELETE" });
    const body = (await response.json()) as
      | { deletedOwnAccount: boolean; screenshotStorageKeys: string[] }
      | { error: string };
    if (!response.ok || !("deletedOwnAccount" in body)) {
      setError("error" in body ? body.error : "Unable to delete account.");
      return;
    }
    if (body.screenshotStorageKeys.length) {
      await window.journalMedia?.removeMany?.(body.screenshotStorageKeys);
    }
    if (body.deletedOwnAccount) {
      window.location.assign("/login");
      return;
    }
    setAccounts((current) => current.filter((entry) => entry.id !== account.id));
    setDeletingAccount(null);
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>User Accounts</h2>
      <p className={styles.description}>
        Manage the local accounts that can access this app.
      </p>
      {error && <p className={styles.error}>{error}</p>}
      <ul className={styles.list}>
        {accounts.map((account) => (
          <li key={account.id} className={styles.account}>
            <div>
              <strong>{account.displayName ?? account.username}</strong>
              <span className={styles.username}>@{account.username}</span>
              <span className={styles.role}>{account.role}</span>
            </div>
            {isAdmin && (
              <button type="button" onClick={() => updateRole(account)}>
                Make {account.role === "admin" ? "standard user" : "administrator"}
              </button>
            )}
            <button type="button" className={styles.delete} onClick={() => setDeletingAccount(account)}>
              Delete account
            </button>
          </li>
        ))}
      </ul>
      {deletingAccount && (
        <div className={shared.overlay}>
          <div className={`${shared.dialog} ${styles.deleteDialog}`}>
            <h3>Delete {deletingAccount.displayName ?? deletingAccount.username}?</h3>
            <p>
              This permanently deletes the account and its game data. You can
              optionally download a backup first; it contains only game data,
              not account credentials.
            </p>
            <div className={shared.actionsRow}>
              <a
                className={shared.button}
                href={`/api/users/${deletingAccount.id}/backup`}
              >
                Download backup
              </a>
              <button
                type="button"
                className={shared.button}
                onClick={() => setDeletingAccount(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`${shared.button} ${shared.buttonDanger}`}
                onClick={() => void deleteAccount(deletingAccount)}
              >
                Delete account
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
