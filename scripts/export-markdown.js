#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { glob } from 'glob';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONTENT_DIR = path.join(__dirname, '../src/content/docs');
const OUTPUT_DIR = path.join(__dirname, '../dist/markdown');

/**
 * Clean frontmatter for LLM consumption
 */
function cleanFrontmatter(content) {
  // Extract frontmatter
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  
  if (!frontmatterMatch) {
    return content;
  }
  
  const frontmatterText = frontmatterMatch[1];
  const bodyContent = frontmatterMatch[2];
  
  // Parse frontmatter to extract useful fields
  const titleMatch = frontmatterText.match(/^title:\s*(.+)$/m);
  const descriptionMatch = frontmatterText.match(/^description:\s*(.+)$/m);
  
  let cleanedContent = '';
  
  // Add title as H1 if it exists and isn't already in the content
  if (titleMatch) {
    const title = titleMatch[1].replace(/['"]/g, '');
    if (!bodyContent.trim().startsWith('# ')) {
      cleanedContent += `# ${title}\n\n`;
    }
  }
  
  // Add description as a paragraph if it exists
  if (descriptionMatch) {
    const description = descriptionMatch[1].replace(/['"]/g, '');
    cleanedContent += `${description}\n\n`;
  }
  
  // Add the main content
  cleanedContent += bodyContent;
  
  return cleanedContent;
}

/**
 * Process imports and components for better LLM readability
 */
function processContent(content) {
  // Remove import statements
  content = content.replace(/^import\s+.*$/gm, '');
  
  // Convert Image components to markdown images (basic conversion)
  content = content.replace(/<Image\s+src=\{([^}]+)\}\s+alt="([^"]*)"[^>]*\/>/g, '![$2]($1)');
  
  // Remove other JSX components but keep their content
  content = content.replace(/<(\w+)[^>]*>([\s\S]*?)<\/\1>/g, '$2');
  
  // Clean up extra whitespace
  content = content.replace(/\n\n\n+/g, '\n\n');
  
  return content.trim();
}

/**
 * Convert file path to URL path for markdown files
 */
function filePathToMarkdownUrl(filePath) {
  const relativePath = path.relative(CONTENT_DIR, filePath);
  let urlPath = relativePath
    .replace(/\\/g, '/') // Convert Windows paths
    .replace(/\.mdx?$/, '.md') // Ensure .md extension
    .replace(/\/index\.md$/, '.md') // Convert /index.md to .md
    .replace(/^index\.md$/, 'index.md'); // Handle root index
  
  return urlPath;
}

/**
 * Export markdown files
 */
async function exportMarkdownFiles() {
  console.log('🔍 Scanning documentation files for export...');
  
  // Find all markdown files
  const markdownFiles = await glob('**/*.{md,mdx}', {
    cwd: CONTENT_DIR,
    absolute: true
  });
  
  console.log(`📄 Found ${markdownFiles.length} documentation files to export`);
  
  // Ensure output directory exists
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  
  let exportedCount = 0;
  
  for (const filePath of markdownFiles) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Clean and process content
      let processedContent = cleanFrontmatter(content);
      processedContent = processContent(processedContent);
      
      // Determine output path
      const outputPath = filePathToMarkdownUrl(filePath);
      const fullOutputPath = path.join(OUTPUT_DIR, outputPath);
      
      // Ensure output directory exists
      await fs.mkdir(path.dirname(fullOutputPath), { recursive: true });
      
      // Write processed file
      await fs.writeFile(fullOutputPath, processedContent, 'utf-8');
      
      exportedCount++;
      console.log(`✅ Exported: ${outputPath}`);
      
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error.message);
    }
  }
  
  console.log(`🎉 Successfully exported ${exportedCount} markdown files to dist/markdown/`);
}

/**
 * Main function
 */
async function main() {
  try {
    console.log('🚀 Starting markdown export...');
    await exportMarkdownFiles();
  } catch (error) {
    console.error('❌ Error during markdown export:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { exportMarkdownFiles };
