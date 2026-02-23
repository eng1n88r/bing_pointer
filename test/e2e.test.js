const { describe, it, after, before } = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');
const { execFile } = require('node:child_process');
const { launchBrowser, search, checkLogin, EDGE_UA_DESKTOP, EDGE_UA_MOBILE } = require('../bin/bing-pointer');

const tmpProfileDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'bing-pointer-test-'));

// Probe once whether a browser is available
let browserAvailable = false;

async function probeBrowser() {
  const dir = tmpProfileDir();
  try {
    const ctx = await launchBrowser(dir, false, true);
    await ctx.close();
    browserAvailable = true;
  } catch {
    browserAvailable = false;
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function requireBrowser(t) {
  if (!browserAvailable) {
    t.skip('no browser available');
    return false;
  }
  return true;
}

describe('e2e tests', () => {
  before(async () => {
    await probeBrowser();
  });

  describe('launchBrowser()', () => {
    let context;
    let profileDir;

    after(async () => {
      if (context) await context.close();
      if (profileDir) fs.rmSync(profileDir, { recursive: true, force: true });
    });

    it('launches a persistent browser context and creates the profile dir', async (t) => {
      if (!requireBrowser(t)) return;
      profileDir = tmpProfileDir();
      context = await launchBrowser(profileDir, false, true);
      assert.ok(context, 'context should be truthy');
      assert.ok(typeof context.pages === 'function', 'context should have pages()');
      assert.ok(fs.existsSync(profileDir), 'profile dir should exist');
    });

    it('uses Edge desktop user-agent', async (t) => {
      if (!requireBrowser(t)) return;
      if (!context) {
        profileDir = tmpProfileDir();
        context = await launchBrowser(profileDir, false, true);
      }
      const page = context.pages()[0] || await context.newPage();
      const ua = await page.evaluate(() => navigator.userAgent);
      assert.ok(ua.includes('Edg/'), `expected Edge desktop UA, got: ${ua}`);
    });
  });

  describe('launchBrowser() mobile', () => {
    let context;
    let profileDir;

    after(async () => {
      if (context) await context.close();
      if (profileDir) fs.rmSync(profileDir, { recursive: true, force: true });
    });

    it('applies mobile device emulation with Edge mobile UA', async (t) => {
      if (!requireBrowser(t)) return;
      profileDir = tmpProfileDir();
      context = await launchBrowser(profileDir, true, true);
      const page = context.pages()[0] || await context.newPage();
      const ua = await page.evaluate(() => navigator.userAgent);
      assert.ok(ua.includes('EdgA/'), `expected Edge mobile UA, got: ${ua}`);
      assert.ok(ua.includes('Mobile'), `expected Mobile in UA, got: ${ua}`);
    });
  });

  describe('checkLogin()', () => {
    let context;
    let profileDir;

    after(async () => {
      if (context) await context.close();
      if (profileDir) fs.rmSync(profileDir, { recursive: true, force: true });
    });

    it('throws when not signed in', { timeout: 30_000 }, async (t) => {
      if (!requireBrowser(t)) return;
      profileDir = tmpProfileDir();
      context = await launchBrowser(profileDir, false, true);
      const page = context.pages()[0] || await context.newPage();
      await assert.rejects(() => checkLogin(page), {
        message: /Not signed in to Microsoft/,
      });
    });
  });

  describe('search()', () => {
    let context;
    let profileDir;

    after(async () => {
      if (context) await context.close();
      if (profileDir) fs.rmSync(profileDir, { recursive: true, force: true });
    });

    it('rejects with login error on unauthenticated profile', { timeout: 60_000 }, async (t) => {
      if (!requireBrowser(t)) return;
      profileDir = tmpProfileDir();
      context = await launchBrowser(profileDir, false, true);
      await assert.rejects(() => search(context, 2, 100, 'Test'), {
        message: /Not signed in to Microsoft/,
      });
    });
  });
});

describe('CLI --help', () => {
  it('prints help text and exits with code 0', { timeout: 10_000 }, (t, done) => {
    const bin = path.resolve(__dirname, '..', 'bin', 'bing-pointer.js');
    execFile('node', [bin, '--help'], (error, stdout) => {
      assert.equal(error, null);
      assert.ok(stdout.includes('Bing Pointer'), 'should contain tool name');
      assert.ok(stdout.includes('--setup'), 'should mention --setup');
      assert.ok(stdout.includes('--mode'), 'should mention --mode');
      assert.ok(stdout.includes('--headless'), 'should mention --headless');
      done();
    });
  });
});
