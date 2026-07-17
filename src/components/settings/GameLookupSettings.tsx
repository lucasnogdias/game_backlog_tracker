"use client";

import { FormEvent, useEffect, useState } from "react";
import styles from "./GameLookupSettings.module.css";

interface LookupStatus {
  canConfigure: boolean;
  configured: boolean;
  rawgConfigured: boolean;
}

export function GameLookupSettings() {
  const [status, setStatus] = useState<LookupStatus | null>(null);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [rawgApiKey, setRawgApiKey] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!window.desktopSettings) {
      setStatus({ canConfigure: false, configured: false, rawgConfigured: false });
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

  async function saveRawgKey(event: FormEvent) {
    event.preventDefault();
    if (!window.desktopSettings) return;

    setIsSaving(true);
    setError(null);
    setMessage(null);
    try {
      await window.desktopSettings.saveRawgApiKey(rawgApiKey);
      setRawgApiKey("");
      setStatus(await window.desktopSettings.getGameLookupStatus());
      setMessage("RAWG estimated playtime has been configured.");
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

  async function clearRawgKey() {
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
          development uses IGDB_CLIENT_ID, IGDB_CLIENT_SECRET, and optionally RAWG_API_KEY
          in your .env file.
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
      <section className={styles.optionalProvider}>
        <h2 className={styles.providerTitle}>Optional RAWG playtime estimates</h2>
        <p className={styles.description}>
          RAWG can add estimated hours when it has a title matching the selected IGDB game.
        </p>
        <p className={styles.status}>
          RAWG estimates are currently{" "}
          {status.rawgConfigured ? "configured." : "not configured."}
        </p>
        <form onSubmit={saveRawgKey} className={styles.form}>
          <label className={styles.label}>
            RAWG API key
            <input
              type="password"
              value={rawgApiKey}
              onChange={(event) => setRawgApiKey(event.target.value)}
              className={styles.input}
              autoComplete="off"
            />
          </label>
          <div className={styles.actions}>
            <button
              type="submit"
              disabled={isSaving || !rawgApiKey.trim()}
              className={styles.button}
            >
              {isSaving ? "Saving..." : "Save RAWG key"}
            </button>
            {status.rawgConfigured && (
              <button
                type="button"
                disabled={isSaving}
                onClick={clearRawgKey}
                className={styles.secondaryButton}
              >
                Remove RAWG key
              </button>
            )}
          </div>
        </form>
      </section>
      {message && <p className={styles.status}>{message}</p>}
      {error && <p className={styles.error}>{error}</p>}
    </section>
  );
}
