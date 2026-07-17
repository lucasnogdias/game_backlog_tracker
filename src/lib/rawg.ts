interface RawgGame {
  name: string;
  playtime: number;
}

interface RawgSearchResponse {
  results: RawgGame[];
}

const RAWG_GAMES_URL = "https://api.rawg.io/api/games";

function normalizeTitle(title: string): string {
  return title.trim().toLocaleLowerCase().replace(/\s+/g, " ");
}

export function isRawgConfigured(): boolean {
  return Boolean(process.env.RAWG_API_KEY);
}

export async function searchRawgEstimatedHours(
  query: string
): Promise<Map<string, number>> {
  const apiKey = process.env.RAWG_API_KEY;
  if (!apiKey) {
    return new Map();
  }

  const url = new URL(RAWG_GAMES_URL);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("search", query);
  url.searchParams.set("page_size", "10");

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("RAWG estimate lookup failed.");
  }

  const data = (await response.json()) as RawgSearchResponse;
  return new Map(
    data.results
      .filter((game) => game.playtime > 0)
      .map((game) => [normalizeTitle(game.name), game.playtime])
  );
}

export function rawgEstimatedHoursForTitle(
  estimates: Map<string, number>,
  title: string
): number | null {
  return estimates.get(normalizeTitle(title)) ?? null;
}
