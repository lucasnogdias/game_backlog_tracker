import type { GameLookupResult } from "@/types/game-lookup";

interface RawgGame {
  id: number;
  name: string;
  released: string | null;
  playtime: number;
}

interface RawgSearchResponse {
  results: RawgGame[];
}

const RAWG_GAMES_URL = "https://api.rawg.io/api/games";

export async function searchRawgGames(
  query: string
): Promise<GameLookupResult[]> {
  const apiKey = process.env.RAWG_API_KEY;
  if (!apiKey) {
    throw new Error("RAWG API key is not configured.");
  }

  const url = new URL(RAWG_GAMES_URL);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("search", query);
  url.searchParams.set("page_size", "10");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("RAWG lookup failed.");
  }

  const data = (await response.json()) as RawgSearchResponse;
  return data.results
    .map((game) => ({
      id: game.id,
      title: game.name,
      releaseDate: game.released,
      // RAWG uses zero when no playtime estimate is available.
      estimatedHours: game.playtime > 0 ? game.playtime : null,
    }))
    .filter((game) => game.releaseDate || game.estimatedHours !== null);
}
