/**
 * TR-9 — measured performance budgets, the CI-enforceable half.
 * Fails the build when the shipped payload outgrows what low-end tablets
 * comfortably parse. The on-device half (frame drops, audio) is scripted
 * in docs/perf-budgets.md with the in-player diagnostics overlay (?diag=1).
 *
 * Run after `npm run build`:  node scripts/check-budgets.mjs
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');

const BUDGETS = {
  jsGzipKB: 70, // whole app, all lessons, all music
  cssGzipKB: 10,
  htmlGzipKB: 3,
  totalRawKB: 400, // includes icons; no lesson ever fetches beyond this
};

let failed = false;
const check = (label, actualKB, budgetKB) => {
  const ok = actualKB <= budgetKB;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}: ${actualKB.toFixed(1)} KB (budget ${budgetKB} KB)`);
  if (!ok) failed = true;
};

const files = [];
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else files.push(p);
  }
};
walk(dist);

const gzipKB = (paths) =>
  paths.reduce((sum, p) => sum + gzipSync(readFileSync(p)).length, 0) / 1024;
const rawKB = files.reduce((sum, p) => sum + statSync(p).size, 0) / 1024;

check('JS (gzip)', gzipKB(files.filter((f) => f.endsWith('.js'))), BUDGETS.jsGzipKB);
check('CSS (gzip)', gzipKB(files.filter((f) => f.endsWith('.css'))), BUDGETS.cssGzipKB);
check('HTML (gzip)', gzipKB(files.filter((f) => f.endsWith('.html'))), BUDGETS.htmlGzipKB);
check('Total payload (raw)', rawKB, BUDGETS.totalRawKB);

if (failed) {
  console.error('\nBudget exceeded (TR-9). Trim before shipping — lessons must never stutter on low-end tablets.');
  process.exit(1);
}
console.log('\nAll performance budgets met.');
