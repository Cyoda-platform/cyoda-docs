import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function err(cls, message) {
  return new Error(`${cls}: ${message}`);
}

const SEGMENT_RE = /^[A-Za-z0-9_-]+$/;
const VERSION_SEGMENT_RE = /^v\d+(\.\d+)?$/;
const RESERVED_FIRST_SEGMENTS = new Set(['index', 'topic-tree']);

function validateTopic(t) {
  if (!t || typeof t !== 'object') {
    throw err('MalformedTopic', `topic entry is not an object: ${JSON.stringify(t)}`);
  }
  if (!Array.isArray(t.path) || t.path.length === 0) {
    throw err('MalformedTopic', `topic missing non-empty path[]: ${JSON.stringify(t.path)}`);
  }
  for (const seg of t.path) {
    if (typeof seg !== 'string' || !SEGMENT_RE.test(seg)) {
      throw err('MalformedTopic', `path segment "${seg}" is not [A-Za-z0-9_-]+`);
    }
  }
  if (typeof t.topic !== 'string' || t.topic !== t.path.join('.')) {
    throw err(
      'MalformedTopic',
      `invariant violated: topic === path.join("."): topic=${JSON.stringify(t.topic)} path=${JSON.stringify(t.path)}`
    );
  }
  if (typeof t.title !== 'string' || t.title.length === 0) {
    throw err('MalformedTopic', `topic ${t.topic} missing title`);
  }
  if (typeof t.body !== 'string' || t.body.length === 0) {
    throw err('MalformedTopic', `topic ${t.topic} missing body`);
  }
}

function checkReservedSegment(t) {
  const first = t.path[0];
  if (VERSION_SEGMENT_RE.test(first) || RESERVED_FIRST_SEGMENTS.has(first)) {
    throw err(
      'ReservedTopicSegment',
      `topic ${t.topic} uses reserved first segment "${first}". Reserved: /^v\\d+(\\.\\d+)?$/, "index", "topic-tree".`
    );
  }
}

function slugFor(t) {
  return t.path.join('/').toLowerCase();
}

function yamlEscape(s) {
  // YAML double-quoted scalar: escape backslash, double-quote, and control chars.
  return '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n') + '"';
}

function truncateForDescription(s, max = 155) {
  if (s.length <= max) return s;
  return s.slice(0, max - 1) + '…';
}

function findByTopic(topics, dottedId) {
  return topics.find(t => t.topic === dottedId);
}

function renderPage(t, allTopics, pinnedPatch, urlPrefix) {
  const slugPath = t.path.join('/');
  const cliInvocation = ['cyoda', 'help', ...t.path].join(' ');
  const description = truncateForDescription(t.synopsis || t.title);

  const fm = [
    '---',
    `title: ${yamlEscape(t.title)}`,
    `description: ${yamlEscape(description)}`,
    'sidebar:',
    '  hidden: true',
    '---',
    '',
  ].join('\n');

  const aside = [
    ':::note[Canonical reference]',
    `This page mirrors \`${cliInvocation}\` from`,
    `**cyoda-go v${pinnedPatch}** (pinned). The binary you run is authoritative`,
    `for the version you run.`,
    ':::',
    '',
  ].join('\n');

  const sections = [];

  // Subtopics
  if (Array.isArray(t.children) && t.children.length > 0) {
    const lines = ['## Subtopics', ''];
    for (const childId of t.children) {
      const child = findByTopic(allTopics, childId);
      if (!child) continue;
      const childCli = ['cyoda', 'help', ...child.path].join(' ');
      const childUrl = `/${urlPrefix}help/${child.path.join('/')}/`.replace(/\/+/g, '/');
      lines.push(`- [\`${childCli}\`](${childUrl}) — ${child.synopsis || ''}`);
    }
    lines.push('');
    sections.push(lines.join('\n'));
  }

  // See also
  if (Array.isArray(t.see_also) && t.see_also.length > 0) {
    const lines = ['## See also', ''];
    for (const peerId of t.see_also) {
      const peer = findByTopic(allTopics, peerId);
      if (!peer) {
        // Reference to a topic that isn't in the bundle — render a non-link entry.
        lines.push(`- \`cyoda help ${peerId.replaceAll('.', ' ')}\``);
        continue;
      }
      const peerCli = ['cyoda', 'help', ...peer.path].join(' ');
      const peerUrl = `/${urlPrefix}help/${peer.path.join('/')}/`.replace(/\/+/g, '/');
      lines.push(`- [\`${peerCli}\`](${peerUrl}) — ${peer.synopsis || ''}`);
    }
    lines.push('');
    sections.push(lines.join('\n'));
  }

  // Raw formats
  const rawJson = `/${urlPrefix}help/${slugPath}.json`.replace(/\/+/g, '/');
  const rawMd = `/${urlPrefix}help/${slugPath}.md`.replace(/\/+/g, '/');
  sections.push([
    '## Raw formats',
    '',
    `- [\`${rawJson}\`](${rawJson}) — full descriptor (matches \`GET /help/{topic}\` envelope)`,
    `- [\`${rawMd}\`](${rawMd}) — body only`,
    '',
  ].join('\n'));

  // Body — emit verbatim, then a single blank-line separator before sections.
  const body = t.body.endsWith('\n') ? t.body : t.body + '\n';

  return [fm, aside, body, sections.join('\n')].join('\n');
}

