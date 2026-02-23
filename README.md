# Bing Pointer

Automate Bing searches to earn Microsoft Rewards points. Runs desktop and mobile searches using Playwright with your existing Edge, Chrome, or Brave browser.

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
# Run desktop + mobile searches (default: 35 each)
node bin/bing-pointer.js

# Desktop only
node bin/bing-pointer.js --mode desktop

# Mobile only
node bin/bing-pointer.js --mode mobile

# Custom search count and delay
node bin/bing-pointer.js --count 20 --delay 3000

# Headless (no visible browser window)
node bin/bing-pointer.js --headless
```

## Options

| Flag | Default | Description |
|---|---|---|
| `--setup` | | Open browser for Microsoft account login |
| `--mode` | `both` | `desktop`, `mobile`, or `both` |
| `--count` | `35` | Number of searches per mode |
| `--delay` | `2000` | Milliseconds between searches |
| `--headless` | | Run without visible browser window |
| `-h, --help` | | Show help message |

## How It Works

The tool opens your browser (tries Edge first, then Chrome, then Brave) with a persistent profile at `~/.bing-pointer/profile`, navigates to bing.com, and submits searches with random English word combinations. Desktop mode uses a standard browser. Mobile mode emulates an iPhone 13 (user-agent, viewport, touch).

Session cookies persist in the profile directory, so you only need to log in once via `--setup`. Before running searches, the tool verifies you are still signed in. If your session has expired, it aborts immediately with a message to re-run `--setup`.

## Note

Automated searches may violate Microsoft Rewards Terms of Service. Use at your own risk.
