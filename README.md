# Game Backlog Tracker

A local-first desktop app for tracking a game backlog, play history, and per-game journal.

## Core Features

- **Backlog** — games I want to play, with relevant tracking info.
- **Post-log / History** — games I'm currently playing, have finished, or dropped, including
  short personal reviews/impressions.
- **Journal** — timestamped notes for each History game.
- **Data Management** — ZIP/CSV backup and restore with title-based conflict resolution.
- **Game lookup** — optional RAWG lookup for release dates and estimated playtime.

(Detailed feature specs to be added as each area is planned.)

## Tech Stack

- **Frontend**: React + Next.js + CSS Modules
- **Desktop shell**: Electron (runs locally, no hosting required)
- **Backend**: Next.js API routes acting as a lightweight BFF
- **Database**: SQLite via Prisma

## Desktop builds

Electron packages the Next.js server locally and stores its SQLite database in the operating
system application-data directory. GitHub Releases provide installers for macOS, Windows, and
Linux; users do not need Node, pnpm, or the repository to run them.

```bash
pnpm electron:build
```

This produces a public, keyless macOS build for the architecture of the machine that creates it.
Tracking features work without RAWG; users can add their own key from **Settings** in the packaged
desktop app, where it is stored using OS secure storage.

Use `pnpm electron:build:win` or `pnpm electron:build:linux` to make a local Windows or Linux
installer on a matching platform. GitHub Actions builds all supported platforms for releases.

To build a private app with a default RAWG key for personal/friend use, copy
`.env.private.example` to the ignored `.env.private`, add the key, then run:

```bash
pnpm electron:build:private
```

Private builds intentionally contain the key and must not be published to GitHub Releases.

For local desktop development, run `pnpm dev` in one terminal and `pnpm electron:dev` in
another.

## Desktop updates and recovery

Packaged updates preserve the SQLite database in the operating-system application-data directory.
When an update contains a database migration, the app creates a `pre-migration-*.db` snapshot in
its `backups` directory before changing the schema. If migration fails, the app restores that
snapshot automatically and shows its location in the startup error message.

Use the **Data** page for portable ZIP/CSV backups. The migration snapshots are database recovery
files for this device, not portable imports.

## Publishing a release

Release tags use the app version from `package.json`, prefixed with `v`. For example, after
changing the package version to `0.2.0`, create and push `v0.2.0`:

```bash
git tag v0.2.0
git push origin v0.2.0
```

The release workflow validates that the tag and package version match, then builds public keyless
installers for macOS (Apple Silicon), Windows (x64), and Linux (AppImage and `.deb`). It publishes
those artifacts and generated release notes to a GitHub Release.

Before tagging, verify the packaged app on the platforms available to you:

1. Launch the installer, add a game, close it, and confirm the data remains after reopening.
2. Export and preview a Data backup.
3. Confirm a public build leaves game lookup disabled until a key is configured in Settings.
4. Check the Settings version equals the release tag without its `v` prefix.

## Status

🚧 Active development. The app is approaching its first public release.
