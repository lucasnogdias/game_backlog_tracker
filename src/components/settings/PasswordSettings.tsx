"use client";

import { FormEvent, useState } from "react";
import shared from "@/styles/shared.module.css";
import styles from "./PasswordSettings.module.css";

export function PasswordSettings({ hasPassword }: { hasPassword: boolean }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    const response = await fetch("/api/auth/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const body = (await response.json()) as { error?: string };
    setMessage(response.ok ? "Password settings updated." : body.error ?? "Unable to update password.");
  }

  return (
    <section>
      <h2>Account Password</h2>
      <form onSubmit={submit} className={`${shared.form} ${styles.form}`}>
        {hasPassword && (
          <label className={shared.fieldGroup}>
            Current password
            <input type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
          </label>
        )}
        <label className={shared.fieldGroup}>
          {hasPassword ? "New password" : "Set a password"}
          <input type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} minLength={newPassword ? 12 : undefined} />
        </label>
        <p className={shared.metaText}>
          Leave the new password empty to remove it. Passwords must have at least 12 characters.
        </p>
        {message && <p>{message}</p>}
        <button type="submit" className={`${shared.button} ${shared.buttonPrimary}`}>
          Save password settings
        </button>
      </form>
    </section>
  );
}
