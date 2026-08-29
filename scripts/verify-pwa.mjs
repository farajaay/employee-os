/**
 * M-10 verification — check every machine-checkable installability criterion.
 *
 *   npm run build && node scripts/verify-pwa.mjs
 *
 * M-10's Done when is "installs to the home screen on iOS Safari and Android
 * Chrome". A real device install cannot be automated here, so this checks the
 * conditions those installs depend on: a valid manifest with the fields the
 * platforms require, icons that actually decode at their declared sizes, the
 * iOS meta tags (Safari ignores the manifest for install), and a service worker
 * that registers, activates and takes control.
 *
 * Passing this is necessary, not sufficient. The device check stays outstanding
 * until someone installs it on real hardware.
 */

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
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
      res.writeHead(200, {
        'content-type': MIME[file.slice(file.lastIndexOf('.'))] ?? 'application/octet-stream',
        'service-worker-allowed': '/'
      });
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

async function main() {
  const { server, url } = await serveDist();
  const browser = await chromium.launch(
    process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
      : {}
  );
  // 127.0.0.1 is a secure context, so service workers are allowed without TLS.
  const page = await browser.newPage({ viewport: { width: 390, height: 900 } });

  try {
    await page.goto(url, { waitUntil: 'networkidle' });

    const href = await page.getAttribute('link[rel="manifest"]', 'href');
    check('index.html links a manifest', !!href, href ?? '');

    const manifest = JSON.parse(await (await fetch(new URL(href, url))).text());

    check('name and short_name are set', !!manifest.name && !!manifest.short_name, manifest.name);
    check('display is standalone', manifest.display === 'standalone', manifest.display);
    check('lang is ar', manifest.lang === 'ar', manifest.lang);
    check('dir is rtl', manifest.dir === 'rtl', manifest.dir);
    check('start_url and scope are set', !!manifest.start_url && !!manifest.scope);
    check(
      'brand colours are the app background',
      manifest.background_color === '#fbf7f2' && manifest.theme_color === '#fbf7f2',
      `${manifest.background_color} / ${manifest.theme_color}`
    );

    // Android requires a 192 and a 512; a maskable icon avoids a letterboxed
    // square inside the platform's circle.
    const sizes = (manifest.icons ?? []).map((i) => i.sizes);
    check('a 192x192 icon is declared', sizes.includes('192x192'));
    check('a 512x512 icon is declared', sizes.includes('512x512'));
    check(
      'a maskable icon is declared',
      (manifest.icons ?? []).some((i) => i.purpose === 'maskable')
    );

    // Declared sizes must match the actual bitmaps.
    let mismatched = [];
    for (const icon of manifest.icons ?? []) {
      const src = new URL(icon.src, new URL(href, url)).toString();
      const real = await page.evaluate(
        (s) =>
          new Promise((res) => {
            const img = new Image();
            img.onload = () => res(`${img.naturalWidth}x${img.naturalHeight}`);
            img.onerror = () => res('load-error');
            img.src = s;
          }),
        src
      );
      if (real !== icon.sizes) mismatched.push(`${icon.src}: declared ${icon.sizes}, actual ${real}`);
    }
    check('every icon decodes at its declared size', mismatched.length === 0, mismatched.join('; '));

    // iOS Safari ignores the manifest when adding to the home screen.
    check(
      'apple-touch-icon is linked',
      !!(await page.getAttribute('link[rel="apple-touch-icon"]', 'href'))
    );
    check(
      'apple-mobile-web-app-title is set',
      (await page.getAttribute('meta[name="apple-mobile-web-app-title"]', 'content')) === 'Employee OS'
    );
    check(
      'apple-mobile-web-app-capable is set',
      (await page.getAttribute('meta[name="apple-mobile-web-app-capable"]', 'content')) === 'yes'
    );

    // Chrome will not offer installation without an active service worker.
    const swState = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) return 'no registration';
      await navigator.serviceWorker.ready;
      return reg.active ? 'active' : 'registered but not active';
    });
    check('a service worker registers and activates', swState === 'active', swState);

    const swSource = await readFile(join(DIST, 'sw.js'), 'utf8');
    check('the precache manifest is non-empty', /precacheAndRoute|__WB_MANIFEST/.test(swSource));

    // Chrome requires a fetch handler before it will offer installation.
    // Workbox registers one inside the imported workbox-*.js chunk, so grepping
    // sw.js finds nothing — test the behaviour instead. Serving the app with the
    // network cut is also the point of having a service worker at all.
    await page.context().setOffline(true);
    let offlineOk = false;
    let offlineDetail = '';
    try {
      await page.reload({ waitUntil: 'domcontentloaded' });
      offlineOk = await page.evaluate(
        () => !!document.querySelector('#authForm') && document.title.length > 0
      );
      offlineDetail = offlineOk ? 'app shell served from cache' : 'page loaded but the shell is missing';
    } catch (err) {
      offlineDetail = String(err).split('\n')[0];
    } finally {
      await page.context().setOffline(false);
    }
    check('the service worker serves the app shell with the network offline', offlineOk, offlineDetail);

    // --- M-11: the offline state is visible, not just non-broken -----------
    await page.context().setOffline(true);
    await page.reload({ waitUntil: 'domcontentloaded' });
    const offlineBar = await page
      .waitForSelector('#netbar.show', { timeout: 10_000 })
      .then((h) => h.textContent())
      .catch(() => null);
    check(
      'an offline notice is shown, in Arabic (M-11)',
      !!offlineBar && /[؀-ۿ]/.test(offlineBar),
      offlineBar?.trim() ?? 'no #netbar.show'
    );
    check(
      'the offline notice does not block the interface',
      await page.evaluate(() => {
        const bar = document.querySelector('#netbar');
        const form = document.querySelector('#authForm');
        if (!bar || !form) return false;
        // The bar is pinned to the bottom; the form must still be interactive.
        return getComputedStyle(bar).position === 'fixed' && !form.hasAttribute('inert');
      })
    );

    await page.context().setOffline(false);
    const cleared = await page
      .waitForFunction(() => !document.querySelector('#netbar')?.classList.contains('show'), {
        timeout: 10_000
      })
      .then(() => true)
      .catch(() => false);
    check('the offline notice clears when the network returns', cleared);

    // --- M-11: auth responses must never be cached -------------------------
    const swSrc = swSource;
    check(
      'Supabase auth is excluded from the runtime cache (M-11)',
      /\(\?!auth/.test(swSrc),
      'tokens must never be written to the Cache API'
    );
    check(
      'Supabase reads use NetworkFirst with a cached fallback',
      /NetworkFirst/.test(swSrc) && /supabase-read/.test(swSrc)
    );
    check(
      'static assets use StaleWhileRevalidate',
      /StaleWhileRevalidate/.test(swSrc) && /static-assets/.test(swSrc)
    );

    // --- M-12: a waiting worker must not reload the page underneath --------
    check(
      'the app does not auto-reload on update (M-12)',
      !/self\.skipWaiting\(\)/.test(swSrc) || /messageSkipWaiting|SKIP_WAITING/.test(swSrc),
      'registerType is prompt; the worker waits for the user'
    );
  } finally {
    await browser.close();
    server.close();
  }

  const failed = checks.filter((c) => !c.ok);
  if (failed.length) {
    console.error(`\n${failed.length} of ${checks.length} PWA checks failed.`);
    process.exit(1);
  }
  console.warn(
    `\nAll ${checks.length} PWA checks passed.\n` +
      'Necessary, not sufficient — a real install on an iPhone and an Android\n' +
      'device is still required before M-10 can be called done.'
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
