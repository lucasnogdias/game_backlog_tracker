import type { GameLookupResult } from "@/types/game-lookup";

interface IgdbGame {
  id: number;
  name: string;
  first_release_date?: number;
  cover?: {
    url?: string;
  };
  game_time_to_beat?: {
    normally?: number;
  };
}

interface TwitchTokenResponse {
  access_token: string;
  expires_in: number;
}

interface AccessToken {
  value: string;
  expiresAt: number;
}

const IGDB_GAMES_URL = "https://api.igdb.com/v4/games";
const TWITCH_TOKEN_URL = "https://id.twitch.tv/oauth2/token";
const TOKEN_REFRESH_BUFFER_MS = 60_000;

let accessToken: AccessToken | null = null;

function credentials() {
  const clientId = process.env.IGDB_CLIENT_ID;
  const clientSecret = process.env.IGDB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error("IGDB credentials are not configured.");
  }

  return { clientId, clientSecret };
}

function escapeSearchQuery(query: string): string {
  return query.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function toIsoDate(timestamp: number | undefined): string | null {
  if (!timestamp) return null;
  return new Date(timestamp * 1000).toISOString().slice(0, 10);
}

function toEstimatedHours(seconds: number | undefined): number | null {
  if (!seconds || seconds <= 0) return null;
  return Math.round((seconds / 3600) * 2) / 2;
}

function coverImageUrl(url: string | undefined): string | null {
  if (!url) return null;
  const normalizedUrl = url.startsWith("//") ? `https:${url}` : url;
  return normalizedUrl.replace("/t_thumb/", "/t_cover_big/");
}

async function getAccessToken(): Promise<{ token: string; clientId: string }> {
  const { clientId, clientSecret } = credentials();
  if (accessToken && accessToken.expiresAt > Date.now() + TOKEN_REFRESH_BUFFER_MS) {
    return { token: accessToken.value, clientId };
  }

  const response = await fetch(TWITCH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
  });
  if (!response.ok) {
    throw new Error("IGDB authentication failed.");
  }

  const data = (await response.json()) as TwitchTokenResponse;
  accessToken = {
    value: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return { token: accessToken.value, clientId };
}

export async function searchIgdbGames(
  query: string
): Promise<GameLookupResult[]> {
  const { token, clientId } = await getAccessToken();
  const response = await fetch(IGDB_GAMES_URL, {
    method: "POST",
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
      "Client-ID": clientId,
    },
    body: [
      `search "${escapeSearchQuery(query)}";`,
      "fields id,name,first_release_date,cover.url,game_time_to_beat.normally;",
      "where version_parent = null;",
      "limit 10;",
    ].join(" "),
  });
  if (!response.ok) {
    throw new Error("IGDB lookup failed.");
  }

  const games = (await response.json()) as IgdbGame[];
  return games.map((game) => ({
    id: game.id,
    title: game.name,
    releaseDate: toIsoDate(game.first_release_date),
    estimatedHours: toEstimatedHours(game.game_time_to_beat?.normally),
    coverImageUrl: coverImageUrl(game.cover?.url),
  }));
}
