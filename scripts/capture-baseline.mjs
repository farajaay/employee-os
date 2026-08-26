/**
 * M-01 — capture the reference screenshots into docs/baseline/.
 *
 * Five views at three widths, Arabic RTL: 15 files. These are the regression
 * reference that M-04 (CSS extraction), M-05 (JS split), M-13 (bottom tabs),
 * M-14 (safe-area insets) and M-15 (RTL verification) are compared against
 * before any of them may be declared done.
 *
 *   npm run build
 *   BASELINE_EMAIL=... BASELINE_PASSWORD=... node scripts/capture-baseline.mjs
 *
 * The app is fully login-gated, so without credentials only the auth screen is
 * reachable and the script captures that alone, then exits non-zero. Use a
 * dedicated demo account — the same one Apple will need in the M-40 review
 * notes — never a personal password. Credentials are read from the environment
 * and are never written to disk or into a screenshot.
 */

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'docs', 'baseline');
const DIST = join(ROOT, 'dist', 'index.html');

/** The five product views, in sidebar order. */
const VIEWS = [
  { id: 'home', label: 'اليوم' },
  { id: 'projects', label: 'المشاريع' },
  { id: 'workflow', label: 'Workflow' },
  { id: 'events', label: 'Event Radar' },
  { id: 'career', label: 'Career' }
];

/** Phone / tablet / desktop, as specified by M-01. */
const WIDTHS = [390, 768, 1440];

const email = process.env.BASELINE_EMAIL;
const password = process.env.BASELINE_PASSWORD;

async function serveDist() {
  const html = await readFile(DIST);
  const server = createServer((_req, res) => {
    res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    res.end(html);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return { server, url: `http://127.0.0.1:${server.address().port}/` };
}

async function signIn(page) {
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('#loginBtn');
  // #app loses .hidden once showApp() runs; the sync indicator settles after load()
  await page.waitForSelector('#app:not(.hidden)', { timeout: 30_000 });
  await page.waitForFunction(
    () => !document.querySelector('#sync')?.textContent?.includes('Syncing'),
    { timeout: 30_000 }
  );
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const { server, url } = await serveDist();
  // CI images often ship a Chromium that predates the pinned Playwright build.
  // PLAYWRIGHT_CHROMIUM_PATH points at that binary; unset, Playwright resolves
  // its own download as normal.
  const executablePath = process.env.PLAYWRIGHT_CHROMIUM_PATH;
  const browser = await chromium.launch(executablePath ? { executablePath } : {});
  const written = [];

  try {
    for (const width of WIDTHS) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
        deviceScaleFactor: 2,
        locale: 'ar',
        reducedMotion: 'reduce'
      });
      const page = await context.newPage();
      await page.goto(url, { waitUntil: 'networkidle' });

      if (!email || !password) {
        const file = join(OUT, `auth-${width}.png`);
        await page.screenshot({ path: file, fullPage: true });
        written.push(file);
        await context.close();
        continue;
      }

      await signIn(page);

      for (const view of VIEWS) {
        await page.click(`[data-view="${view.id}"]`);
        await page.waitForSelector(`#${view.id}:not(.hidden)`, { timeout: 15_000 });
        await page.waitForTimeout(300); // let any transition settle
        const file = join(OUT, `${view.id}-${width}.png`);
        await page.screenshot({ path: file, fullPage: true });
        written.push(file);
      }
      await context.close();
    }
  } finally {
    await browser.close();
    server.close();
  }

  for (const f of written) console.warn('wrote', f.replace(ROOT + '/', ''));

  if (!email || !password) {
    console.error(
      `\nCaptured ${written.length} auth screens only.\n` +
        'The five views are behind the login gate. Set BASELINE_EMAIL and ' +
        'BASELINE_PASSWORD to a demo account and re-run to produce the 15 ' +
        'screenshots M-01 requires.'
    );
    process.exit(1);
  }

  const expected = VIEWS.length * WIDTHS.length;
  if (written.length !== expected) {
    console.error(`Expected ${expected} screenshots, wrote ${written.length}.`);
    process.exit(1);
  }
  console.warn(`\nM-01: ${written.length} screenshots captured.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
