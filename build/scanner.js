/**
 * scanner.js — Scan existing HTML files and extract tool metadata into data/tools.json
 *
 * Usage: node build/scanner.js
 *
 * This script reads all HTML files in the project root (recursively),
 * classifies each as a "tool page", "redirect", "index page", or "other",
 * and extracts metadata from tool pages to produce data/tools.json.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'data', 'tools.json');

// Directories to skip
const SKIP_DIRS = new Set([
  'node_modules', '.git', '.github', 'build', 'data', 'dist',
  'src', 'css', 'js', 'images', 'plan', 'test', 'tmp'
]);

// Files to skip (non-tool pages)
const SKIP_FILES = new Set([
  'index.html', '404.html'
]);

// ── Category mapping from sidebar section headings ──
// Maps the <h3> text in the sidebar to category IDs
const SECTION_TO_CATEGORY = {
  'Hash': 'hash',
  'Cryptography': 'crypto',
  'Encoding': 'encoding',
  'Format': 'formatter',
  'Convert': 'converter',
  'Others': 'utility'
};

// Maps sidebar <summary> text to subcategory IDs
const SUMMARY_TO_SUBCATEGORY = {
  'CRC': 'crc',
  'MD': 'md',
  'SHA1': 'sha1',
  'SHA2': 'sha2',
  'SHA2-512': 'sha2-512',
  'SHA3': 'sha3',
  'Keccak': 'keccak',
  'SHAKE': 'shake',
  'cSHAKE': 'cshake',
  'KMAC': 'kmac',
  'RIPEMD': 'ripemd',
  'BLAKE': 'blake',
  'AES': 'aes',
  'DES': 'des',
  'Triple DES': 'triple-des',
  'RC4': 'rc4',
  'ECDSA': 'ecdsa',
  'RSA': 'rsa',
  'Hex (Base16)': 'hex',
  'Base32': 'base32',
  'Base58': 'base58',
  'Base64': 'base64',
  'HTML': 'html',
  'URL': 'url',
  'JSON': 'json',
  'XML': 'xml',
  'Case': 'case',
  'Others': 'other'
};

/**
 * Recursively find all .html files
 */
function findHtmlFiles(dir, relBase = '') {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.join(relBase, entry.name).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      results.push(...findHtmlFiles(fullPath, relPath));
    } else if (entry.isFile() && entry.name.endsWith('.html')) {
      results.push({ fullPath, relPath });
    }
  }
  return results;
}

/**
 * Detect if file is a redirect stub (< 500 bytes, contains meta refresh or location.href)
 */
function isRedirect(content, size) {
  if (size > 600) return false;
  return content.includes('meta http-equiv="refresh"') ||
    content.includes('window.location.href');
}

/**
 * Extract redirect target from redirect stub
 */
function extractRedirectTarget(content) {
  // Try meta refresh
  let match = content.match(/content="0;\s*url=([^"]+)"/);
  if (match) return match[1];
  // Try JS redirect
  match = content.match(/window\.location\.href\s*=\s*'([^']+)'/);
  if (match) return match[1];
  return null;
}

/**
 * Extract metadata from a full tool page HTML
 */
