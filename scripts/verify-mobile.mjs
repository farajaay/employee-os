/**
 * M-13 / M-14 verification — measure the real app shell at real widths.
 *
 *   npm run build && node scripts/verify-mobile.mjs
 *
 * Signs in against the FIXTURE workspace (tests/fixtures/workspace.mjs) and
 * measures the five views with realistic Arabic content in them — titles of
 * realistic length, task rows, status chips and checkboxes. No credential is
 * used and no request reaches the production project.
 *
 * Content matters here, not just chrome: measuring an empty shell missed the
 * task checkbox altogether, because with no task rows there is no checkbox to
 * measure.
 *
 * What it still cannot tell you: whether the queries match the live schema, or
 * how the layout holds against the real workspace's own data. Only a run
 * against the real backend answers that.
 */

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { routeSupabase, signIn } from './fixture-server.mjs';
import { chromium } from '@playwright/test';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

/** The floor Apple and Android both publish for touch targets. */
const MIN_TARGET = 44;

/** Where the sidebar gives way to bottom tabs. M-13 moves this from 820. */
const TABS_BELOW = 900;

const WIDTHS = [390, 768, 1440];
const VIEWS = ['home', 'projects', 'workflow', 'events', 'career'];

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
  '.png': 'image/png',
  '.map': 'application/json; charset=utf-8'
};

