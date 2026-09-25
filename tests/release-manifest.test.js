import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// R5 — release-output integrity: deploy-candle/ must match its committed
// sha256 manifest byte-for-byte. Any drift (regenerated HTML, swapped media,
// edited copy) fails here before CI ever renders it. Regenerating the manifest
// is a deliberate review act: run
//   find deploy-candle -type f | sort | xargs shasum -a 256 > tests/deploy-candle.manifest.sha256
// and show the diff in the PR.
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = path.join(root, 'tests', 'deploy-candle.manifest.sha256');
const manifest = fs.readFileSync(manifestPath, 'utf8').trim().split('\n');

test('release output matches its committed hash manifest exactly', () => {
  const actual = execFileSync(
    'sh', ['-c', 'find deploy-candle -type f | sort | xargs shasum -a 256'],
    { cwd: root, encoding: 'utf8' }
  ).trim().split('\n');
  assert.deepEqual(actual, manifest, 'deploy-candle/ drifted from tests/deploy-candle.manifest.sha256 — if intentional, regenerate the manifest in a reviewed commit');
});

test('manifest covers the whole release output — no unlisted files', () => {
  const listed = new Set(manifest.map(l => l.split(/\s+/)[1]));
  const onDisk = execFileSync('find', ['deploy-candle', '-type', 'f'], { cwd: root, encoding: 'utf8' })
    .trim().split('\n').filter(Boolean);
  for (const f of onDisk) assert.ok(listed.has(f), `file on disk missing from manifest: ${f}`);
  for (const f of listed) assert.ok(fs.existsSync(path.join(root, f)), `manifest lists missing file: ${f}`);
});

test('approved artifact index.html is the one byte-identical to live mcleevusydney.com', () => {
  // sha256 captured 2026-09-25 against https://mcleevusydney.com/ (curl, exact bytes).
  // This pins the release output to the approved public presentation; changing
  // the homepage must go through review with a regenerated manifest.
  const line = manifest.find(l => l.endsWith('deploy-candle/index.html'));
  assert.equal(line && line.split(/\s+/)[0], 'd3a99ff88343ad85e29d4de35da650c3397b877b8f449c5277272b668bc5d71b',
    'deploy-candle/index.html no longer matches the live-approved artifact hash');
});

test('every media reference in the artifact resolves to a real file (missing-asset guard)', () => {
  const html = fs.readFileSync(path.join(root, 'deploy-candle', 'index.html'), 'utf8');
  const refs = [...html.matchAll(/(?:src|href|poster)="(\/?media\/[^"]+)"/g)].map(m => m[1]);
  assert.ok(refs.length >= 2, 'expected the hero and scene media references in the artifact');
  for (const ref of refs) {
    const rel = ref.replace(/^\//, '');
    assert.ok(fs.existsSync(path.join(root, 'deploy-candle', rel)), `artifact references missing asset: ${ref}`);
  }
});
