import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

import { run } from './generate-help-pages.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtureDir = path.resolve(__dirname, '..', 'tests', 'fixtures', 'help-pages');

function tmpDir(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), `${prefix}-`));
}

test('MissingFullData: full bundle file does not exist', async () => {
  const err = await run({
    fullDataPath: '/nonexistent/cyoda-help-full.json',
    docsHelpDir: tmpDir('docs'),
    publicHelpDir: tmpDir('public'),
    prefix: '',
  }).catch(e => e);
  assert.match(err.message, /MissingFullData/);
});
