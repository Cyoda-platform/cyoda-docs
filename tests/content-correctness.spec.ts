/**
 * Content-correctness lint.
 *
 * Locks in the cross-cutting sweeps from the 2026-04-22 correctness
 * review. Each pattern here was a real bug fixed during that pass;
 * this test ensures none of them silently regresses.
 *
 * If a new legitimate case ever needs to include one of these
 * patterns (e.g. quoting a broken example to contrast with the
 * correct form), either allow-list the specific file or restructure
 * the content to not reproduce the bad form verbatim.
 */
import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { glob } from 'glob';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Project is ESM, so __dirname isn't defined. Derive it from import.meta.
const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface Rule {
  pattern: RegExp;
  description: string;
  remedy: string;
}

const RULES: Rule[] = [
  {
    pattern: /\/api\/models\//,
    description: 'non-existent /api/models/... path scheme',
    remedy:
      'use /api/entity/{format}/{entityName}/{modelVersion} for entities, ' +
      'or /api/search/{direct|async}/{entityName}/{modelVersion} for search',
  },
  {
    // CYODA_STORAGE without the _BACKEND suffix. Negative lookahead.
    pattern: /\bCYODA_STORAGE(?!_BACKEND)(?!_[A-Z])/,
    description: 'bare CYODA_STORAGE — silently ignored at runtime',
    remedy: 'use CYODA_STORAGE_BACKEND (see app/config.go in cyoda-go)',
  },
  {
    pattern: /`?\bcyoda serve\b`?/,
    description: 'phantom `cyoda serve` subcommand',
    remedy:
      'the cyoda binary starts the server when invoked with no subcommand; ' +
      'recognised subcommands are --help, init, health, migrate',
  },
  {
    pattern: /\{searchId\}/,
    description: '{searchId} path parameter on async search',
    remedy: 'async search uses {jobId} per api/openapi.yaml',
  },
];

const CONTENT_GLOB = 'src/content/docs/**/*.{md,mdx}';
// Auto-generated schema pages are regenerated at build time and don't
// carry the drift patterns; excluding keeps the test fast.
const IGNORED_GLOBS = ['src/content/docs/reference/schemas/**'];

test.describe('Content correctness — cross-cutting sweep regression guards', () => {
  for (const rule of RULES) {
    test(`no "${rule.description}" in any content page`, async () => {
      const root = path.resolve(__dirname, '..');
      const files = await glob(CONTENT_GLOB, {
        cwd: root,
        absolute: true,
        ignore: IGNORED_GLOBS,
      });

      const offenders: { file: string; line: number; text: string }[] = [];
      for (const file of files) {
        const body = await readFile(file, 'utf-8');
        body.split('\n').forEach((line, idx) => {
          if (rule.pattern.test(line)) {
            offenders.push({
              file: path.relative(root, file),
              line: idx + 1,
              text: line.trim(),
            });
          }
        });
      }

      const message = offenders
        .map((o) => `  ${o.file}:${o.line}  ${o.text}`)
        .join('\n');
      expect(
        offenders,
        `Found ${offenders.length} occurrence(s) of the "${rule.description}" pattern.\n\n${message}\n\nRemedy: ${rule.remedy}`,
      ).toHaveLength(0);
    });
  }
});
