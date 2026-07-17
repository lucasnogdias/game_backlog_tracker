# Game Backlog Tracker User Guide

Game Backlog Tracker keeps your game data locally on your computer. It does not need an account,
hosting, or an internet connection for normal tracking.

## Install

Download the file for your operating system from
[GitHub Releases](https://github.com/lucasnogdias/game_backlog_tracker/releases):

| Operating system | Download | Install |
| --- | --- | --- |
| macOS Apple Silicon | `.dmg` | Open it and drag **Game Backlog Tracker** to Applications. |
| Windows x64 | `.exe` | Run the installer and follow its prompts. |
| Linux x64 | `.AppImage` or `.deb` | Run the AppImage after making it executable, or install the Debian package with your package manager. |

### macOS unsigned-app warning

Public macOS releases are not signed or notarized. After moving the app to Applications, macOS may
say it is damaged. If you downloaded it from this repository's GitHub Release, open Terminal and
run:

```bash
sudo xattr -dr com.apple.quarantine "/Applications/Game Backlog Tracker.app"
```

Enter your Mac password when prompted, then open the app again. Run this once for each newly
installed version.

## Track games

### Backlog

Use **Backlog** for games you want to play. Select **Add game** to record a title, whether you own
it, platforms, hype, estimated time, release date, notes, and an optional cover-image URL.

Switch between table and card views, and sort by game, ownership, platform, hype, estimated time,
or release date. Use a game's actions menu to edit it, delete it, or move it to History.

### History

Use **History** for games you are playing or have played. Select **Add game** to record its status,
playtime, completion date, platform, release date, notes, and optional cover image.

History supports **In Progress**, **Finished**, **Completed**, **Recurrent**, **Abandoned**, and
**Paused** statuses. Playtime is entered as `HH:mm`; hours may exceed 24. Use a game's actions menu
to edit it, delete it, move it back to Backlog, or open its Journal.

The History page also shows playtime summaries. Change the date filter to focus the summary on a
specific period.

### Journal

Open **Journal** from a History game's actions menu to record timestamped notes while playing. New
notes are retained with that game in backups. Existing Journal text cannot yet be edited; this is
planned for a future update.

## Optional IGDB game lookup

Game lookup can fill release dates and portrait cover art from IGDB. It is optional: you can always
enter or replace those details manually.

1. Create a free Twitch developer application with a **Confidential** client type, then note its
   client ID and client secret. IGDB requires Twitch two-factor authentication.
2. Open **Settings** in the installed desktop app.
3. Enter both values and select **Save credentials**.

The app stores the credentials in your operating system's secure storage and uses them only
locally. Public releases do not include credentials. You can remove saved credentials from the
same Settings page at any time.

### Optional RAWG estimated hours

RAWG can add estimated hours when it has a title matching the IGDB game you select. In
**Settings**, enter a [RAWG API key](https://rawg.io/apidocs) under **Optional RAWG playtime
estimates**. This is independent of IGDB, and game lookup remains available without it.

## Back up and restore data

Open **Data** regularly and select **Download Backup**. The downloaded ZIP includes CSV files for
your Backlog, History, and Journal data. It never includes your IGDB credentials or Settings.

To restore:

1. Select a backup ZIP in **Import Backup**.
2. Choose **Preview Import**. Nothing changes until you apply the preview.
3. Review title conflicts. For each conflicting Backlog or History game, choose to keep local data,
   replace it with the backup, or keep both.
4. Select **Apply Import**.

Importing does not replace unrelated current data. Keep backup ZIPs somewhere outside the app, such
as cloud storage or an external drive.

## Update the app

Updates are manual. Download and install the latest matching release from
[GitHub Releases](https://github.com/lucasnogdias/game_backlog_tracker/releases).

Your local database remains in the operating system's app-data directory, outside the installed app,
so an update preserves your data. Before a database update, the app creates a
`pre-migration-<timestamp>.db` snapshot. If a migration fails, it automatically restores the
previous database and reports the snapshot location.

Migration snapshots are recovery files for the same device. Use the Data page's ZIP export to move
your data between computers or keep portable backups.

## Current limitations

- There is currently one local profile per app installation; multi-user accounts are planned.
- Journal screenshots and other media attachments are not supported yet.
- Public macOS releases are unsigned and require the quarantine command above.
- The app does not update itself automatically.