function extractToolMeta(content, relPath) {
  const meta = {};

  // Title: from <title>
  const titleMatch = content.match(/<title>([^<]+)<\/title>/);
  if (titleMatch) {
    meta.title = titleMatch[1].replace(/\s*-\s*Online Tools\s*$/, '').trim();
  }

  // Description: from <meta name="description">
  const descMatch = content.match(/<meta\s+name="description"\s+content="([^"]*)"/);
  if (descMatch) {
    meta.description = descMatch[1].trim();
  }

  // Keywords: from <meta name="keywords">
  const kwMatch = content.match(/<meta\s+name="keywords"\s+content="([^"]*)"/);
  if (kwMatch) {
    meta.keywords = kwMatch[1].split(',').map(k => k.trim().toLowerCase()).filter(Boolean);
  }

  // Canonical URL: from <link rel="canonical">
  const canonMatch = content.match(/<link\s+rel="canonical"\s+href="([^"]*)"/);
  if (canonMatch) {
    meta.canonical = canonMatch[1].trim();
  }

  // H1: from <h1>
  const h1Match = content.match(/<h1>([^<]+)<\/h1>/);
  if (h1Match) {
    meta.h1 = h1Match[1].trim();
  }

  // Active category/subcategory: sidebar section with class="active"
  // The active <details> is marked with class="active" open
  // Its parent section's <h3> gives the category
  // The <summary> of the active <details> gives the subcategory
  const sidebarSections = content.match(/<div class="section">[\s\S]*?<\/div>\s*(?=<div class="section">|<\/div>\s*<\/div>\s*<\/div>)/g);
  if (sidebarSections) {
    for (const section of sidebarSections) {
      if (section.includes('class="active"')) {
        const h3Match = section.match(/<h3>([^<]+)<\/h3>/);
        if (h3Match) {
          meta.sidebarSection = h3Match[1].trim();
          meta.category = SECTION_TO_CATEGORY[meta.sidebarSection] || meta.sidebarSection.toLowerCase();
        }
        const summaryMatch = section.match(/<details\s+class="active"[^>]*>\s*<summary>([^<]+)<\/summary>/);
        if (summaryMatch) {
          meta.sidebarGroup = summaryMatch[1].trim();
          meta.subcategory = SUMMARY_TO_SUBCATEGORY[meta.sidebarGroup] || meta.sidebarGroup.toLowerCase();
        }
        break;
      }
    }
  }

  // Detect template type
  meta.hasFileInput = content.includes('class="droppable-zone') || content.includes('droppable-file');
  meta.hasMonacoEditor = content.includes('data-toggle="monacoEditor"');
  meta.hasDataLanguage = false;
  const langMatch = content.match(/data-language="([^"]+)"/);
  if (langMatch) {
    meta.dataLanguage = langMatch[1];
    meta.hasDataLanguage = true;
  }
  meta.hasInputEncoding = content.includes('id="input-type"');
  meta.hasOutputEncoding = content.includes('id="output-type"');
  meta.hasHmac = content.includes('id="hmac-enabled"') || content.includes('id="hmac"');
  meta.hasShareLink = content.includes('id="share-link"');
  meta.hasSwap = content.includes('id="swap"') || content.includes('ot.swap') || content.includes('window.swap');
  meta.hasValidateResult = content.includes('id="validate-result"');
  meta.hasDownload = content.includes('id="download-image"') || content.includes('id="download-public"');
  meta.hasFileType = content.includes('id="file-type"');
  meta.hasPrettyDisplay = content.includes('id="pretty-display"');

  // Detect primary action label
  const actionMatch = content.match(/<a\s+class="btn"\s+id="execute">([^<]+)<\/a>/);
  if (actionMatch) {
    meta.actionLabel = actionMatch[1].trim();
  }

  // Extract tool-specific scripts (delayScripts src)
  const scriptMatches = content.matchAll(/src:\s*"(js\/[^"]+)"/g);
  meta.scripts = [];
  for (const m of scriptMatches) {
    const src = m[1].replace(/\?v=\d+/, '');
    // Skip common scripts loaded on every page
    if (!['js/clipboard.min.js', 'js/encoding.js', 'js/monaco-editor.js',
      'js/file-loader.js', 'js/droppable-file.js', 'js/file.js',
      'js/download.js', 'js/data-uri-download-builder.js',
      'js/url-blob.js', 'js/hmac.js', 'js/hmac.umd.min.js'].includes(src)) {
      meta.scripts.push(src);
    }
  }

  // Extract method assignment (the core algorithm function)
  const methodMatch = content.match(/window\.method\s*=\s*([^;]+);/);
  if (methodMatch) {
    meta.methodAssignment = methodMatch[1].trim();
  }

  return meta;
}

/**
 * Generate a clean tool ID from the file path
 */
