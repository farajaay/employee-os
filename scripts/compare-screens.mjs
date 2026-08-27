/**
 * Pixel-compare two directories of screenshots.
 *
 *   node scripts/compare-screens.mjs <before-dir> <after-dir>
 *
 * PNG bytes are not deterministic, so `cmp` is useless here — this decodes both
 * images in Chromium and compares ImageData. Exits non-zero if any pair differs
 * in dimensions or in any pixel beyond the tolerance.
 *
 * Used to prove that a refactor changed nothing on screen: M-04 (CSS split),
 * M-05 (JS split), and later as the guard for M-13/M-14/M-15.
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { chromium } from '@playwright/test';

const [beforeDir, afterDir] = process.argv.slice(2);
if (!beforeDir || !afterDir) {
  console.error('usage: node scripts/compare-screens.mjs <before-dir> <after-dir>');
  process.exit(2);
}

/** Per-channel difference below this counts as encoder noise, not a change. */
const TOLERANCE = 0;

async function dataUrl(path) {
  return `data:image/png;base64,${(await readFile(path)).toString('base64')}`;
}

async function main() {
  const names = (await readdir(beforeDir)).filter((f) => f.endsWith('.png')).sort();
  if (names.length === 0) {
    console.error(`No PNGs in ${beforeDir}`);
    process.exit(2);
  }

  const browser = await chromium.launch(
    process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
      : {}
  );
  const page = await browser.newPage();
  let failures = 0;

  try {
    for (const name of names) {
      const [a, b] = await Promise.all([
        dataUrl(join(beforeDir, name)),
        dataUrl(join(afterDir, name))
      ]);

      const result = await page.evaluate(
        async ([srcA, srcB, tol]) => {
          const load = (src) =>
            new Promise((res, rej) => {
              const img = new Image();
              img.onload = () => res(img);
              img.onerror = rej;
              img.src = src;
            });
          const [ia, ib] = await Promise.all([load(srcA), load(srcB)]);
          if (ia.width !== ib.width || ia.height !== ib.height) {
            return { sizeMismatch: `${ia.width}x${ia.height} vs ${ib.width}x${ib.height}` };
          }
          const draw = (img) => {
            const c = new OffscreenCanvas(img.width, img.height);
            const ctx = c.getContext('2d');
            ctx.drawImage(img, 0, 0);
            return ctx.getImageData(0, 0, img.width, img.height).data;
          };
          const da = draw(ia);
          const db = draw(ib);
          let differing = 0;
          let maxDelta = 0;
          for (let i = 0; i < da.length; i += 4) {
            let worst = 0;
            for (let c = 0; c < 4; c++) worst = Math.max(worst, Math.abs(da[i + c] - db[i + c]));
            if (worst > tol) differing++;
            maxDelta = Math.max(maxDelta, worst);
          }
          return { differing, maxDelta, total: da.length / 4, w: ia.width, h: ia.height };
        },
        [a, b, TOLERANCE]
      );

      if (result.sizeMismatch) {
        console.error(`${basename(name)}  SIZE MISMATCH  ${result.sizeMismatch}`);
        failures++;
      } else if (result.differing > 0) {
        const pct = ((result.differing / result.total) * 100).toFixed(4);
        console.error(
          `${basename(name)}  DIFFERS  ${result.differing}/${result.total} px (${pct}%), ` +
            `max channel delta ${result.maxDelta}`
        );
        failures++;
      } else {
        console.warn(
          `${basename(name)}  identical  ${result.w}x${result.h}, ${result.total} px`
        );
      }
    }
  } finally {
    await browser.close();
  }

  if (failures > 0) {
    console.error(`\n${failures} of ${names.length} screenshots changed.`);
    process.exit(1);
  }
  console.warn(`\nAll ${names.length} screenshots are pixel-identical.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
