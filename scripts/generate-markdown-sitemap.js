#!/usr/bin/env node
// scripts/generate-markdown-sitemap.js — companion sitemap listing .md endpoints

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MARKDOWN_DIR = path.join(__dirname, '../dist/markdown');
const OUTPUT = path.join(__dirname, '../dist/sitemap-markdown.xml');
const SITE = 'https://docs.cyoda.net';

async function main() {
  const files = (await glob('**/*.md', { cwd: MARKDOWN_DIR })).sort();
  const entries = files.map(f => `  <url><loc>${SITE}/markdown/${f}</loc></url>`).join('\n');
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries}
</urlset>`;
  await fs.writeFile(OUTPUT, xml, 'utf-8');
  console.log(`✅ Generated sitemap-markdown.xml (${files.length} urls)`);
}

main().catch(e => { console.error(e); process.exit(1); });
