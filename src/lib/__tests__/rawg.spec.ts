import {
  rawgEstimatedHoursForTitle,
  searchRawgEstimatedHours,
} from "../rawg";

const originalApiKey = process.env.RAWG_API_KEY;

function jsonResponse(body: unknown, ok = true) {
  return Promise.resolve({
    ok,
    json: () => Promise.resolve(body),
  } as Response);
}

describe("searchRawgEstimatedHours", () => {
  beforeEach(() => {
    process.env.RAWG_API_KEY = "rawg-key";
    global.fetch = jest.fn();
  });

  afterAll(() => {
    process.env.RAWG_API_KEY = originalApiKey;
  });

  it("maps available estimates by normalized game title", async () => {
    (global.fetch as jest.Mock).mockReturnValueOnce(
      jsonResponse({
        results: [
          { name: "The Legend of Zelda: Ocarina of Time", playtime: 27 },
          { name: "Untimed Game", playtime: 0 },
        ],
      })
    );

    const estimates = await searchRawgEstimatedHours("Zelda");

    expect(
      rawgEstimatedHoursForTitle(
        estimates,
        "  THE LEGEND OF ZELDA: OCARINA OF TIME  "
      )
    ).toBe(27);
    expect(rawgEstimatedHoursForTitle(estimates, "Untimed Game")).toBeNull();
  });
});
