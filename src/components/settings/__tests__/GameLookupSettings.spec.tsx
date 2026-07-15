import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GameLookupSettings } from "../GameLookupSettings";

function setDesktopSettings(
  overrides: Partial<NonNullable<Window["desktopSettings"]>> = {}
) {
  Object.defineProperty(window, "desktopSettings", {
    configurable: true,
    value: {
      getGameLookupStatus: jest.fn().mockResolvedValue({
        canConfigure: true,
        configured: false,
      }),
      saveRawgApiKey: jest.fn().mockResolvedValue(undefined),
      clearRawgApiKey: jest.fn().mockResolvedValue(undefined),
      ...overrides,
    },
  });
}

describe("GameLookupSettings", () => {
  afterEach(() => {
    delete window.desktopSettings;
    jest.restoreAllMocks();
  });

  it("explains that browser development uses the environment variable", async () => {
    render(<GameLookupSettings />);

    expect(
      await screen.findByText(/local development uses rawg_api_key/i)
    ).toBeInTheDocument();
  });

  it("saves a key through the desktop bridge without displaying it afterwards", async () => {
    const user = userEvent.setup();
    const getGameLookupStatus = jest
      .fn()
      .mockResolvedValueOnce({ canConfigure: true, configured: false })
      .mockResolvedValueOnce({ canConfigure: true, configured: true });
    const saveRawgApiKey = jest.fn().mockResolvedValue(undefined);
    setDesktopSettings({ getGameLookupStatus, saveRawgApiKey });

    render(<GameLookupSettings />);

    await screen.findByText("Game lookup is currently not configured.");
    const input = screen.getByLabelText("RAWG API key");
    await user.type(input, "private-key");
    await user.click(screen.getByRole("button", { name: "Save key" }));

    await waitFor(() => {
      expect(saveRawgApiKey).toHaveBeenCalledWith("private-key");
    });
    expect(input).toHaveValue("");
    expect(
      await screen.findByText("Game lookup has been configured.")
    ).toBeInTheDocument();
  });

  it("removes a saved key through the desktop bridge", async () => {
    const user = userEvent.setup();
    const getGameLookupStatus = jest
      .fn()
      .mockResolvedValueOnce({ canConfigure: true, configured: true })
      .mockResolvedValueOnce({ canConfigure: true, configured: false });
    const clearRawgApiKey = jest.fn().mockResolvedValue(undefined);
    setDesktopSettings({ getGameLookupStatus, clearRawgApiKey });

    render(<GameLookupSettings />);

    await screen.findByText("Game lookup is currently configured.");
    await user.click(screen.getByRole("button", { name: "Remove saved key" }));

    await waitFor(() => {
      expect(clearRawgApiKey).toHaveBeenCalledTimes(1);
    });
    expect(
      await screen.findByText("Your saved RAWG API key has been removed.")
    ).toBeInTheDocument();
  });
});
