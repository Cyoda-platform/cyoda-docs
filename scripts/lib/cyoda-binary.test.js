import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { parsePinFile, detectPlatform } from './cyoda-binary.js';

function tmpVersionFile(version) {
  const file = path.join(os.tmpdir(), `cyoda-go-version-lib-${Date.now()}-${Math.random()}.json`);
  if (version !== undefined) fs.writeFileSync(file, JSON.stringify({ version }));
  return file;
}

// ---------------------------------------------------------------------------
// parsePinFile tests
// ---------------------------------------------------------------------------

test('parsePinFile: returns bare semver from valid pin file', () => {
  const vf = tmpVersionFile('0.6.2');
  assert.equal(parsePinFile(vf), '0.6.2');
  fs.rmSync(vf);
});

test('parsePinFile: throws InvalidVersionPin when version starts with "v"', () => {
  const vf = tmpVersionFile('v0.6.2');
  assert.throws(
    () => parsePinFile(vf),
    (e) => {
      assert.match(e.message, /InvalidVersionPin/);
      assert.match(e.message, /must not start with "v"/);
      return true;
    }
  );
  fs.rmSync(vf);
});

test('parsePinFile: throws InvalidVersionPin for missing file', () => {
  assert.throws(
    () => parsePinFile('/nonexistent/cyoda-go-version.json'),
    (e) => {
      assert.match(e.message, /InvalidVersionPin/);
      return true;
    }
  );
});

// ---------------------------------------------------------------------------
// detectPlatform tests
// ---------------------------------------------------------------------------

test('detectPlatform: darwin arm64 → darwin/arm64', () => {
  const result = detectPlatform({ platform: 'darwin', arch: 'arm64' });
  assert.deepEqual(result, { os: 'darwin', arch: 'arm64' });
});

test('detectPlatform: linux x64 → linux/amd64', () => {
  const result = detectPlatform({ platform: 'linux', arch: 'x64' });
  assert.deepEqual(result, { os: 'linux', arch: 'amd64' });
});

test('detectPlatform: win32 throws UnsupportedPlatform', () => {
  assert.throws(
    () => detectPlatform({ platform: 'win32', arch: 'x64' }),
    (e) => {
      assert.match(e.message, /UnsupportedPlatform/);
      return true;
    }
  );
});
