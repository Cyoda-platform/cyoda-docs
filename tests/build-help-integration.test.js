// tests/build-help-integration.test.js
// Spawns `astro build` with a temporary dangling-topic fixture page;
// asserts the build fails fast with the DanglingHelpTopic class.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const fixturePath = path.join(
  projectRoot,
  'src',
  'content',
  'docs',
  'ftb-integration-fixture.mdx'
);

const FIXTURE_CONTENT = `---
title: "FromTheBinary integration fixture"
description: "Temporary fixture used by build-help-integration.test.js; should never ship."
sidebar:
  hidden: true
---

import FromTheBinary from '../../components/FromTheBinary.astro';

<FromTheBinary topic="this-topic-absolutely-does-not-exist" />
`;

test('astro build fails with DanglingHelpTopic when FromTheBinary gets a bad topic', { timeout: 180_000 }, async (t) => {
  // Pre-condition: the index artefact must exist; the build runs the fetcher anyway,
  // but we still require a clean starting state for the fixture.
  assert.ok(!fs.existsSync(fixturePath), 'stale fixture from a previous run; clean it up manually');

  // Use a temp outDir so this deliberately-failing build does not clobber dist/.
  const tempOutDir = fs.mkdtempSync(path.join(os.tmpdir(), 'astro-integration-test-'));
  fs.writeFileSync(fixturePath, FIXTURE_CONTENT);
  t.after(() => {
    if (fs.existsSync(fixturePath)) fs.rmSync(fixturePath);
    fs.rmSync(tempOutDir, { recursive: true, force: true });
  });

  const result = spawnSync('npx', ['astro', 'build', '--outDir', tempOutDir], {
    cwd: projectRoot,
    encoding: 'utf8',
    env: { ...process.env, CI: '1', ASTRO_TELEMETRY_DISABLED: '1' },
  });

  assert.notEqual(result.status, 0, 'expected astro build to fail, but it exited 0');
  const combined = (result.stdout || '') + (result.stderr || '');
  assert.match(combined, /DanglingHelpTopic/, 'expected DanglingHelpTopic in build output');
  assert.match(
    combined,
    /this-topic-absolutely-does-not-exist/,
    'expected the bad topic string in build output'
  );
});
