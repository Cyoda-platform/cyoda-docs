#!/usr/bin/env node
// scripts/generate-llms-full.js — concatenate all exported markdown for agents

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MARKDOWN_DIR = path.join(__dirname, '../dist/markdown');
const OUTPUT_FILE = path.join(__dirname, '../dist/llms-full.txt');
const SITE_URL = 'https://docs.cyoda.net';

async function main() {
  const files = (await glob('**/*.md', { cwd: MARKDOWN_DIR, absolute: true })).sort();
  const parts = [`# Cyoda Documentation — full content\n\n` +
                 `Source: ${SITE_URL}\n` +
                 `Generated: ${new Date().toISOString()}\n\n---\n\n`];
  for (const file of files) {
    const rel = path.relative(MARKDOWN_DIR, file);
    const body = await fs.readFile(file, 'utf-8');
    parts.push(`## ${rel}\n\n${body.trim()}\n\n---\n\n`);
  }
  await fs.writeFile(OUTPUT_FILE, parts.join(''), 'utf-8');
  console.log(`✅ Generated llms-full.txt (${files.length} docs)`);
}

main().catch(e => { console.error(e); process.exit(1); });
