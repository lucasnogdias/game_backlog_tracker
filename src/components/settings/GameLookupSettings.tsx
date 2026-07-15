"use client";

import { FormEvent, useEffect, useState } from "react";
import styles from "./GameLookupSettings.module.css";

interface LookupStatus {
  canConfigure: boolean;
  configured: boolean;
}

export function GameLookupSettings() {
  const [status, setStatus] = useState<LookupStatus | null>(null);
  const [apiKey, setApiKey] = useState("");
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

  async function saveKey(event: FormEvent) {
    event.preventDefault();
    if (!window.desktopSettings) return;

    setIsSaving(true);
    setError(null);
    setMessage(null);
    try {
      await window.desktopSettings.saveRawgApiKey(apiKey);
      setApiKey("");
      setStatus(await window.desktopSettings.getGameLookupStatus());
      setMessage("Game lookup has been configured.");
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Unable to save the RAWG API key."
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function clearKey() {
    if (!window.desktopSettings) return;

    setIsSaving(true);
    setError(null);
    setMessage(null);
    try {
      await window.desktopSettings.clearRawgApiKey();
      setStatus(await window.desktopSettings.getGameLookupStatus());
      setMessage("Your saved RAWG API key has been removed.");
    } catch (clearError) {
      setError(
        clearError instanceof Error
          ? clearError.message
          : "Unable to remove the RAWG API key."
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
          development uses RAWG_API_KEY in your .env file.
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
        Your key is stored in your operating system&apos;s secure storage and is
        only used by the local app.
      </p>
      <form onSubmit={saveKey} className={styles.form}>
        <label className={styles.label}>
          RAWG API key
          <input
            type="password"
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            className={styles.input}
            autoComplete="off"
          />
        </label>
        <div className={styles.actions}>
          <button
            type="submit"
            disabled={isSaving || !apiKey.trim()}
            className={styles.button}
          >
            {isSaving ? "Saving..." : "Save key"}
          </button>
          {status.configured && (
            <button
              type="button"
              disabled={isSaving}
              onClick={clearKey}
              className={styles.secondaryButton}
            >
              Remove saved key
            </button>
          )}
        </div>
      </form>
      {message && <p className={styles.status}>{message}</p>}
      {error && <p className={styles.error}>{error}</p>}
    </section>
  );
}