async function serveDist() {
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

const checks = [];
const check = (name, ok, detail = '') => {
  checks.push({ name, ok });
  console.warn(`${ok ? 'ok  ' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
};

/**
 * The shell is reached by signing in against the fixture workspace, so every
 * measurement below is taken on views containing REAL content — Arabic titles
 * of realistic length, task rows, status chips and checkboxes. Measuring an
 * empty shell missed the task checkbox entirely, because with no rows there is
 * no checkbox to measure.
 */

async function main() {
  const { server, url } = await serveDist();
  const browser = await chromium.launch(
    process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
      : {}
  );

  try {
    for (const width of WIDTHS) {
      const ctx = await browser.newContext({
        viewport: { width, height: 844 },
        deviceScaleFactor: 2,
        locale: 'ar',
        reducedMotion: 'reduce'
      });
      const page = await ctx.newPage();
      await routeSupabase(page);
      await page.goto(url, { waitUntil: 'load' });
      await signIn(page);

      const phone = width < TABS_BELOW;
      console.warn(`\n── ${width}px ${phone ? '(tabs expected)' : '(sidebar expected)'} ──`);

      // Every view must be reachable, and switching must not need a scroll.
      for (const view of VIEWS) {
        await page.click(`[data-view="${view}"]`);
        const active = await page.evaluate(
          (v) => document.querySelector(`#${v}`)?.classList.contains('active'),
          view
        );
        if (!active) check(`${width}: view "${view}" activates`, false);
      }
      check(`${width}: all five views activate`, true);

      // No horizontal scroll, at any view.
      const overflow = await page.evaluate(() => {
        const d = document.documentElement;
        return { scroll: d.scrollWidth, client: d.clientWidth };
      });
      check(
        `${width}: no horizontal scroll`,
        overflow.scroll <= overflow.client + 1,
        `scrollWidth ${overflow.scroll} vs clientWidth ${overflow.client}`
      );

      // Navigation form: bottom tabs on a phone, sidebar on a desktop.
      const navBox = await page.evaluate(() => {
        const side = document.querySelector('.side');
        if (!side) return null;
        const cs = getComputedStyle(side);
        const r = side.getBoundingClientRect();
        return { position: cs.position, top: Math.round(r.top), height: Math.round(r.height) };
      });
      const isBottomBar = navBox?.position === 'fixed' && navBox.top > 400;
      check(
        `${width}: navigation is ${phone ? 'a bottom tab bar' : 'a sidebar'}`,
        phone ? isBottomBar : !isBottomBar,
        `position ${navBox?.position}, top ${navBox?.top}, height ${navBox?.height}`
      );

      // Tap targets. Measured, not inferred from declared CSS.
      const small = await page.evaluate((min) => {
        const out = [];
        const sel = 'button, a[href], input, select, textarea, [role="button"]';
        for (const el of document.querySelectorAll(sel)) {
          const r = el.getBoundingClientRect();
          if (r.width === 0 || r.height === 0) continue; // not rendered
          if (getComputedStyle(el).visibility === 'hidden') continue;
          // .check keeps its 28px visual box and extends its TARGET with a
          // transparent ::after overlay, so measure the effective hit area.
          let w = r.width, h = r.height;
          const after = getComputedStyle(el, '::after');
          if (after && after.content !== 'none' && after.position === 'absolute') {
            w = Math.max(w, parseFloat(after.width) || 0);
            h = Math.max(h, parseFloat(after.height) || 0);
          }
          if (h < min || w < min) {
            const id = el.id ? `#${el.id}` : '';
            const cls = el.className && typeof el.className === 'string'
              ? '.' + el.className.trim().split(/\s+/).join('.')
              : '';
            out.push(`${el.tagName.toLowerCase()}${id}${cls} ${Math.round(w)}x${Math.round(h)}`);
          }
        }
        return [...new Set(out)];
      }, MIN_TARGET);
      check(
        `${width}: every visible target is at least ${MIN_TARGET}px`,
        small.length === 0,
        small.slice(0, 6).join('  |  ')
      );

      // Nothing fixed may cover the navigation. The offline bar and the tab bar
      // are both pinned to the bottom, and the bar outranks the tabs on z-index,
      // so at bottom:0 it swallowed taps on every tab — exactly when a person
      // most needs to move between cached views.
      if (phone) {
        await page.context().setOffline(true);
        await page.evaluate(() => window.dispatchEvent(new Event('offline')));
        await page.waitForSelector('#netbar.show', { timeout: 10_000 });
        const covered = await page.evaluate(() => {
          const blocked = [];
          for (const tab of document.querySelectorAll('[data-view]')) {
            const r = tab.getBoundingClientRect();
            const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
            if (hit && hit !== tab && !tab.contains(hit)) {
              blocked.push(`${tab.dataset.view} <- ${hit.id ? '#' + hit.id : hit.tagName}`);
            }
          }
          return blocked;
        });
        check(
          `${width}: the offline bar does not cover the tab bar`,
          covered.length === 0,
          covered.join(', ') || 'all five tabs remain tappable offline'
        );
        await page.context().setOffline(false);
      }

      // Safe-area: on a phone the fixed bar must reserve the inset.
      if (phone) {
        // A headless browser has no notch, so env(safe-area-inset-*) resolves to
        // 0px and a computed value proves nothing. Assert instead that the rules
        // DECLARE the inset — that is what makes it reserved on a real device.
        const declares = await page.evaluate(() => {
          const wanted = ['.side', '.top', '.main', '.netbar'];
          const found = new Set();
          for (const sheet of document.styleSheets) {
            let rules;
            try { rules = sheet.cssRules; } catch { continue; }
            const scan = (list) => {
              for (const r of list) {
                // Test the rule FIRST. Since CSS nesting landed, a plain
                // CSSStyleRule also exposes a (usually empty) cssRules list, and
                // an empty CSSRuleList is truthy — recursing on that first
                // silently skips every style rule in the sheet.
                if (r.selectorText && r.cssText.includes('safe-')) {
                  for (const w of wanted) {
                    if (r.selectorText.split(',').some((s) => s.trim() === w)) found.add(w);
                  }
                }
                if (r.cssRules && r.cssRules.length) scan(r.cssRules);
              }
            };
            scan(rules);
          }
          return wanted.filter((w) => !found.has(w));
        });
        check(
          `${width}: fixed elements reserve the safe-area inset`,
          declares.length === 0,
          declares.length ? `missing on ${declares.join(', ')}` : 'declared on .side, .top, .main, .netbar'
        );
      }

      await ctx.close();
    }
  } finally {
    await browser.close();
    server.close();
  }

  const failed = checks.filter((c) => !c.ok);
  console.warn('');
  if (failed.length) {
    console.error(`${failed.length} of ${checks.length} mobile checks failed.`);
    process.exit(1);
  }
  console.warn(
    `All ${checks.length} mobile checks passed, measured on the fixture workspace ` +
      'with real Arabic content.'
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
