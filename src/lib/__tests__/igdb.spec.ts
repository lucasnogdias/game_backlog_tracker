import { searchIgdbGames } from "../igdb";

const originalClientId = process.env.IGDB_CLIENT_ID;
const originalClientSecret = process.env.IGDB_CLIENT_SECRET;

function jsonResponse(body: unknown, ok = true) {
  return Promise.resolve({
    ok,
    json: () => Promise.resolve(body),
  } as Response);
}

describe("searchIgdbGames", () => {
  beforeEach(() => {
    process.env.IGDB_CLIENT_ID = "client-id";
    process.env.IGDB_CLIENT_SECRET = "client-secret";
    global.fetch = jest.fn();
  });

  afterAll(() => {
    process.env.IGDB_CLIENT_ID = originalClientId;
    process.env.IGDB_CLIENT_SECRET = originalClientSecret;
  });

  it("returns portrait covers, release dates, and normal completion time", async () => {
    (global.fetch as jest.Mock)
      .mockReturnValueOnce(
        jsonResponse({ access_token: "access-token", expires_in: 3600 })
      )
      .mockReturnValueOnce(
        jsonResponse([
          {
            id: 9767,
            name: "Hollow Knight",
            first_release_date: 1487808000,
            cover: {
              url: "//images.igdb.com/igdb/image/upload/t_thumb/co1rgi.jpg",
            },
            game_time_to_beat: { normally: 25_200 },
          },
        ])
      );

    await expect(searchIgdbGames("Hollow Knight")).resolves.toEqual([
      {
        id: 9767,
        title: "Hollow Knight",
        releaseDate: "2017-02-23",
        estimatedHours: 7,
        coverImageUrl:
          "https://images.igdb.com/igdb/image/upload/t_cover_big/co1rgi.jpg",
      },
    ]);
  });

  it("reports missing credentials before making a request", async () => {
    delete process.env.IGDB_CLIENT_ID;

    await expect(searchIgdbGames("Hollow Knight")).rejects.toThrow(
      "IGDB credentials are not configured."
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
