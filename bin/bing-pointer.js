#!/usr/bin/env node

const { chromium, devices } = require('playwright-core');
const { parseArgs } = require('node:util');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');

// --- Config ---
const BING_POINTER_DIR = path.join(os.homedir(), '.bing-pointer');
const PROFILE_DIR = path.join(BING_POINTER_DIR, 'profile');
const HISTORY_FILE = path.join(BING_POINTER_DIR, 'history.json');
const SEARCHES_PER_MODE = 35;
const DELAY_MS = 20000; // 20s between searches to avoid cooldown detection
const DASHBOARD_PORT = parseInt(process.env.PORT || '7823', 10);

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
  // Check for Microsoft auth cookies — works in both desktop and mobile modes
  const cookies = await page.context().cookies('https://www.bing.com');
  const signedIn = cookies.some(c => c.name === '_U' && c.value.length > 0);
  if (!signedIn) {
    throw new Error('Not signed in to Microsoft. Run: bing-pointer --setup');
  }
}

async function search(context, count, delay, label, onProgress) {
  const report = onProgress || ((msg) => console.log(`[${msg.index}/${msg.total}] ${msg.mode}: ${msg.error ? 'FAILED - ' + msg.error : '"' + msg.query + '"'}`));
  const page = context.pages()[0] || await context.newPage();
  await checkLogin(page);

  for (let i = 0; i < count; i++) {
    const query = randomQuery();
    try {
      await page.goto('https://www.bing.com');
      const input = page.locator('#sb_form_q');
      // Clear existing text using keyboard (like a real user)
      await input.click();
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Backspace');
      // Type query character-by-character to fire real keyboard events
      await input.pressSequentially(query, { delay: 50 + Math.random() * 80 });
      await page.keyboard.press('Enter');
      await page.waitForLoadState('load');
      // Dwell on results page (2-5s) to look human
      await page.waitForTimeout(2000 + Math.random() * 3000);
      report({ index: i + 1, total: count, mode: label, query });
    } catch (e) {
      report({ index: i + 1, total: count, mode: label, query, error: e.message });
    }
    if (i < count - 1) await page.waitForTimeout(delay);
  }
}

async function getRewardsPoints(page) {
  try {
    await page.goto('https://www.bing.com');
    // Try multiple selectors — Bing's layout varies
    for (const selector of ['#id_rc', '.points-container', '#rewardsBadge']) {
      const text = await page.locator(selector).first().textContent({ timeout: 5000 }).catch(() => '');
      const points = parseInt(text.replace(/[^0-9]/g, ''), 10);
      if (!isNaN(points) && points > 0) return points;
    }
  } catch { /* fall through */ }
  return null;
}

function readHistory() {
  try {
    return JSON.parse(fs.readFileSync(HISTORY_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function appendHistory(entry) {
  const history = readHistory();
  history.push(entry);
  fs.mkdirSync(path.dirname(HISTORY_FILE), { recursive: true });
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2) + '\n');
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
module.exports = { randomQuery, launchBrowser, search, setup, checkLogin, getRewardsPoints, readHistory, appendHistory, WORDS, SEARCHES_PER_MODE, DELAY_MS, PROFILE_DIR, HISTORY_FILE, BING_POINTER_DIR, EDGE_UA_DESKTOP, EDGE_UA_MOBILE };

// --- CLI entry point ---
if (require.main === module) {
  const { values: opts } = parseArgs({
    options: {
      setup:     { type: 'boolean', default: false },
      mode:      { type: 'string',  default: 'desktop' },
      count:     { type: 'string',  default: String(SEARCHES_PER_MODE) },
      delay:     { type: 'string',  default: String(DELAY_MS) },
      headless:  { type: 'boolean', default: false },
      dashboard: { type: 'boolean', default: false },
      points:    { type: 'boolean', default: false },
      help:      { type: 'boolean', short: 'h', default: false },
    },
    strict: false,
  });

  if (opts.help) {
    console.log(`Bing Pointer - Earn Microsoft Rewards points with automated Bing searches

Usage: bing-pointer [options]

Options:
  --setup       Open browser for Microsoft account login
  --mode MODE   desktop, mobile, or both (default: desktop)
  --count N     Searches per mode (default: ${SEARCHES_PER_MODE})
  --delay MS    Delay between searches in ms (default: ${DELAY_MS})
  --headless    Run without visible browser window
  --dashboard   Start web dashboard on port ${DASHBOARD_PORT}
  --points      Show current Rewards points balance and exit
  -h, --help    Show this help message`);
    process.exit(0);
  }

  // IPC progress mode: when forked by the dashboard, send progress via process.send()
  const ipcProgress = process.env.PROGRESS_IPC === '1' && typeof process.send === 'function';
  const onProgress = ipcProgress ? (msg) => process.send(msg) : undefined;

  async function runSearches(profileDir, mode, count, delay, headless, progressCb) {
    const results = { desktop: 0, mobile: 0 };

    if (mode === 'desktop' || mode === 'both') {
      const context = await launchBrowser(profileDir, false, headless);
      try {
        await search(context, count, delay, 'Desktop', progressCb);
        results.desktop = count;
        if (progressCb) progressCb({ event: 'mode_complete', mode: 'Desktop', count });
      } finally {
        await context.close();
      }
    }

    if (mode === 'mobile' || mode === 'both') {
      const context = await launchBrowser(profileDir, true, headless);
      try {
        await search(context, count, delay, 'Mobile', progressCb);
        results.mobile = count;
        if (progressCb) progressCb({ event: 'mode_complete', mode: 'Mobile', count });
      } finally {
        await context.close();
      }
    }

    return results;
  }

  async function main() {
    const count = parseInt(opts.count, 10);
    const delay = parseInt(opts.delay, 10);

    if (opts.setup) {
      await setup(PROFILE_DIR);
      return;
    }

    if (opts.points) {
      const context = await launchBrowser(PROFILE_DIR, false, true);
      try {
        const page = context.pages()[0] || await context.newPage();
        await checkLogin(page);
        const points = await getRewardsPoints(page);
        console.log(points !== null ? `Rewards points: ${points}` : 'Could not retrieve points.');
      } finally {
        await context.close();
      }
      return;
    }

    if (opts.dashboard) {
      const { startDashboard } = require('./dashboard');
      startDashboard(DASHBOARD_PORT);
      return;
    }

    const results = await runSearches(PROFILE_DIR, opts.mode, count, delay, opts.headless, onProgress);

    // Scrape points and save history
    if (!ipcProgress) {
      let points = null;
      try {
        const context = await launchBrowser(PROFILE_DIR, false, true);
        try {
          const page = context.pages()[0] || await context.newPage();
          points = await getRewardsPoints(page);
        } finally {
          await context.close();
        }
      } catch { /* points scraping is best-effort */ }

      appendHistory({
        date: new Date().toISOString().slice(0, 10),
        desktop: results.desktop,
        mobile: results.mobile,
        points,
        status: 'completed',
      });

      if (points !== null) console.log(`Rewards points: ${points}`);
    }

    console.log('Done!');
  }

  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
