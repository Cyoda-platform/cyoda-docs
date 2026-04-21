#!/usr/bin/env node
// scripts/sync-vendored.mjs — materialise vendored artefacts per VENDOR_MODE

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const MODE = process.env.VENDOR_MODE || 'local';
const PIN = (await fs.readFile(path.join(ROOT, 'vendored/CYODA_GO_VERSION'), 'utf-8')).trim();

async function syncLocal() {
  // In local mode, vendored/schemas/ should already contain the schemas.
  // Mirror into src/schemas/ for the existing generate-schema-pages.js to consume.
  const srcDir = path.join(ROOT, 'vendored/schemas');
  const dstDir = path.join(ROOT, 'src/schemas');
  try {
    await fs.access(srcDir);
  } catch {
    console.log('ℹ️  vendored/schemas/ does not yet exist — skipping schema sync');
    return;
  }
  await fs.rm(dstDir, { recursive: true, force: true });
  await fs.cp(srcDir, dstDir, { recursive: true });
  console.log(`✅ Synced vendored/schemas → src/schemas (pin: ${PIN})`);
}

async function main() {
  console.log(`🔄 sync-vendored MODE=${MODE} PIN=${PIN}`);
  switch (MODE) {
    case 'local':
      await syncLocal();
      break;
    case 'release':
    case 'url':
      console.error(`❌ MODE=${MODE} is not implemented yet. File an issue if you need it.`);
      process.exit(1);
    default:
      console.error(`❌ Unknown VENDOR_MODE: ${MODE}`);
      process.exit(1);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
