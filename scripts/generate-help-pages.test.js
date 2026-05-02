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

function writeBundle(dir, bundle) {
  const file = path.join(dir, 'cyoda-help-full.json');
  fs.writeFileSync(file, JSON.stringify(bundle));
  return file;
}

test('MalformedTopic: topic field does not equal path.join(".")', async () => {
  const cacheDir = tmpDir('cache');
  const file = writeBundle(cacheDir, {
    pinnedVersion: 'test', schema: 1,
    topics: [{
      topic: 'wrong', path: ['config', 'database'],
      title: 'x', body: '# x\n', synopsis: '',
      sections: [], see_also: [], stability: 'stable', actions: [], children: [],
    }],
  });
  const err = await run({
    fullDataPath: file, docsHelpDir: tmpDir('docs'), publicHelpDir: tmpDir('public'), prefix: '',
  }).catch(e => e);
  assert.match(err.message, /MalformedTopic/);
  assert.match(err.message, /topic === path\.join/);
});

test('ReservedTopicSegment: first segment is a version pattern', async () => {
  const cacheDir = tmpDir('cache');
  const file = writeBundle(cacheDir, {
    pinnedVersion: 'test', schema: 1,
    topics: [{
      topic: 'v0.6', path: ['v0.6'],
      title: 'x', body: '# x\n', synopsis: '',
      sections: [], see_also: [], stability: 'stable', actions: [], children: [],
    }],
  });
  const err = await run({
    fullDataPath: file, docsHelpDir: tmpDir('docs'), publicHelpDir: tmpDir('public'), prefix: '',
  }).catch(e => e);
  assert.match(err.message, /ReservedTopicSegment/);
});

test('ReservedTopicSegment: first segment is "index"', async () => {
  const cacheDir = tmpDir('cache');
  const file = writeBundle(cacheDir, {
    pinnedVersion: 'test', schema: 1,
    topics: [{
      topic: 'index', path: ['index'],
      title: 'x', body: '# x\n', synopsis: '',
      sections: [], see_also: [], stability: 'stable', actions: [], children: [],
    }],
  });
  const err = await run({
    fullDataPath: file, docsHelpDir: tmpDir('docs'), publicHelpDir: tmpDir('public'), prefix: '',
  }).catch(e => e);
  assert.match(err.message, /ReservedTopicSegment/);
});

test('ReservedTopicSegment: first segment is "topic-tree"', async () => {
  const cacheDir = tmpDir('cache');
  const file = writeBundle(cacheDir, {
    pinnedVersion: 'test', schema: 1,
    topics: [{
      topic: 'topic-tree', path: ['topic-tree'],
      title: 'x', body: '# x\n', synopsis: '',
      sections: [], see_also: [], stability: 'stable', actions: [], children: [],
    }],
  });
  const err = await run({
    fullDataPath: file, docsHelpDir: tmpDir('docs'), publicHelpDir: tmpDir('public'), prefix: '',
  }).catch(e => e);
  assert.match(err.message, /ReservedTopicSegment/);
});

test('TopicSlugConflict: two distinct topics derive the same slug', async () => {
  const cacheDir = tmpDir('cache');
  // case-fold collision exercises slug normalization
  const file = writeBundle(cacheDir, {
    pinnedVersion: 'test', schema: 1,
    topics: [
      {
        topic: 'A.b', path: ['A', 'b'],
        title: 'first', body: '# first\n', synopsis: '',
        sections: [], see_also: [], stability: 'stable', actions: [], children: [],
      },
      {
        topic: 'a.B', path: ['a', 'B'],
        title: 'second', body: '# second\n', synopsis: '',
        sections: [], see_also: [], stability: 'stable', actions: [], children: [],
      },
    ],
  });
  const err = await run({
    fullDataPath: file, docsHelpDir: tmpDir('docs'), publicHelpDir: tmpDir('public'), prefix: '',
  }).catch(e => e);
  assert.match(err.message, /TopicSlugConflict/);
});

test('MalformedTopic: bundle.topics is not an array', async () => {
  const cacheDir = tmpDir('cache');
  const file = writeBundle(cacheDir, { pinnedVersion: 'test', schema: 1, topics: null });
  const err = await run({
    fullDataPath: file, docsHelpDir: tmpDir('docs'), publicHelpDir: tmpDir('public'), prefix: '',
  }).catch(e => e);
  assert.match(err.message, /MalformedTopic/);
  assert.match(err.message, /bundle\.topics is not an array/);
});
