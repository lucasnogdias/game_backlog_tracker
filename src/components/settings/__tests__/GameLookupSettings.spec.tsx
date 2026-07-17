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
      saveIgdbCredentials: jest.fn().mockResolvedValue(undefined),
      clearIgdbCredentials: jest.fn().mockResolvedValue(undefined),
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
      await screen.findByText(/local development uses igdb_client_id/i)
    ).toBeInTheDocument();
  });

  it("saves a key through the desktop bridge without displaying it afterwards", async () => {
    const user = userEvent.setup();
    const getGameLookupStatus = jest
      .fn()
      .mockResolvedValueOnce({ canConfigure: true, configured: false })
      .mockResolvedValueOnce({ canConfigure: true, configured: true });
    const saveIgdbCredentials = jest.fn().mockResolvedValue(undefined);
    setDesktopSettings({ getGameLookupStatus, saveIgdbCredentials });

    render(<GameLookupSettings />);

    await screen.findByText("Game lookup is currently not configured.");
    const clientId = screen.getByLabelText("IGDB client ID");
    const clientSecret = screen.getByLabelText("IGDB client secret");
    await user.type(clientId, "private-client-id");
    await user.type(clientSecret, "private-client-secret");
    await user.click(screen.getByRole("button", { name: "Save credentials" }));

    await waitFor(() => {
      expect(saveIgdbCredentials).toHaveBeenCalledWith(
        "private-client-id",
        "private-client-secret"
      );
    });
    expect(clientId).toHaveValue("");
    expect(clientSecret).toHaveValue("");
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
    const clearIgdbCredentials = jest.fn().mockResolvedValue(undefined);
    setDesktopSettings({ getGameLookupStatus, clearIgdbCredentials });

    render(<GameLookupSettings />);

    await screen.findByText("Game lookup is currently configured.");
    await user.click(
      screen.getByRole("button", { name: "Remove saved credentials" })
    );

    await waitFor(() => {
      expect(clearIgdbCredentials).toHaveBeenCalledTimes(1);
    });
    expect(
      await screen.findByText("Your saved IGDB credentials have been removed.")
    ).toBeInTheDocument();
  });
});
