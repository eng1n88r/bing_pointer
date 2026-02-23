# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bing Pointer is a Playwright-based browser automation tool that performs automated Bing searches to collect daily Microsoft Rewards points. It runs searches in both desktop and mobile browser modes using a persistent browser profile for authentication.

## Dependencies

- **Node.js 18+** required (for `node:util` `parseArgs` and Playwright compatibility)
- **Microsoft Edge or Google Chrome** installed on the user's machine
- Single runtime dependency: `playwright-core` (uses system browsers only, no bundled browser download)

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
```

## Architecture

The entire tool is a single file: `bin/bing-pointer.js` (~120 lines).

- **CLI parsing**: `node:util` `parseArgs` (zero-dependency, built into Node 18+)
- **Browser launch**: `chromium.launchPersistentContext()` with channel auto-detection (tries `msedge` first, falls back to `chrome`). Profile stored at `~/.bing-pointer/profile`.
- **Search loop**: Navigates to bing.com, fills `#sb_form_q`, clicks `#sb_form_go`. Uses real English word combinations instead of random characters.
- **Mobile emulation**: Playwright's built-in `devices['iPhone 13']` descriptor (user-agent, viewport, touch).
- **Setup flow**: `--setup` opens a headed browser for manual Microsoft account login, waits for Enter, then saves the session in the persistent profile.
- **Error handling**: try/catch per search (skip failures, continue), `context.close()` in `finally` blocks to guarantee profile lock release.

## Important Notes

- Uses `playwright-core` (not `playwright`) since only system-installed browsers are used via the `channel` option -- no Playwright-managed browser binaries needed.
- The persistent profile directory is locked by Chromium while in use. Desktop and mobile modes run sequentially, each closing the context before the next opens.
- Bing DOM selectors (`#sb_form_q`, `#sb_form_go`) are used directly in the search function. If Bing redesigns, these need updating.
