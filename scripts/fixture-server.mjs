/**
 * Shared harness: serve the built app and answer Supabase with fixtures.
 *
 * This is what lets the five product views be rendered, screenshotted and
 * regression-tested without a login. Every Supabase request is intercepted in
 * the browser and answered from tests/fixtures/workspace.mjs — no credential is
 * used, and nothing reaches the production project.
 *
 * It is NOT a substitute for testing against the real backend. It proves the
 * views render and behave correctly for a known dataset; it cannot prove the
 * queries match the real schema, that RLS returns what is expected, or that
 * writes land. Those still need a real account.
 */

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { TABLES, SESSION } from '../tests/fixtures/workspace.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.map': 'application/json; charset=utf-8'
};

export async function serveDist() {
  const server = createServer(async (req, res) => {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const file = path === '/' ? join(DIST, 'index.html') : join(DIST, path);
    if (!file.startsWith(DIST)) return void res.writeHead(403).end();
    try {
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': MIME[file.slice(file.lastIndexOf('.'))] ?? 'text/plain' });
      res.end(body);
    } catch {
      res.writeHead(404).end('not found');
    }
  });
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  return { server, url: `http://127.0.0.1:${server.address().port}/` };
}

/**
 * Answer every Supabase call from the fixtures.
 *
 * PostgREST puts the relation in the path (/rest/v1/<table>) and the filters in
 * the query string. The app only ever filters by workspace_id, user_id or
 * run_id, so honouring those three is enough to reproduce its real behaviour.
 */
export async function routeSupabase(page, { onWrite } = {}) {
  const writes = [];
  await page.route('**://*.supabase.co/**', async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const json = (body, status = 200) =>
      route.fulfill({
        status,
        contentType: 'application/json',
        headers: { 'access-control-allow-origin': '*' },
        body: JSON.stringify(body)
      });

    if (url.pathname.startsWith('/auth/v1/token')) return json(SESSION);
    if (url.pathname.startsWith('/auth/v1/user')) return json(SESSION.user);
    if (url.pathname.startsWith('/auth/v1/logout')) return json({});

    const table = url.pathname.replace('/rest/v1/', '').split('?')[0];
    if (!(table in TABLES)) return json([]);

    // Writes are recorded, never applied — the fixtures stay a known dataset.
    if (req.method() !== 'GET') {
      const entry = { table, method: req.method(), body: req.postDataJSON?.() ?? null };
      writes.push(entry);
      onWrite?.(entry);
      return json(Array.isArray(entry.body) ? entry.body : [entry.body ?? {}], 201);
    }

    let rows = TABLES[table];
    for (const [key, raw] of url.searchParams) {
      if (['select', 'order', 'limit', 'offset'].includes(key)) continue;
      const [op, ...rest] = raw.split('.');
      const value = rest.join('.');
      if (op === 'eq') rows = rows.filter((r) => String(r[key]) === value);
      else if (op === 'is' && value === 'null') rows = rows.filter((r) => r[key] === null);
      else if (op === 'in') {
        const set = new Set(value.replace(/^\(|\)$/g, '').split(',').map((s) => s.replace(/^"|"$/g, '')));
        rows = rows.filter((r) => set.has(String(r[key])));
      }
    }

    const order = url.searchParams.get('order');
    if (order) {
      const [col, dir] = order.split('.');
      rows = [...rows].sort((a, b) => String(a[col] ?? '').localeCompare(String(b[col] ?? '')));
      if (dir === 'desc') rows.reverse();
    }
    const limit = url.searchParams.get('limit');
    if (limit) rows = rows.slice(0, Number(limit));
    return json(rows);
  });
  return writes;
}

/** Sign in through the real form, against the fixture backend. */
export async function signIn(page) {
  await page.fill('#email', SESSION.user.email);
  await page.fill('#password', 'fixture-password');
  await page.click('#loginBtn');
  await page.waitForSelector('#app:not(.hidden)', { timeout: 20_000 });
  await page.waitForFunction(
    () => !(document.querySelector('#sync')?.textContent ?? '').includes('Syncing'),
    { timeout: 20_000 }
  );
}

export async function launch() {
  return chromium.launch(
    process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
      : {}
  );
}