function writeFileEnsuringDir(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}

function checkSlugConflicts(topics) {
  const seen = new Map();
  for (const t of topics) {
    const slug = slugFor(t);
    if (seen.has(slug)) {
      throw err(
        'TopicSlugConflict',
        `topics ${seen.get(slug)} and ${t.topic} both derive slug "${slug}"`
      );
    }
    seen.set(slug, t.topic);
  }
}

/**
 * Generate static help mirror artefacts from the cached full bundle.
 *
 * @param {object} opts
 * @param {string} opts.fullDataPath  path to .cyoda-cache/cyoda-help-full.json
 * @param {string} opts.docsHelpDir   src/content/docs/help/  (for per-topic .md pages)
 * @param {string} opts.publicHelpDir public/help/            (for .json/.md/manifest)
 * @param {string} [opts.prefix]      optional URL prefix segment, e.g. "v0.6/"
 *                                    (default empty for current frontline tree)
 */
export async function run({ fullDataPath, docsHelpDir, publicHelpDir, prefix = '' }) {
  // Self-enforce the contract: prefix is empty or ends with '/'.
  prefix = prefix && !prefix.endsWith('/') ? prefix + '/' : prefix;
  if (!fs.existsSync(fullDataPath)) {
    throw err(
      'MissingFullData',
      `${fullDataPath} not found. Run scripts/fetch-cyoda-help-index.js first to populate the cache.`
    );
  }
  const raw = fs.readFileSync(fullDataPath, 'utf8');
  const bundle = JSON.parse(raw);

  if (!Array.isArray(bundle.topics)) {
    throw err(
      'MalformedTopic',
      `bundle.topics is not an array (got ${typeof bundle.topics}). The cache file at ${fullDataPath} is malformed.`
    );
  }

  for (const t of bundle.topics) {
    // Check reserved segments first so a version-style segment (e.g. "v0.6")
    // gets ReservedTopicSegment rather than MalformedTopic (the dot fails SEGMENT_RE).
    if (Array.isArray(t.path) && t.path.length > 0) {
      checkReservedSegment(t);
    }
    validateTopic(t);
  }
  checkSlugConflicts(bundle.topics);

  const pinnedPatch = bundle.pinnedVersion;
  const urlPrefix = prefix; // empty by default

  for (const t of bundle.topics) {
    const pagePath = path.join(docsHelpDir, ...t.path) + '.md';
    writeFileEnsuringDir(pagePath, renderPage(t, bundle.topics, pinnedPatch, urlPrefix));
    const descPath = path.join(publicHelpDir, ...t.path) + '.json';
    writeFileEnsuringDir(descPath, JSON.stringify(t, null, 2) + '\n');
  }

  return { topicCount: bundle.topics.length };
}

const invokedDirectly = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (invokedDirectly) {
  const projectRoot = path.resolve(__dirname, '..');
  const fullDataPath = path.join(projectRoot, '.cyoda-cache', 'cyoda-help-full.json');
  const docsHelpDir = path.join(projectRoot, 'src', 'content', 'docs', 'help');
  const publicHelpDir = path.join(projectRoot, 'public', 'help');
  const prefix = (process.argv.find(a => a.startsWith('--prefix=')) || '--prefix=').slice('--prefix='.length);
  try {
    const result = await run({ fullDataPath, docsHelpDir, publicHelpDir, prefix });
    console.log(`✅ Generated help mirror (${result.topicCount} topics, prefix=${prefix || '<empty>'})`);
  } catch (e) {
    console.error(`\n❌ ${e.message}`);
    process.exit(1);
  }
}
