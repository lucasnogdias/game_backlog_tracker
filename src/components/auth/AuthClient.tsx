"use client";

import { FormEvent, useEffect, useState } from "react";
import shared from "@/styles/shared.module.css";
import styles from "./AuthClient.module.css";

export function AuthClient() {
  const [isSetup, setIsSetup] = useState<boolean | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    void fetch("/api/auth/setup")
      .then(async (response) => {
        if (!response.ok) throw new Error();
        return response.json() as Promise<{ needsAccountSetup: boolean }>;
      })
      .then(({ needsAccountSetup }) => setIsSetup(needsAccountSetup))
      .catch(() => setError("Unable to prepare account sign-in."));
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (isSetup === null) return;
    const shouldRegister = isSetup || isRegistering;
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await fetch(shouldRegister ? "/api/auth/register" : "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          shouldRegister ? { username, displayName, password } : { username, password }
        ),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Unable to sign in.");
      window.location.assign("/backlog");
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "Unable to sign in.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={styles.main}>
      <section className={styles.card}>
        <h1 className={styles.heading}>
          {isSetup || isRegistering ? "Create account" : "Sign in"}
        </h1>
        <p className={styles.description}>
          {isSetup
            ? "Create the first local account to keep ownership of your existing game data."
            : isRegistering
              ? "Create a separate local account with its own Backlog and History."
              : "Sign in to access your personal Backlog and History."}
        </p>
        <form onSubmit={submit} className={shared.form}>
          <label className={shared.fieldGroup}>
            Username
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              required
            />
          </label>
          {(isSetup || isRegistering) && (
            <label className={shared.fieldGroup}>
              Display name <span className={styles.optional}>(optional)</span>
              <input
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                autoComplete="name"
              />
            </label>
          )}
          <label className={shared.fieldGroup}>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={isSetup || isRegistering ? "new-password" : "current-password"}
              minLength={12}
              required
            />
          </label>
          {(isSetup || isRegistering) && (
            <p className={styles.hint}>Use at least 12 characters.</p>
          )}
          {error && <p className={shared.errorText}>{error}</p>}
          <button
            type="submit"
            disabled={isSetup === null || isSubmitting}
            className={`${shared.button} ${shared.buttonPrimary}`}
          >
            {isSubmitting
              ? "Please wait..."
              : isSetup || isRegistering
                ? "Create account"
                : "Sign in"}
          </button>
          {!isSetup && (
            <button
              type="button"
              className={styles.toggle}
              onClick={() => {
                setError(null);
                setIsRegistering((current) => !current);
              }}
            >
              {isRegistering ? "Already have an account? Sign in" : "Create a local account"}
            </button>
          )}
        </form>
      </section>
    </main>
  );
}
