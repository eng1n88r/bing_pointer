# Bing Pointer

Automate Bing searches to earn Microsoft Rewards points. Uses Playwright with your existing Edge, Chrome, or Brave browser.

## Requirements

- [Node.js](https://nodejs.org/) 18+
- Microsoft Edge, Google Chrome, or Brave

## Install

```sh
git clone https://github.com/eng1n88r/bing_pointer.git
cd bing_pointer
npm install
```

## Setup (first time only)

Log in to your Microsoft account so future searches are authenticated:

```sh
node bin/bing-pointer.js --setup
```

This opens a browser window to bing.com. Log in, then press Enter in the terminal.

## Usage

```sh
# Run searches (default: 35)
node bin/bing-pointer.js

# Custom search count and delay
node bin/bing-pointer.js --count 20 --delay 10000

# Headless (no visible browser window)
node bin/bing-pointer.js --headless

# Check current Rewards points balance
node bin/bing-pointer.js --points

# Start the web dashboard
node bin/bing-pointer.js --dashboard
```

## Options

| Flag | Default | Description |
|---|---|---|
| `--setup` | | Open browser for Microsoft account login |
| `--count` | `35` | Number of searches per run |
| `--delay` | `20000` | Milliseconds between searches |
| `--headless` | | Run without visible browser window |
| `--dashboard` | | Start web dashboard on port 7823 |
| `--points` | | Show current Rewards points balance |
| `-h, --help` | | Show help message |

## Dashboard

Start the dashboard with `--dashboard` to get a web UI at `http://127.0.0.1:7823` with:

- Session status (signed in / expired)
- Run searches with count control
- Real-time progress via Server-Sent Events
- Current Rewards points balance
- 30-day points history chart

The dashboard API is also agent-friendly:

```sh
curl http://localhost:7823/api/status
curl -X POST http://localhost:7823/api/searches -H 'Content-Type: application/json' -d '{"count":35}'
curl http://localhost:7823/api/points
```

## How It Works

The tool opens your browser (tries Edge first, then Chrome, then Brave) with a persistent profile at `~/.bing-pointer/profile`, navigates to bing.com, and types searches with random English word combinations using realistic keyboard input.

Session cookies persist in the profile directory, so you only need to log in once via `--setup`. Before running searches, the tool verifies you are still signed in. If your session has expired, it aborts immediately with a message to re-run `--setup`.

After each run, the tool scrapes your Rewards points balance and saves the result to `~/.bing-pointer/history.json`.

## Note

Automated searches may violate Microsoft Rewards Terms of Service. Use at your own risk.
