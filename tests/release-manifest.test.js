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

const toMap = lines => new Map(lines.map(l => {
  const hash = l.slice(0, 64);
  const file = l.slice(66).trim();
  return [file, hash];
}));

test('release output matches its committed hash manifest exactly', () => {
  // Order-independent (path -> hash) comparison: macOS and GNU sort order files
  // differently, and order is not part of the guarantee.
  const actual = toMap(execFileSync(
    'sh', ['-c', 'find deploy-candle -type f | xargs shasum -a 256'],
    { cwd: root, encoding: 'utf8' }
  ).trim().split('\n').filter(Boolean));
  const expected = toMap(manifest);
  assert.deepEqual(Object.fromEntries([...actual].sort()), Object.fromEntries([...expected].sort()),
    'deploy-candle/ drifted from tests/deploy-candle.manifest.sha256 — if intentional, regenerate the manifest in a reviewed commit');
});

test('manifest covers the whole release output — no unlisted files', () => {
  const listed = new Set(manifest.map(l => l.split(/\s+/)[1]));
  const onDisk = execFileSync('find', ['deploy-candle', '-type', 'f'], { cwd: root, encoding: 'utf8' })
    .trim().split('\n').filter(Boolean);
  for (const f of onDisk) assert.ok(listed.has(f), `file on disk missing from manifest: ${f}`);
  for (const f of listed) assert.ok(fs.existsSync(path.join(root, f)), `manifest lists missing file: ${f}`);
});

test('artifact index.html is the reviewed release candidate, pinned by hash', () => {
  // Lineage (2026-09-25): live mcleevusydney.com/index.html = d3a99ff8…e71b
  // (verified by direct curl + sha256). This PR refines that approved artifact
  // (honest copy, real reel) without regenerating it; the reviewed candidate is
  // pinned here so ANY change after review — including accidental rebuilds or
  // media swaps — fails loudly before anything reaches production.
  const line = manifest.find(l => l.endsWith('deploy-candle/index.html'));
  assert.equal(line && line.split(/\s+/)[0], '3b7896973ed1f6f57dd7984a2efd0d675b658f4f45b216438b0973c3dc0ee2ce',
    'deploy-candle/index.html changed since review — regenerate the manifest in a reviewed commit or revert');
});

test('every media reference in the artifact resolves to a real file (missing-asset guard)', () => {
  // The artifact builds most slots from JS path strings, not HTML src attrs —
  // scan every media/… path token in the HTML and the photo manifest.
  const html = fs.readFileSync(path.join(root, 'deploy-candle', 'index.html'), 'utf8');
  const photos = fs.readFileSync(path.join(root, 'deploy-candle', 'photos.js'), 'utf8');
  const refs = [...new Set([...`${html}\n${photos}`.matchAll(/media\/[A-Za-z0-9_\-./]+\.(?:jpg|jpeg|png|webp|mp4|avif|svg)/g)].map(m => m[0]))];
  assert.ok(refs.length >= 5, 'expected several media references in the artifact, found ' + refs.length);
  for (const ref of refs) {
    assert.ok(fs.existsSync(path.join(root, 'deploy-candle', ref)), `artifact references missing asset: ${ref}`);
  }
});
