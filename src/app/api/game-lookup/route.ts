import { NextRequest, NextResponse } from "next/server";
import { searchIgdbGames } from "@/lib/igdb";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query")?.trim();
  if (!query) {
    return NextResponse.json(
      { error: "A game title is required." },
      { status: 400 }
    );
  }

  try {
    const results = await searchIgdbGames(query);
    return NextResponse.json(results);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to search for game details.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
