/**
 * M-10 — generate the PWA icon set from the existing "F" monogram.
 *
 *   node scripts/generate-icons.mjs
 *
 * The monogram is rendered with the SAME CSS the app uses — italic, the
 * `--serif` stack, `--rose` on `--bg`, with the gold `✦` — so the icons are
 * derived from the mark rather than redrawn.
 *
 * FONT FIDELITY. The stack is `Didot, "Bodoni 72", Georgia, serif`. On a machine
 * without those (any Linux CI box, this container) the browser falls back to a
 * generic serif and the glyph is NOT the brand letterform. Icons committed from
 * such a machine are PROVISIONAL. Regenerate on macOS, where Didot and Bodoni 72
 * ship with the OS, before any store submission — the icon is baked into store
 * listings and installed home screens, where it is expensive to change.
 *
 * The script reports which family actually rendered, so a provisional set is
 * never mistaken for a final one.
 *
 * See also decision D-4 in docs/programme/DOCUMENT-CONTROL.md: whether the
 * letter stays `F` at all is still open.
 */

import { mkdir, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public', 'icons');

const BG = '#fbf7f2';
const ROSE = '#a46b75';
const GOLD = '#c5a06b';
const SERIF = 'Didot, "Bodoni 72", Georgia, serif';

/**
 * `maskable` icons are cropped to a platform-chosen shape, so the glyph must sit
 * inside the inner 80% "safe zone" — hence the smaller glyph ratio.
 */
const ICONS = [
  { file: 'icon-192.png', size: 192, glyph: 0.58, star: true },
  { file: 'icon-512.png', size: 512, glyph: 0.58, star: true },
  { file: 'icon-maskable-512.png', size: 512, glyph: 0.42, star: false },
  { file: 'apple-touch-icon.png', size: 180, glyph: 0.58, star: true },
  { file: 'icon-1024.png', size: 1024, glyph: 0.58, star: true }
];

const page = (size, glyph, star) => `<!doctype html>
<meta charset="utf-8">
<style>
  html,body{margin:0;width:${size}px;height:${size}px;background:${BG};overflow:hidden}
  .wrap{width:100%;height:100%;display:flex;align-items:center;justify-content:center}
  .monogram{
    font:italic ${Math.round(size * glyph)}px/1 ${SERIF};
    color:${ROSE};position:relative;width:max-content;
  }
  .monogram:after{
    content:${star ? '"✦"' : '""'};position:absolute;
    font:${Math.round(size * glyph * 0.25)}px/1 Georgia, serif;color:${GOLD};
    right:${-Math.round(size * glyph * 0.19)}px;top:${Math.round(size * glyph * 0.03)}px;
  }
</style>
<div class="wrap"><div class="monogram" id="m">F</div></div>`;

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch(
    process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
      : {}
  );

  let renderedFamily = null;
  try {
    for (const { file, size, glyph, star } of ICONS) {
      const ctx = await browser.newContext({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
      const p = await ctx.newPage();
      await p.setContent(page(size, glyph, star), { waitUntil: 'load' });
      await p.evaluate(() => document.fonts.ready);

      renderedFamily ??= await p.evaluate(() => {
        // document.fonts.check() is NOT usable here: for a family the system does
        // not have, it still reports true, because it does not distinguish a real
        // match from silent fallback. Measure instead — a family that is absent
        // renders identically to the generic it is paired with.
        const measure = (family) => {
          const c = document.createElement('canvas').getContext('2d');
          c.font = `italic 96px ${family}`;
          return c.measureText('FFMWfj').width;
        };
        const isPresent = (name) => {
          for (const generic of ['monospace', 'sans-serif', 'serif']) {
            if (measure(`"${name}", ${generic}`) !== measure(generic)) return true;
          }
          return false;
        };
        const el = document.getElementById('m');
        const requested = getComputedStyle(el)
          .fontFamily.split(',')
          .map((f) => f.trim().replace(/^["']|["']$/g, ''));
        for (const f of requested) {
          if (f === 'serif' || f === 'sans-serif' || f === 'monospace') break;
          if (isPresent(f)) return f;
        }
        return 'generic serif fallback';
      });

      await p.screenshot({ path: join(OUT, file), omitBackground: false });
      await ctx.close();
      console.warn(`wrote public/icons/${file}  ${size}x${size}`);
    }
  } finally {
    await browser.close();
  }

  const brandFonts = ['Didot', 'Bodoni 72'];
  const provisional = !brandFonts.includes(renderedFamily);
  console.warn(`\nrendered with: ${renderedFamily}`);
  if (provisional) {
    console.warn(
      'PROVISIONAL — this machine has neither Didot nor Bodoni 72, so the glyph is a\n' +
        'fallback serif, not the brand letterform. Regenerate on macOS before any store\n' +
        'submission. See D-4 in docs/programme/DOCUMENT-CONTROL.md.'
    );
  } else {
    console.warn('Brand letterform rendered. These icons are submission-quality.');
  }

  await writeFile(
    join(OUT, 'GENERATED.md'),
    `# Generated icons\n\nProduced by \`node scripts/generate-icons.mjs\`. Do not hand-edit — regenerate.\n\n` +
      `Last generated with font family: **${renderedFamily}**\n\n` +
      (provisional
        ? `> **PROVISIONAL.** Neither Didot nor Bodoni 72 was available, so the glyph is a\n` +
          `> fallback serif rather than the brand letterform. Regenerate on macOS before\n` +
          `> any store submission — the icon is baked into store listings and installed\n` +
          `> home screens. See D-4: whether the letter stays \`F\` is also still open.\n`
        : `These were rendered with the brand letterform and are submission-quality.\n`),
    'utf8'
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