function generateId(relPath) {
  return relPath
    .replace(/\/index\.html$/, '')
    .replace(/\.html$/, '')
    .replace(/[_\/]/g, '-')
    .replace(/--+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase();
}

/**
 * Determine the URL path for the tool (relative to /online-tools/)
 */
function determinePath(relPath) {
  // If it's a directory index, the URL is the directory
  if (relPath.endsWith('/index.html')) {
    return relPath.replace('/index.html', '/');
  }
  // Otherwise it's the file itself
  return relPath;
}

/**
 * Determine template type from extracted metadata
 */
function determineTemplate(meta) {
  if (meta.hasValidateResult) return 'tool-validator';
  if (meta.hasFileInput && !meta.hasInputEncoding && meta.category === 'hash') return 'tool-file';
  if (meta.hasFileInput && meta.hasInputEncoding) return 'tool-crypto';
  if (meta.hasFileInput && !meta.hasInputEncoding) return 'tool-file';
  if (meta.hasDataLanguage) return 'tool-editor';
  if (meta.hasInputEncoding && meta.hasOutputEncoding) return 'tool-text';
  if (meta.hasInputEncoding) return 'tool-text';
  return 'tool-text';
}

/**
 * Generate tags from keywords and title
 */
function generateTags(meta) {
  const tags = new Set();
  if (meta.keywords) {
    meta.keywords.forEach(k => {
      if (k && k !== 'online' && k !== 'free') tags.add(k);
    });
  }
  // Add title words as tags
  if (meta.title) {
    meta.title.toLowerCase().split(/[\s/\-_]+/).forEach(w => {
      if (w.length > 1 && w !== 'file' && w !== 'online' && w !== 'tools') {
        tags.add(w);
      }
    });
  }
  return Array.from(tags);
}

/**
 * Determine if tool is popular (heuristic: well-known algorithms)
 */
function isPopular(id) {
  const popular = new Set([
    'md5', 'sha256', 'sha1', 'sha512', 'sha3-256',
    'base64-encode', 'base64-decode',
    'json-formatter', 'json-minifier', 'json-validator',
    'url-encode', 'url-decode',
    'aes-encrypt', 'aes-decrypt',
    'qr-code-generator'
  ]);
  return popular.has(id);
}

// ────────────────────────────────────────────────────────────────
// Main
// ────────────────────────────────────────────────────────────────

function main() {
  console.log('Scanning HTML files in:', ROOT);
  const htmlFiles = findHtmlFiles(ROOT);
  console.log(`Found ${htmlFiles.length} HTML files\n`);

  const tools = [];
  const redirects = [];
  const skipped = [];
  let order = 1;

  for (const { fullPath, relPath } of htmlFiles) {
    const content = fs.readFileSync(fullPath, 'utf-8');
    const stats = fs.statSync(fullPath);

    // Skip non-tool pages (only root-level index.html and 404.html)
    if (relPath === '404.html' || relPath === 'index.html') {
      skipped.push({ relPath, reason: 'skip-list' });
      continue;
    }

    // Check for redirect
    if (isRedirect(content, stats.size)) {
      const target = extractRedirectTarget(content);
      redirects.push({ relPath, target });
      continue;
    }

    // Extract metadata
    const meta = extractToolMeta(content, relPath);

    // Generate tool entry
    const id = generateId(relPath);
    const toolPath = determinePath(relPath);
    const template = determineTemplate(meta);
    const tags = generateTags(meta);

    // Determine modes
    const modes = ['single'];
    if (meta.hasFileInput && meta.category !== 'crypto') {
      // File tools are a separate entry, not a mode
    }

    const tool = {
      id,
      title: meta.h1 || meta.title || id,
      slug: id,
      path: toolPath,
      category: meta.category || 'utility',
      subcategory: meta.subcategory || 'other',
      description: meta.description || '',
      shortDescription: (meta.title || id) + ' tool',
      tags,
      aliases: [],
      icon: meta.category === 'hash' ? 'hash' :
        meta.category === 'crypto' ? 'lock' :
          meta.category === 'encoding' ? 'code' :
            meta.category === 'formatter' ? 'braces' :
              meta.category === 'converter' ? 'arrow-right-left' : 'wrench',
      template,
      modes,
      scripts: meta.scripts || [],
      settings: {
        inputEncoding: meta.hasInputEncoding || false,
        outputEncoding: meta.hasOutputEncoding || false,
        hmac: meta.hasHmac || false,
        autoUpdate: true,
        rememberInput: true,
        fileInput: meta.hasFileInput || false,
        monacoEditor: meta.hasMonacoEditor || false
      },
      actionLabel: meta.actionLabel || 'Execute',
      relatedTools: [],
      popular: isPopular(id),
      featured: false,
      addedAt: '2024-01-01',
      order: order++
    };

    // Add swap target info
    if (meta.hasSwap) {
      tool.swapTarget = null; // Will be filled manually
    }

    tools.push(tool);
  }

  // ── Post-process: infer relatedTools ──
  for (const tool of tools) {
    const related = tools
      .filter(t =>
        t.id !== tool.id &&
        t.category === tool.category &&
        t.subcategory === tool.subcategory
      )
      .map(t => t.id)
      .slice(0, 6);
    tool.relatedTools = related;
  }

  // ── Write output ──
  const outputDir = path.dirname(OUTPUT);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT, JSON.stringify(tools, null, 2), 'utf-8');
  fs.writeFileSync(path.join(outputDir, 'redirects.json'), JSON.stringify(redirects, null, 2), 'utf-8');

  // ── Report ──
  console.log('=== Scanner Report ===\n');
  console.log(`Tools extracted: ${tools.length}`);
  console.log(`Redirects found: ${redirects.length}`);
  console.log(`Skipped files: ${skipped.length}`);
  console.log(`\nOutput written to: ${OUTPUT}\n`);

  // Category breakdown
  const catCounts = {};
  for (const t of tools) {
    catCounts[t.category] = (catCounts[t.category] || 0) + 1;
  }
  console.log('Category breakdown:');
  for (const [cat, count] of Object.entries(catCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat}: ${count} tools`);
  }

  // Template breakdown
  const tmplCounts = {};
  for (const t of tools) {
    tmplCounts[t.template] = (tmplCounts[t.template] || 0) + 1;
  }
  console.log('\nTemplate breakdown:');
  for (const [tmpl, count] of Object.entries(tmplCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${tmpl}: ${count} tools`);
  }

  // Redirects
  if (redirects.length > 0) {
    console.log('\nRedirects:');
    for (const r of redirects) {
      console.log(`  ${r.relPath} → ${r.target}`);
    }
  }

  console.log('\n✓ Scanner complete');
}

main();
