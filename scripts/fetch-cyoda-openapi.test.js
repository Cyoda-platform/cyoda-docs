import { test } from 'node:test';
import assert from 'node:assert/strict';

import { detectPlatform, parsePinFile } from './fetch-cyoda-openapi.js';

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

function tmpVersionFile(version) {
  const file = path.join(os.tmpdir(), `cyoda-go-version-openapi-${Date.now()}-${Math.random()}.json`);
  if (version !== undefined) fs.writeFileSync(file, JSON.stringify({ version }));
  return file;
}

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

test('parsePinFile: returns bare semver from valid pin file', () => {
  const versionFile = tmpVersionFile('0.6.1');
  assert.equal(parsePinFile(versionFile), '0.6.1');
  fs.rmSync(versionFile);
});
