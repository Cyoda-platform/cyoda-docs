#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DIST_DIR = path.join(__dirname, '../dist');

/**
 * Create _headers file to prevent Surge.sh from corrupting Pagefind files
 */
async function createSurgeHeaders() {
  const headersContent = `# Prevent Surge.sh from compressing Pagefind binary files
/pagefind/*.wasm
  Content-Encoding: identity
  Content-Type: application/wasm

/pagefind/*.pf_meta
  Content-Encoding: identity
  Content-Type: application/octet-stream

/pagefind/*.pf_fragment
  Content-Encoding: identity
  Content-Type: application/octet-stream

/pagefind/*.pf_index
  Content-Encoding: identity
  Content-Type: application/octet-stream
`;

  const headersPath = path.join(DIST_DIR, '_headers');
  await fs.writeFile(headersPath, headersContent, 'utf-8');
  console.log('✅ Created _headers file to prevent Surge.sh compression issues');
}

/**
 * Main function
 */
async function main() {
  console.log('🔧 Creating Surge.sh headers for Pagefind...');
  await createSurgeHeaders();
  console.log('✅ Surge.sh Pagefind headers created!');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Error:', error);
    process.exit(1);
  });
}

export { createSurgeHeaders };
