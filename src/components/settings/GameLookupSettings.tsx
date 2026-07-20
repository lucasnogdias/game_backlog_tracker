"use client";

import { FormEvent, useEffect, useState } from "react";
import styles from "./GameLookupSettings.module.css";

interface LookupStatus {
  canConfigure: boolean;
  configured: boolean;
}

export function GameLookupSettings() {
  const [status, setStatus] = useState<LookupStatus | null>(null);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!window.desktopSettings) {
      setStatus({ canConfigure: false, configured: false });
      return;
    }

    void window.desktopSettings
      .getGameLookupStatus()
      .then(setStatus)
      .catch((statusError) => {
        setError(
          statusError instanceof Error
            ? statusError.message
            : "Unable to read game lookup settings."
        );
      });
  }, []);

  async function saveCredentials(event: FormEvent) {
    event.preventDefault();
    if (!window.desktopSettings) return;

    setIsSaving(true);
    setError(null);
    setMessage(null);
    try {
      await window.desktopSettings.saveIgdbCredentials(clientId, clientSecret);
      setClientId("");
      setClientSecret("");
      setStatus(await window.desktopSettings.getGameLookupStatus());
      setMessage("Game lookup has been configured.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save IGDB credentials."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function clearCredentials() {
    if (!window.desktopSettings) return;

    setIsSaving(true);
    setError(null);
    setMessage(null);
    try {
      await window.desktopSettings.clearIgdbCredentials();
      setStatus(await window.desktopSettings.getGameLookupStatus());
      setMessage("Your saved IGDB credentials have been removed.");
    } catch (clearError) {
      setError(
        clearError instanceof Error
          ? clearError.message
          : "Unable to remove IGDB credentials."
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (!status) {
    return <p>Loading game lookup settings...</p>;
  }

  if (!status.canConfigure) {
    return (
      <section className={styles.section}>
        <p className={styles.description}>
          Game lookup keys can be configured from the packaged desktop app. Local
          development uses IGDB_CLIENT_ID and IGDB_CLIENT_SECRET in your .env file.
        </p>
        {error && <p className={styles.error}>{error}</p>}
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <p className={styles.status}>
        Game lookup is currently {status.configured ? "configured." : "not configured."}
      </p>
      <p className={styles.description}>
        Your credentials are stored in your operating system&apos;s secure storage and
        are only used by the local app.
      </p>
      <form onSubmit={saveCredentials} className={styles.form}>
        <label className={styles.label}>
          IGDB client ID
          <input
            value={clientId}
            onChange={(event) => setClientId(event.target.value)}
            className={styles.input}
            autoComplete="off"
          />
        </label>
        <label className={styles.label}>
          IGDB client secret
          <input
            type="password"
            value={clientSecret}
            onChange={(event) => setClientSecret(event.target.value)}
            className={styles.input}
            autoComplete="off"
          />
        </label>
        <div className={styles.actions}>
          <button
            type="submit"
            disabled={isSaving || !clientId.trim() || !clientSecret.trim()}
            className={styles.button}
          >
            {isSaving ? "Saving..." : "Save credentials"}
          </button>
          {status.configured && (
            <button
              type="button"
              disabled={isSaving}
              onClick={clearCredentials}
              className={styles.secondaryButton}
            >
              Remove saved credentials
            </button>
          )}
        </div>
      </form>
      {message && <p className={styles.status}>{message}</p>}
      {error && <p className={styles.error}>{error}</p>}
    </section>
  );
}
