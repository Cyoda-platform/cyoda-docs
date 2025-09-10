#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const SITE_URL = 'https://docs.cyoda.net';
const CONTENT_DIR = path.join(__dirname, '../src/content/docs');
const OUTPUT_FILE = path.join(__dirname, '../dist/llms.txt');

/**
 * Extract frontmatter and content from a markdown file
 */
async function parseMarkdownFile(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');

  // Extract frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  let frontmatter = {};

  if (frontmatterMatch) {
    const frontmatterText = frontmatterMatch[1];
    // Simple YAML parsing for title and description
    const titleMatch = frontmatterText.match(/^title:\s*(.+)$/m);
    const descriptionMatch = frontmatterText.match(/^description:\s*(.+)$/m);

    if (titleMatch) frontmatter.title = titleMatch[1].replace(/['"]/g, '');
    if (descriptionMatch) frontmatter.description = descriptionMatch[1].replace(/['"]/g, '');
  }

  return frontmatter;
}

/**
 * Convert file path to markdown URL path
 */
function filePathToMarkdownUrl(filePath) {
  const relativePath = path.relative(CONTENT_DIR, filePath);
  let urlPath = relativePath
    .replace(/\\/g, '/') // Convert Windows paths
    .replace(/\.mdx?$/, '.md') // Ensure .md extension
    .replace(/\/index\.md$/, '.md') // Convert /index.md to .md
    .replace(/^index\.md$/, 'index.md'); // Handle root index

  return `/markdown/${urlPath}`;
}

/**
 * Get the display name for a section based on directory name
 */
function getSectionName(dirName) {
  const sectionNames = {
    'getting-started': 'Getting Started',
    'guides': 'Guides',
    'concepts': 'Concepts',
    'architecture': 'Architecture',
    'platform': 'Platform'
  };

  return sectionNames[dirName] || dirName.charAt(0).toUpperCase() + dirName.slice(1);
}

/**
 * Generate the llms.txt content
 */
async function generateLlmsTxt() {
  console.log('🔍 Scanning documentation files...');

  // Find all markdown files
  const markdownFiles = await glob('**/*.{md,mdx}', {
    cwd: CONTENT_DIR,
    absolute: true
  });

  console.log(`📄 Found ${markdownFiles.length} documentation files`);

  // Parse files and organize by section
  const sections = {};
  const rootPages = [];

  for (const filePath of markdownFiles) {
    const frontmatter = await parseMarkdownFile(filePath);
    const urlPath = filePathToMarkdownUrl(filePath);
    const relativePath = path.relative(CONTENT_DIR, filePath);
    const pathParts = relativePath.split(path.sep);

    const pageInfo = {
      title: frontmatter.title || path.basename(filePath, path.extname(filePath)),
      description: frontmatter.description || '',
      url: `${SITE_URL}${urlPath}`,
      urlPath: urlPath
    };

    // Organize by section (top-level directory)
    if (pathParts.length > 1 && pathParts[0] !== 'index.md' && pathParts[0] !== 'index.mdx') {
      const sectionDir = pathParts[0];
      const sectionName = getSectionName(sectionDir);

      if (!sections[sectionName]) {
        sections[sectionName] = [];
      }
      sections[sectionName].push(pageInfo);
    } else {
      // Root level pages
      if (!pageInfo.urlPath.endsWith('/index.md')) { // Skip the main index
        rootPages.push(pageInfo);
      }
    }
  }

  // Generate llms.txt content
  let content = '# Cyoda Documentation\n\n';

  // Add root pages first if any
  if (rootPages.length > 0) {
    content += '## Documentation\n\n';
    for (const page of rootPages) {
      const description = page.description ? `: ${page.description}` : '';
      content += `- [${page.title}](${page.url})${description}\n`;
    }
    content += '\n';
  }

  // Add sections
  const sectionOrder = ['Getting Started', 'Guides', 'Concepts', 'Architecture', 'Platform'];

  for (const sectionName of sectionOrder) {
    if (sections[sectionName] && sections[sectionName].length > 0) {
      content += `## ${sectionName}\n\n`;

      // Sort pages within section by title
      sections[sectionName].sort((a, b) => a.title.localeCompare(b.title));

      for (const page of sections[sectionName]) {
        const description = page.description ? `: ${page.description}` : '';
        content += `- [${page.title}](${page.url})${description}\n`;
      }
      content += '\n';
    }
  }

  // Add any remaining sections not in the predefined order
  for (const [sectionName, pages] of Object.entries(sections)) {
    if (!sectionOrder.includes(sectionName) && pages.length > 0) {
      content += `## ${sectionName}\n\n`;

      pages.sort((a, b) => a.title.localeCompare(b.title));

      for (const page of pages) {
        const description = page.description ? `: ${page.description}` : '';
        content += `- [${page.title}](${page.url})${description}\n`;
      }
      content += '\n';
    }
  }

  return content.trim();
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('🚀 Generating llms.txt...');

    // Ensure dist directory exists
    const distDir = path.dirname(OUTPUT_FILE);
    await fs.mkdir(distDir, { recursive: true });

    // Generate content
    const content = await generateLlmsTxt();

    // Write file
    await fs.writeFile(OUTPUT_FILE, content, 'utf-8');

    console.log(`✅ Generated llms.txt with ${content.split('\n').length} lines`);
    console.log(`📍 Output: ${OUTPUT_FILE}`);

  } catch (error) {
    console.error('❌ Error generating llms.txt:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { generateLlmsTxt };
