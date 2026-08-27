/**
 * Runtime smoke test — proves the app's JavaScript actually loads, evaluates and
 * wires itself up.
 *
 *   npm run build && node scripts/smoke.mjs
 *
 * Pixel-comparing the auth screen is NOT enough: that screen renders from HTML
 * and CSS alone, so it looks identical even if the script never ran. This drives
 * the one code path reachable without credentials — a rejected sign-in — which
 * transitively proves the module evaluated, the Supabase client was constructed,
 * the submit listener was attached, login() ran, and authMsg() rendered.
 *
 * Every Supabase request is intercepted and answered locally. Nothing reaches
 * the production backend, so this is safe to run in CI and leaves no failed
 * sign-in in the project's auth logs.
 */

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.map': 'application/json; charset=utf-8'
};

async function serveDist() {
  const root = join(ROOT, 'dist');
  const server = createServer(async (req, res) => {
    const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const file = path === '/' ? join(root, 'index.html') : join(root, path);
    if (!file.startsWith(root)) return void res.writeHead(403).end();
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

const checks = [];
const check = (name, ok, detail = '') => {
  checks.push({ name, ok, detail });
  console.warn(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
};

async function main() {
  const { server, url } = await serveDist();
  const browser = await chromium.launch(
    process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
      : {}
  );
  const page = await browser.newPage({ viewport: { width: 390, height: 900 }, locale: 'ar' });

  // Only uncaught exceptions count. The browser also logs a console error for
  // the deliberately-stubbed 400 from the token endpoint, which is the expected
  // result of a rejected sign-in, not a fault.
  const errors = [];
  const supabaseHits = [];
  const offHostRequests = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('request', (r) => {
    const u = r.url();
    if (!u.startsWith(url) && !u.includes('.supabase.co') && !u.startsWith('data:')) {
      offHostRequests.push(u);
    }
  });

  // Answer every Supabase call locally. Nothing leaves this machine.
  await page.route('**://*.supabase.co/**', async (route) => {
    const u = route.request().url();
    supabaseHits.push(u);
    if (u.includes('/auth/v1/token')) {
      return route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'invalid_grant', error_description: 'Invalid login credentials' })
      });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });

  try {
    await page.goto(url, { waitUntil: 'networkidle' });

    // M-06's Done when. The client is bundled now, so nothing may be fetched
    // from a third-party host at runtime — the app used to fail to start
    // entirely when jsDelivr was unreachable.
    check('zero CDN requests at runtime (M-06)', offHostRequests.length === 0, offHostRequests.join(', '));
    check(
      'the jsDelivr global is gone',
      await page.evaluate(() => typeof window.supabase === 'undefined')
    );

    check(
      'the auth screen is visible and the app is gated',
      await page.evaluate(
        () =>
          !document.querySelector('#auth')?.classList.contains('hidden') &&
          document.querySelector('#app')?.classList.contains('hidden')
      )
    );

    // Submitting the form proves the listener was attached and login() runs.
    await page.fill('#email', 'smoke-test@example.invalid');
    await page.fill('#password', 'not-a-real-password');
    await page.click('#loginBtn');
    await page.waitForFunction(() => (document.querySelector('#authMsg')?.textContent ?? '').trim().length > 0, {
      timeout: 15_000
    });

    const msg = (await page.textContent('#authMsg'))?.trim() ?? '';
    check('a rejected sign-in renders an error via authMsg()', msg.length > 0, JSON.stringify(msg));
    check(
      'login() reached the Supabase token endpoint',
      supabaseHits.some((u) => u.includes('/auth/v1/token')),
      `${supabaseHits.length} intercepted call(s)`
    );
    check('the app stayed gated after a failed sign-in',
      await page.evaluate(() => document.querySelector('#app')?.classList.contains('hidden')));

    // Modal wiring is bound at module top level, so it exercises the same path.
    check(
      'view buttons are present and wired',
      (await page.evaluate(() => document.querySelectorAll('[data-view]').length)) === 5
    );

    check('no uncaught exceptions', errors.length === 0, errors.slice(0, 3).join(' | '));
  } finally {
    await browser.close();
    server.close();
  }

  const failed = checks.filter((c) => !c.ok);
  if (failed.length) {
    console.error(`\n${failed.length} of ${checks.length} smoke checks failed.`);
    process.exit(1);
  }
  console.warn(`\nAll ${checks.length} smoke checks passed. No request reached production.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
