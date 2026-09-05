/**
 * M-01 — capture the reference screenshots into docs/baseline/.
 *
 * Five views at three widths, Arabic RTL: 15 files. These are the regression
 * reference that M-04 (CSS extraction), M-05 (JS split), M-13 (bottom tabs),
 * M-14 (safe-area insets) and M-15 (RTL verification) are compared against.
 *
 *   npm run baseline                                  # fixture workspace
 *   BASELINE_EMAIL=… BASELINE_PASSWORD=… npm run baseline   # real backend
 *
 * TWO MODES, and the difference matters:
 *
 *   fixtures (default) — every Supabase call is answered locally from
 *     tests/fixtures/workspace.mjs. Realistic Arabic content of realistic
 *     length, so RTL wrapping and the 390pt layout are genuinely exercised.
 *     Nothing reaches production and no credential is needed. This proves the
 *     views RENDER and LAY OUT correctly for a known dataset.
 *
 *   real backend — set both env vars. This is the only mode that proves the
 *     queries match the live schema, that RLS returns what is expected, and
 *     that the app works against the project it will actually ship against.
 *
 * A fixture capture is not a substitute for the real one. It is what makes the
 * work possible while the real one is unavailable.
 */

import { mkdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { serveDist, routeSupabase, signIn as fixtureSignIn, launch } from './fixture-server.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'docs', 'baseline');

/** The five product views, in sidebar order. */
const VIEWS = ['home', 'projects', 'workflow', 'events', 'career'];

/** Phone / tablet / desktop, as specified by M-01. */
const WIDTHS = [390, 768, 1440];

const email = process.env.BASELINE_EMAIL;
const password = process.env.BASELINE_PASSWORD;
const useFixtures = !email || !password;

async function signInReal(page) {
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('#loginBtn');
  await page.waitForSelector('#app:not(.hidden)', { timeout: 30_000 });
  await page.waitForFunction(
    () => !(document.querySelector('#sync')?.textContent ?? '').includes('Syncing'),
    { timeout: 30_000 }
  );
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const { server, url } = await serveDist();
  const browser = await launch();
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
      if (useFixtures) await routeSupabase(page);

      await page.goto(url, { waitUntil: 'networkidle' });
      if (useFixtures) await fixtureSignIn(page);
      else await signInReal(page);

      for (const view of VIEWS) {
        await page.click(`[data-view="${view}"]`);
        await page.waitForSelector(`#${view}.active`, { timeout: 15_000 });
        await page.waitForTimeout(250); // let the view settle
        const file = join(OUT, `${view}-${width}.png`);
        await page.screenshot({ path: file, fullPage: true });
        written.push(file);
      }

      // The auth screen is part of the reference set too — M-15 checks that the
      // email and password fields stay LTR inside the RTL interface.
      const authCtx = await browser.newContext({
        viewport: { width, height: 900 },
        deviceScaleFactor: 2,
        locale: 'ar',
        reducedMotion: 'reduce'
      });
      const authPage = await authCtx.newPage();
      if (useFixtures) await routeSupabase(authPage);
      await authPage.goto(url, { waitUntil: 'networkidle' });
      const authFile = join(OUT, `auth-${width}.png`);
      await authPage.screenshot({ path: authFile, fullPage: true });
      written.push(authFile);
      await authCtx.close();

      await context.close();
    }
  } finally {
    await browser.close();
    server.close();
  }

  for (const f of written) console.warn('wrote', f.replace(ROOT + '/', ''));

  const expected = (VIEWS.length + 1) * WIDTHS.length;
  if (written.length !== expected) {
    console.error(`\nExpected ${expected} screenshots, wrote ${written.length}.`);
    process.exit(1);
  }

  console.warn(
    `\nM-01: ${written.length} screenshots captured from ` +
      (useFixtures ? 'the FIXTURE workspace.' : 'the REAL backend.')
  );
  if (useFixtures) {
    console.warn(
      'These prove layout and rendering, not that the queries match the live\n' +
        'schema. Re-run with BASELINE_EMAIL and BASELINE_PASSWORD against a real\n' +
        'account to confirm that, and to close M-01 properly.'
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
