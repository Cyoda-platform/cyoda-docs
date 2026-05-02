import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function err(cls, message) {
  return new Error(`${cls}: ${message}`);
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
  if (!fs.existsSync(fullDataPath)) {
    throw err(
      'MissingFullData',
      `${fullDataPath} not found. Run scripts/fetch-cyoda-help-index.js first to populate the cache.`
    );
  }
  const raw = fs.readFileSync(fullDataPath, 'utf8');
  const bundle = JSON.parse(raw);
  // Stages will be added in subsequent tasks.
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
