# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bing Pointer is a Playwright-based browser automation tool that performs automated Bing searches to collect daily Microsoft Rewards points. It runs searches in both desktop and mobile browser modes using a persistent browser profile for authentication. Includes a web dashboard for monitoring and control.

## Dependencies

- **Node.js 18+** required (for `node:util` `parseArgs` and Playwright compatibility)
- **Microsoft Edge, Google Chrome, or Brave** installed on the user's machine
- Single runtime dependency: `playwright-core` (uses system browsers only, no bundled browser download)
- Zero npm dependencies for the dashboard (uses Node's built-in `http` module)

## Commands

```sh
# Install dependencies
npm install

# First-time setup (login to Microsoft account)
node bin/bing-pointer.js --setup

# Run all searches (desktop + mobile, 35 each)
node bin/bing-pointer.js

# Desktop or mobile only
node bin/bing-pointer.js --mode desktop
node bin/bing-pointer.js --mode mobile

# Custom options
node bin/bing-pointer.js --count 20 --delay 3000 --headless

# Check Rewards points balance
node bin/bing-pointer.js --points

# Start web dashboard
node bin/bing-pointer.js --dashboard

# Run tests
npm test
```

## Architecture

Two main files:

- **`bin/bing-pointer.js`** (~280 lines) -- CLI tool and core logic
- **`bin/dashboard.js`** (~170 lines) -- HTTP server for the web dashboard

### Core (bin/bing-pointer.js)

- **CLI parsing**: `node:util` `parseArgs` (zero-dependency, built into Node 18+)
- **Browser launch**: `chromium.launchPersistentContext()` with channel auto-detection (tries `msedge` first, falls back to `chrome`, then Brave).
- **Search loop**: Navigates to bing.com, fills `#sb_form_q`, presses Enter. Uses real English word combinations. Accepts an `onProgress` callback for IPC when forked by the dashboard.
- **Session check**: `checkLogin()` verifies `#id_n` element (user avatar) is visible on bing.com before running searches.
- **Points scraping**: `getRewardsPoints()` reads `#id_rc` element on bing.com for current balance.
- **History**: `readHistory()` / `appendHistory()` manage `~/.bing-pointer/history.json`.
- **IPC mode**: When `PROGRESS_IPC=1` is set and `process.send()` is available, search progress is sent via IPC instead of console.log. Used by the dashboard's forked worker.

### Dashboard (bin/dashboard.js)

- **HTTP server**: Node's built-in `http` module, binds to `127.0.0.1` only.
- **Search isolation**: Spawns searches via `child_process.fork()` to keep the dashboard event loop responsive.
- **SSE**: Real-time progress streaming to the browser via Server-Sent Events.
- **Routes**: `GET /`, `GET /health`, `GET /api/status`, `POST /api/searches`, `GET /api/searches/progress` (SSE), `GET /api/points`, `POST /api/points/refresh`.

### Dashboard UI (public/index.html)

- Single HTML file with inline CSS/JS.
- Chart.js loaded from CDN for points history chart.

## Data Storage

- **Profile**: `~/.bing-pointer/profile/` -- Chromium persistent browser profile
- **History**: `~/.bing-pointer/history.json` -- JSON array of daily run results (~100 bytes/entry)

## Important Notes

- Uses `playwright-core` (not `playwright`) so non-Docker users don't download 400MB of Chromium on `npm install`.
- Bing DOM selectors (`#sb_form_q`, `#id_n`, `#id_rc`) are used directly. If Bing redesigns, these need updating.
- The persistent profile directory is locked by Chromium while in use. Desktop and mobile modes run sequentially.
- Dashboard concurrent search runs are rejected (409 status).
