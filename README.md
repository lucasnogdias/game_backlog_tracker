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
system application-data directory. The macOS build produces a `.dmg` for the architecture of the
machine that creates it; users do not need Node, pnpm, or the repository to run it.

```bash
pnpm electron:build
```

This produces a public, keyless build. Tracking features work without RAWG; users can add their
own key from **Settings** in the packaged desktop app, where it is stored using OS secure storage.

To build a private app with a default RAWG key for personal/friend use, copy
`.env.private.example` to the ignored `.env.private`, add the key, then run:

```bash
pnpm electron:build:private
```

Private builds intentionally contain the key and must not be published to GitHub Releases.

For local desktop development, run `pnpm dev` in one terminal and `pnpm electron:dev` in
another.

## Status

🚧 Active development. Desktop update safety and release automation are still in progress.
