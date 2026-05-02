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

test('writes per-topic .md page with frontmatter, aside, body, and Raw formats', async () => {
  const fixturePath = path.join(fixtureDir, 'help-full.minimal.json');
  const docsHelpDir = tmpDir('docs');
  const publicHelpDir = tmpDir('public');
  await run({
    fullDataPath: fixturePath, docsHelpDir, publicHelpDir, prefix: '',
  });
  const pagePath = path.join(docsHelpDir, 'cli.md');
  const content = fs.readFileSync(pagePath, 'utf8');

  // frontmatter
  assert.match(content, /^---\n/);
  assert.match(content, /\ntitle: "cli — the cyoda command-line interface"\n/);
  assert.match(content, /\nsidebar:\n {2}hidden: true\n/);

  // canonical-reference aside
  assert.match(content, /:::note\[Canonical reference\]/);
  assert.match(content, /cyoda help cli/);
  assert.match(content, /cyoda-go v[\d.]+/);
  assert.match(content, /:::/);

  // body verbatim
  assert.match(content, /## NAME/);
  assert.match(content, /cli — the cyoda command-line interface\./);

  // raw formats section
  assert.match(content, /## Raw formats/);
  assert.match(content, /\/help\/cli\.json/);
  assert.match(content, /\/help\/cli\.md/);
});

test('multi-segment topic produces nested .md page with Subtopics and See also', async () => {
  const fixturePath = path.join(fixtureDir, 'help-full.with-children.json');
  const docsHelpDir = tmpDir('docs');
  const publicHelpDir = tmpDir('public');
  await run({
    fullDataPath: fixturePath, docsHelpDir, publicHelpDir, prefix: '',
  });

  // Parent page has Subtopics
  const parent = fs.readFileSync(path.join(docsHelpDir, 'config.md'), 'utf8');
  assert.match(parent, /## Subtopics/);
  assert.match(parent, /cyoda help config database/);

  // Child page is at config/database.md and has See also
  const child = fs.readFileSync(path.join(docsHelpDir, 'config', 'database.md'), 'utf8');
  assert.match(child, /## See also/);
  assert.match(child, /cyoda help config/);
  assert.match(child, /cyoda help run/);
});

test('prefix without trailing slash is normalized', async () => {
  const fixturePath = path.join(fixtureDir, 'help-full.minimal.json');
  const docsHelpDir = tmpDir('docs');
  const publicHelpDir = tmpDir('public');
  await run({
    fullDataPath: fixturePath, docsHelpDir, publicHelpDir, prefix: 'v0.6',  // missing trailing slash
  });
  const page = fs.readFileSync(path.join(docsHelpDir, 'cli.md'), 'utf8');
  // No malformed URL like /v0.6help/...
  assert.ok(!/\/v0\.6help\//.test(page), 'prefix without trailing slash produced malformed URL');
  // Normalized form appears.
  assert.match(page, /\/v0\.6\/help\/cli\.json/);
});

test('writes per-topic JSON descriptor with live-API shape', async () => {
  const fixturePath = path.join(fixtureDir, 'help-full.with-children.json');
  const docsHelpDir = tmpDir('docs');
  const publicHelpDir = tmpDir('public');
  await run({
    fullDataPath: fixturePath, docsHelpDir, publicHelpDir, prefix: '',
  });
  const desc = JSON.parse(fs.readFileSync(path.join(publicHelpDir, 'config', 'database.json'), 'utf8'));
  assert.equal(desc.topic, 'config.database');
  assert.deepEqual(desc.path, ['config', 'database']);
  assert.equal(desc.title, 'database configuration');
  assert.equal(typeof desc.body, 'string');
  assert.ok(desc.body.length > 0);
  assert.deepEqual(desc.see_also, ['config', 'run']);
  assert.equal(desc.stability, 'stable');
  assert.deepEqual(desc.children, []);
});

test('writes per-topic raw markdown body, no frontmatter, byte-equal to body', async () => {
  const fixturePath = path.join(fixtureDir, 'help-full.minimal.json');
  const docsHelpDir = tmpDir('docs');
  const publicHelpDir = tmpDir('public');
  await run({
    fullDataPath: fixturePath, docsHelpDir, publicHelpDir, prefix: '',
  });
  const raw = fs.readFileSync(path.join(publicHelpDir, 'cli.md'), 'utf8');
  const expected = JSON.parse(fs.readFileSync(fixturePath, 'utf8')).topics[0].body;
  assert.equal(raw, expected.endsWith('\n') ? expected : expected + '\n');
  // No frontmatter.
  assert.ok(!raw.startsWith('---'));
});
