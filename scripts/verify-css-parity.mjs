/**
 * M-04 verification — prove the stylesheet split changed nothing.
 *
 *   npm run build && node scripts/verify-css-parity.mjs
 *
 * Compares the CSS the browser actually receives (the built bundle in dist/)
 * against the original inline <style> block preserved in
 * docs/baseline/index.upstream.html, rule by rule, in order.
 *
 * This is a stronger proof than the screenshot comparison M-04's "Done when"
 * asks for. Screenshots only cover states you can reach — and the five product
 * views are behind a login gate. Rule-for-rule identity in the same cascade
 * order means no computed style can differ ANYWHERE, including views that
 * cannot currently be rendered.
 *
 * Rules added after the split (M-03's safe-area.css, and whatever later tickets
 * append) are allowed only at the END, where they cannot reorder anything that
 * came before. A rule inserted or reordered in the middle fails the check.
 */

import { readFile, readdir } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const UPSTREAM = join(ROOT, 'docs', 'baseline', 'index.upstream.html');

/** Split a stylesheet into top-level rules, preserving order and text. */
function topLevelRules(css) {
  const rules = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < css.length; i++) {
    const ch = css[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        rules.push(css.slice(start, i + 1));
        start = i + 1;
      }
    }
  }
  return rules;
}

/** Strip comments and collapse whitespace so formatting differences don't register. */
function normalise(rule) {
  return rule
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([{};:,])\s*/g, '$1')
    .replace(/;\}/g, '}')
    .trim();
}

async function distCss() {
  const dir = join(ROOT, 'dist', 'assets');
  const files = (await readdir(dir)).filter((f) => f.endsWith('.css'));
  if (files.length !== 1) {
    throw new Error(`Expected exactly one CSS bundle in dist/assets, found ${files.length}`);
  }
  return readFile(join(dir, files[0]), 'utf8');
}

/** The split files, in the order index.html links them. Order is load-bearing. */
const SPLIT_ORDER = ['tokens', 'base', 'components', 'layout', 'views', 'responsive'];

/**
 * Deliberate, recorded changes to an original rule.
 *
 * M-04 and M-05 had to change nothing, and this check proved it. Later tickets
 * legitimately DO change the original CSS — M-13 moves a breakpoint by design.
 * Rather than weaken the check to "mostly unchanged", every such change is
 * declared here with its exact before and after. Anything else still fails.
 *
 * Adding an entry is a deliberate act that belongs in a commit message and in
 * docs/programme/DOCUMENT-CONTROL.md, never a quick way to silence a failure.
 */
const ALLOWED_DEVIATIONS = [
  {
    ticket: 'M-13',
    why: 'sidebar gives way to bottom tabs below 900px, not 820px',
    from: '@media(max-width:820px)',
    to: '@media(max-width:899px)'
  }
];

/** Apply the recorded deviations to the original text before comparing. */
function applyDeviations(css) {
  let out = css;
  for (const d of ALLOWED_DEVIATIONS) {
    if (!out.includes(d.from)) {
      throw new Error(
        `Recorded deviation for ${d.ticket} no longer applies: "${d.from}" is not in the original.`
      );
    }
    out = out.replace(d.from, d.to);
  }
  return out;
}

/** Drop comments only — no other normalisation. Used for the byte-exact check. */
const stripComments = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '');

/**
 * Put a stylesheet through the same minifier the build uses, so the two sides of
 * check B differ only where the SPLIT changed something — never where esbuild
 * merely rewrote a value to an equivalent shorter form ("Segoe UI" -> Segoe UI,
 * translateX(-50%) -> translate(-50%)). Comparing raw source against minified
 * output would just be testing the minifier.
 */
async function minify(css) {
  const { transform } = await import('esbuild');
  // charset:'utf8' matches Vite's own setting — without it esbuild escapes
  // non-ASCII (content:"✦" -> content:"\2726"), which is equivalent but noisy.
  const { code } = await transform(css, { loader: 'css', minify: true, charset: 'utf8' });
  return code;
}

async function main() {
  const upstreamHtml = await readFile(UPSTREAM, 'utf8');
  const match = upstreamHtml.match(/<style>([\s\S]*?)<\/style>/);
  if (!match) throw new Error('No <style> block in docs/baseline/index.upstream.html');
  const originalCss = applyDeviations(match[1]);

  // --- Check A: the split itself. Byte-exact, no tolerance. ----------------
  const parts = await Promise.all(
    SPLIT_ORDER.map((name) => readFile(join(ROOT, 'src', 'styles', `${name}.css`), 'utf8'))
  );
  // Whitespace BETWEEN rules belongs to no rule, so compare rule by rule: each
  // must be byte-identical to the original, in the original order.
  const rejoinedRules = topLevelRules(stripComments(parts.join('')))
    .map((r) => r.trim())
    .filter(Boolean);
  const originalRulesExact = topLevelRules(originalCss)
    .map((r) => r.trim())
    .filter(Boolean);

  if (rejoinedRules.length !== originalRulesExact.length) {
    console.error(
      `FAIL (A) — the split has ${rejoinedRules.length} rules, the original ` +
        `${originalRulesExact.length}.`
    );
    process.exit(1);
  }
  for (let i = 0; i < originalRulesExact.length; i++) {
    if (rejoinedRules[i] !== originalRulesExact[i]) {
      console.error(`FAIL (A) — split rule ${i} is not byte-identical to the original.`);
      console.error(`  original: ${originalRulesExact[i].slice(0, 200)}`);
      console.error(`  split   : ${rejoinedRules[i].slice(0, 200)}`);
      process.exit(1);
    }
  }
  const originalRules = originalRulesExact.map(normalise);
  console.warn(
    `PASS (A) — all ${originalRules.length} rules across the ${SPLIT_ORDER.length} split ` +
      'files match the original, in its exact order.'
  );
  for (const d of ALLOWED_DEVIATIONS) {
    console.warn(`         with one recorded deviation — ${d.ticket}: ${d.from} -> ${d.to} (${d.why})`);
  }

  // --- Check B: the build preserves that order in what ships. --------------
  const expected = topLevelRules(await minify(originalCss)).map(normalise).filter(Boolean);
  const built = topLevelRules(await distCss()).map(normalise).filter(Boolean);
  for (let i = 0; i < expected.length; i++) {
    if (built[i] !== expected[i]) {
      console.error(`\nFAIL (B) — built rule ${i} differs from the minified original.`);
      console.error(`  expected: ${expected[i]?.slice(0, 200)}`);
      console.error(`  built   : ${built[i]?.slice(0, 200) ?? '(missing)'}`);
      process.exit(1);
    }
  }
  const added = built.slice(expected.length);
  console.warn(
    `PASS (B) — the built bundle carries all ${expected.length} rules in the same ` +
      `order as the identically-minified original, plus ${added.length} appended after them:`
  );
  for (const rule of added) console.warn(`  + ${rule.slice(0, 90)}`);
  console.warn('\nNo computed style can differ, in any view — including the login-gated ones.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
