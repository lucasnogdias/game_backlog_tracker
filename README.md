# Game Backlog Tracker

A local-first desktop app for tracking games to play, games in progress or completed, and
per-game Journal notes.

## For users

Download installers and release notes from
[GitHub Releases](https://github.com/lucasnogdias/game_backlog_tracker/releases). The
[User Guide](docs/USER_GUIDE.md) covers installation, game tracking, optional IGDB lookup,
backups, recovery, and manual updates.

Public releases are keyless: game tracking works normally, while IGDB lookup can be enabled with
your own credentials in **Settings**. A public release never contains IGDB credentials.

## Features

- **Backlog** -- track games to play, ownership, platforms, excitement, estimated completion time,
  release date, notes, and a cover-image URL.
- **History** -- track games in progress, finished, completed, recurrent, abandoned, or paused,
  including playtime and impressions.
- **Journal** -- add timestamped notes to History games.
- **Data management** -- export and restore ZIP/CSV backups with per-title conflict resolution.
- **Game lookup** -- optionally use IGDB to fill release dates and cover art, with RAWG estimates
  when its separate API key is configured.

## Development

### Requirements

- Node.js version from [`.nvmrc`](.nvmrc)
- pnpm 10.22.0

Install dependencies and generate the Prisma client:

```bash
pnpm install --frozen-lockfile
pnpm exec prisma generate
```

Run the browser development server:

```bash
pnpm dev
```

To run the desktop shell during development, start `pnpm dev` first, then in another terminal:

```bash
pnpm electron:dev
```

Development game lookup reads `IGDB_CLIENT_ID`, `IGDB_CLIENT_SECRET`, and optionally
`RAWG_API_KEY` from an untracked `.env` file. Do not expose either credential through
`NEXT_PUBLIC_` environment variables.

### Quality checks

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

### Architecture

- **Frontend and BFF:** React, Next.js App Router, and API routes.
- **Desktop shell:** Electron runs the bundled Next.js server only on `127.0.0.1`.
- **Data:** SQLite with Prisma; packaged databases live in the operating system's app-data
  directory.
- **Styles:** CSS Modules and semantic variables in `src/app/globals.css`.

## Desktop packaging

Electron packages the Next.js server, its Electron-compatible native SQLite dependency, and the
database migrations. Public builds remain keyless:

```bash
pnpm electron:build:mac
pnpm electron:build:win
pnpm electron:build:linux
```

`pnpm electron:build` is an alias for the macOS build. Build Windows and Linux installers on their
matching platforms. For a private macOS build with default IGDB credentials and optional RAWG
estimates, copy
`.env.private.example` to ignored `.env.private`, add the key, then run:

```bash
pnpm electron:build:private
```

Private builds contain those credentials and must never be published to GitHub Releases.

## Releases

Version tags trigger the cross-platform release workflow. Update `package.json`, merge the release
commit to `main`, then create and push the matching tag:

```bash
git tag vX.Y.Z
git push origin vX.Y.Z
```

The workflow verifies that the tag matches `package.json`, builds public keyless installers for
macOS Apple Silicon, Windows x64, and Linux x64 (AppImage and `.deb`), then publishes a GitHub
Release with generated notes.

Before tagging:

1. Install the packaged app and confirm a game remains after closing and reopening it.
2. Export and preview a Data backup.
3. Confirm a public build explains that lookup needs a key configured in Settings.
4. Confirm the Settings version matches the tag without its `v` prefix.

## License

This is a personal, non-commercial project. No license has been selected yet.
