"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import type { GameLookupResult } from "@/types/game-lookup";
import { formatDate } from "@/lib/format-date";
import styles from "./GameLookupModal.module.css";
import shared from "@/styles/shared.module.css";

interface GameLookupModalProps {
  initialQuery: string;
  onSelect: (result: GameLookupResult) => void;
  onClose: () => void;
  showEstimatedHours?: boolean;
}

function formatReleaseDate(releaseDate: string | null): string {
  if (!releaseDate) return "Release date unavailable";
  return formatDate(`${releaseDate}T00:00:00Z`);
}

export function GameLookupModal({
  initialQuery,
  onSelect,
  onClose,
  showEstimatedHours = true,
}: GameLookupModalProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<GameLookupResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchGames = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setError("Enter a game title to search.");
      return;
    }

    setIsSearching(true);
    setError(null);
    setHasSearched(true);
    try {
      const response = await fetch(
        `/api/game-lookup?query=${encodeURIComponent(searchQuery.trim())}`
      );
      const body = (await response.json()) as
        | GameLookupResult[]
        | { error: string };
      if (!response.ok || !Array.isArray(body)) {
        throw new Error(
          Array.isArray(body)
            ? "Unable to search for game details."
            : body.error === "RAWG API key is not configured."
              ? "Game lookup is not configured. Add a RAWG API key in Settings."
              : body.error
        );
      }
      setResults(body);
    } catch (searchError) {
      setResults([]);
      setError(
        searchError instanceof Error
          ? searchError.message
          : "Unable to search for game details."
      );
    } finally {
      setIsSearching(false);
    }
  }, []);

  useEffect(() => {
    if (initialQuery.trim()) {
      void searchGames(initialQuery);
    }
  }, [initialQuery, searchGames]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    void searchGames(query);
  }

  return (
    <div className={shared.overlay}>
      <div className={`${shared.dialog} ${styles.dialog}`}>
        <h2 className={shared.dialogTitle}>Find Game Details</h2>
        <form onSubmit={handleSubmit} className={shared.inlineInputRow}>
          <input
            aria-label="Search game title"
            className={`${shared.textInput} ${shared.flexibleInput}`}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            autoFocus
          />
          <button type="submit" className={styles.searchButton} disabled={isSearching}>
            {isSearching ? "Searching..." : "Search"}
          </button>
        </form>

        {error && <p className={shared.errorText}>{error}</p>}

        {hasSearched && !isSearching && !error && results.length === 0 && (
          <p className={styles.emptyMessage}>No matching games found.</p>
        )}

        <div className={styles.results}>
          {results.map((result) => (
            <button
              key={result.id}
              type="button"
              className={styles.result}
              onClick={() => onSelect(result)}
            >
              <p className={styles.resultTitle}>{result.title}</p>
              <p className={styles.resultDetails}>
                {formatReleaseDate(result.releaseDate)}
                {showEstimatedHours &&
                  result.estimatedHours !== null &&
                  ` · Average playtime: ${result.estimatedHours}h`}
              </p>
            </button>
          ))}
        </div>

        <div className={shared.actionsRow}>
          <button type="button" onClick={onClose} className={shared.button}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
