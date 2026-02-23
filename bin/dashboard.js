const http = require('node:http');
const { fork } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');
const { readHistory, appendHistory, launchBrowser, checkLogin, getRewardsPoints, PROFILE_DIR, HISTORY_FILE, SEARCHES_PER_MODE, DELAY_MS } = require('./bing-pointer');

let currentRun = null; // { worker, sseClients: Set }
const sseClients = new Set();

function json(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString()) : {});
      } catch {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

function broadcast(event, data) {
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    client.write(msg);
  }
}

async function handleRequest(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const method = req.method;

  // --- Static files ---
  if (method === 'GET' && url.pathname === '/') {
    const htmlPath = path.join(__dirname, '..', 'public', 'index.html');
    try {
      const html = fs.readFileSync(htmlPath, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    } catch {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Dashboard HTML not found');
    }
    return;
  }

  // --- Health check ---
  if (method === 'GET' && url.pathname === '/health') {
    json(res, 200, { status: 'ok' });
    return;
  }

  // --- API: status ---
  if (method === 'GET' && url.pathname === '/api/status') {
    let signedIn = false;
    try {
      const context = await launchBrowser(PROFILE_DIR, false, true);
      try {
        const page = context.pages()[0] || await context.newPage();
        await checkLogin(page);
        signedIn = true;
      } finally {
        await context.close();
      }
    } catch { /* not signed in */ }

    const history = readHistory();
    const lastRun = history.length ? history[history.length - 1] : null;

    json(res, 200, {
      signedIn,
      running: currentRun !== null,
      lastRun,
    });
    return;
  }

  // --- API: start searches ---
  if (method === 'POST' && url.pathname === '/api/searches') {
    if (currentRun) {
      json(res, 409, { error: 'A search run is already in progress' });
      return;
    }

    let body = {};
    try { body = await parseBody(req); } catch { /* use defaults */ }

    const mode = body.mode || 'both';
    const count = String(body.count || SEARCHES_PER_MODE);
    const delay = String(body.delay || DELAY_MS);

    const worker = fork(path.join(__dirname, 'bing-pointer.js'), [
      '--headless', '--mode', mode, '--count', count, '--delay', delay,
    ], {
      env: { ...process.env, PROGRESS_IPC: '1' },
    });

    currentRun = { worker };

    worker.on('message', (msg) => {
      if (msg.event === 'mode_complete') {
        broadcast('mode_complete', msg);
      } else if (msg.error) {
        broadcast('error', { message: msg.error });
      } else {
        broadcast('search', msg);
      }
    });

    worker.on('exit', async (code) => {
      // Scrape points after run completes
      let points = null;
      try {
        const context = await launchBrowser(PROFILE_DIR, false, true);
        try {
          const page = context.pages()[0] || await context.newPage();
          points = await getRewardsPoints(page);
        } finally {
          await context.close();
        }
      } catch { /* best-effort */ }

      const countNum = parseInt(count, 10);
      const entry = {
        date: new Date().toISOString().slice(0, 10),
        desktop: (mode === 'desktop' || mode === 'both') ? countNum : 0,
        mobile: (mode === 'mobile' || mode === 'both') ? countNum : 0,
        points,
        status: code === 0 ? 'completed' : 'failed',
      };
      appendHistory(entry);

      broadcast('complete', { ...entry });
      currentRun = null;
    });

    worker.on('error', (err) => {
      broadcast('error', { message: err.message });
      currentRun = null;
    });

    json(res, 202, { status: 'started', mode, count: parseInt(count, 10) });
    return;
  }

  // --- API: SSE progress stream ---
  if (method === 'GET' && url.pathname === '/api/searches/progress') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });
    res.write('event: connected\ndata: {}\n\n');
    sseClients.add(res);
    req.on('close', () => sseClients.delete(res));
    return;
  }

  // --- API: points ---
  if (method === 'GET' && url.pathname === '/api/points') {
    const history = readHistory();
    const last30 = history.slice(-30);
    const latest = last30.length ? last30[last30.length - 1] : null;
    json(res, 200, { current: latest?.points ?? null, history: last30 });
    return;
  }

  // --- API: refresh points ---
  if (method === 'POST' && url.pathname === '/api/points/refresh') {
    let points = null;
    try {
      const context = await launchBrowser(PROFILE_DIR, false, true);
      try {
        const page = context.pages()[0] || await context.newPage();
        await checkLogin(page);
        points = await getRewardsPoints(page);
      } finally {
        await context.close();
      }
    } catch { /* best-effort */ }
    json(res, 200, { points });
    return;
  }

  // --- 404 ---
  json(res, 404, { error: 'Not found' });
}

function startDashboard(port) {
  const server = http.createServer((req, res) => {
    handleRequest(req, res).catch((err) => {
      console.error('Request error:', err.message);
      if (!res.headersSent) json(res, 500, { error: 'Internal server error' });
    });
  });

  server.listen(port, '127.0.0.1', () => {
    console.log(`Dashboard running at http://127.0.0.1:${port}`);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('Shutting down...');
    if (currentRun?.worker) {
      currentRun.worker.kill('SIGTERM');
    }
    for (const client of sseClients) {
      client.end();
    }
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

module.exports = { startDashboard };
