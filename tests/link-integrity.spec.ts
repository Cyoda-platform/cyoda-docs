import { test, expect } from '@playwright/test';
import { glob } from 'glob';
import fs from 'fs/promises';
import path from 'path';

test.describe('Internal link integrity', () => {
  test('no broken internal links in rendered HTML', async () => {
    const files = await glob('dist/**/*.html');
    const failures: string[] = [];

    for (const file of files) {
      const html = await fs.readFile(file, 'utf-8');
      const hrefs = [...html.matchAll(/href="(\/[^"#?]*)"/g)].map((m) => m[1]);

      for (const link of new Set(hrefs)) {
        // Markdown mirror and OpenAPI spec are served as static assets,
        // not routed pages. Schemas zip is a download target. Anchors and
        // query strings are already stripped by the regex.
        if (
          link.startsWith('/markdown/') ||
          link.startsWith('/openapi/') ||
          link.startsWith('/_astro/') ||
          link === '/robots.txt' ||
          link === '/llms.txt' ||
          link === '/llms-full.txt' ||
          link === '/schemas.zip' ||
          link === '/sitemap-index.xml' ||
          link === '/sitemap-0.xml' ||
          link === '/sitemap-markdown.xml'
        ) {
          continue;
        }

        const asIndex = path.join('dist', link, 'index.html');
        const asFile = path.join('dist', link.replace(/\/$/, '') + '.html');
        const asExact = path.join('dist', link);

        try {
          await fs.access(asIndex);
          continue;
        } catch {}
        try {
          await fs.access(asFile);
          continue;
        } catch {}
        try {
          await fs.access(asExact);
          continue;
        } catch {}

        failures.push(`${path.relative('dist', file)} → ${link}`);
      }
    }

    const summary = failures.slice(0, 30).join('\n');
    expect(failures, `Broken internal links:\n${summary}`).toEqual([]);
  });
});
