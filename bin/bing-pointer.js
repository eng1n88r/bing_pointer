#!/usr/bin/env node

const { chromium, devices } = require('playwright-core');
const { parseArgs } = require('node:util');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');

// --- Config ---
const PROFILE_DIR = path.join(os.homedir(), '.bing-pointer', 'profile');
const SEARCHES_PER_MODE = 35;
const DELAY_MS = 2000;

// Edge user-agents so Bing awards maximum Rewards points regardless of actual browser
const EDGE_UA_DESKTOP = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36 Edg/131.0.0.0';
const EDGE_UA_MOBILE = 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36 EdgA/131.0.0.0';

const WORDS = [
  'weather', 'recipe', 'movie', 'travel', 'music', 'garden', 'history',
  'science', 'sports', 'technology', 'health', 'finance', 'cooking',
  'nature', 'fashion', 'education', 'animal', 'ocean', 'mountain',
  'holiday', 'fitness', 'painting', 'camera', 'guitar', 'coffee',
  'sunset', 'forest', 'bridge', 'castle', 'planet', 'library',
  'concert', 'restaurant', 'bicycle', 'winter', 'summer', 'garden',
  'museum', 'volcano', 'dolphin', 'airport', 'market', 'stadium',
  'theater', 'island', 'desert', 'rocket', 'puzzle', 'harvest',
];

// --- Helpers ---
function randomQuery() {
  const pick = () => WORDS[Math.floor(Math.random() * WORDS.length)];
  return `${pick()} ${pick()} ${Math.floor(Math.random() * 10000)}`;
}

async function launchBrowser(profileDir, mobile, headless) {
  fs.mkdirSync(profileDir, { recursive: true });

  const contextOpts = { headless, userAgent: mobile ? EDGE_UA_MOBILE : EDGE_UA_DESKTOP };
  if (mobile) {
    const { userAgent: _, ...deviceDesc } = devices['iPhone 13'];
    Object.assign(contextOpts, deviceDesc);
  }

  // Try Edge first (earns more Rewards points), then Chrome, then Brave
  for (const channel of ['msedge', 'chrome']) {
    try {
      return await chromium.launchPersistentContext(profileDir, { ...contextOpts, channel });
    } catch {
      // Try next channel
    }
  }

  // Brave requires executablePath (no named channel in Playwright)
  const bravePaths = {
    darwin: '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
    win32: path.join(process.env.LOCALAPPDATA || '', 'BraveSoftware/Brave-Browser/Application/brave.exe'),
    linux: '/usr/bin/brave-browser',
  };
  const bravePath = bravePaths[process.platform];
  if (bravePath && fs.existsSync(bravePath)) {
    try {
      return await chromium.launchPersistentContext(profileDir, { ...contextOpts, executablePath: bravePath });
    } catch {
      // Fall through to error
    }
  }

  throw new Error('No supported browser found. Install Microsoft Edge, Google Chrome, or Brave.');
}

async function checkLogin(page) {
  await page.goto('https://www.bing.com');
  const signedIn = await page.locator('#id_n').isVisible({ timeout: 5000 }).catch(() => false);
  if (!signedIn) {
    throw new Error('Not signed in to Microsoft. Run: bing-pointer --setup');
  }
}

async function search(context, count, delay, label) {
  const page = context.pages()[0] || await context.newPage();
  await checkLogin(page);

  for (let i = 0; i < count; i++) {
    const query = randomQuery();
    try {
      await page.goto('https://www.bing.com');
      await page.locator('#sb_form_q').fill(query);
      await page.locator('#sb_form_q').press('Enter');
      await page.waitForLoadState('load');
      console.log(`[${i + 1}/${count}] ${label}: "${query}"`);
    } catch (e) {
      console.log(`[${i + 1}/${count}] ${label}: FAILED - ${e.message}`);
    }
    if (i < count - 1) await page.waitForTimeout(delay);
  }
}

async function setup(profileDir) {
  console.log('Opening browser for Microsoft account login...');
  const context = await launchBrowser(profileDir, false, false);
  const page = context.pages()[0] || await context.newPage();
  await page.goto('https://www.bing.com');
  console.log('\nLog in to your Microsoft account in the browser window.');
  console.log('Press Enter here when done...');
  await new Promise((resolve) => process.stdin.once('data', resolve));
  await context.close();
  console.log('Login saved. Run bing-pointer to start searching.');
}

// --- Exports (for testing) ---
module.exports = { randomQuery, launchBrowser, search, setup, checkLogin, WORDS, SEARCHES_PER_MODE, DELAY_MS, PROFILE_DIR, EDGE_UA_DESKTOP, EDGE_UA_MOBILE };

// --- CLI entry point ---
if (require.main === module) {
  const { values: opts } = parseArgs({
    options: {
      setup:    { type: 'boolean', default: false },
      mode:     { type: 'string',  default: 'both' },
      count:    { type: 'string',  default: String(SEARCHES_PER_MODE) },
      delay:    { type: 'string',  default: String(DELAY_MS) },
      headless: { type: 'boolean', default: false },
      help:     { type: 'boolean', short: 'h', default: false },
    },
    strict: false,
  });

  if (opts.help) {
    console.log(`Bing Pointer - Earn Microsoft Rewards points with automated Bing searches

Usage: bing-pointer [options]

Options:
  --setup       Open browser for Microsoft account login
  --mode MODE   desktop, mobile, or both (default: both)
  --count N     Searches per mode (default: ${SEARCHES_PER_MODE})
  --delay MS    Delay between searches in ms (default: ${DELAY_MS})
  --headless    Run without visible browser window
  -h, --help    Show this help message`);
    process.exit(0);
  }

  async function main() {
    const count = parseInt(opts.count, 10);
    const delay = parseInt(opts.delay, 10);

    if (opts.setup) {
      await setup(PROFILE_DIR);
      return;
    }

    const headless = opts.headless;

    if (opts.mode === 'desktop' || opts.mode === 'both') {
      const context = await launchBrowser(PROFILE_DIR, false, headless);
      try {
        await search(context, count, delay, 'Desktop');
      } finally {
        await context.close();
      }
    }

    if (opts.mode === 'mobile' || opts.mode === 'both') {
      const context = await launchBrowser(PROFILE_DIR, true, headless);
      try {
        await search(context, count, delay, 'Mobile');
      } finally {
        await context.close();
      }
    }

    console.log('Done!');
  }

  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
