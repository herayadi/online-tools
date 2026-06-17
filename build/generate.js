/**
 * build/generate.js - Phase 2 Static Site Generator
 */

const fs = require('fs-extra');
const path = require('path');
const nunjucks = require('nunjucks');

const ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(ROOT, 'src', 'views');
const DATA_DIR = path.join(ROOT, 'data');
const DIST_DIR = path.join(ROOT, 'dist');

// 1. Data Loading
console.log('Loading data...');
const siteConfig = fs.readJSONSync(path.join(DATA_DIR, 'site.config.json'));
const tools = fs.readJSONSync(path.join(DATA_DIR, 'tools.json'));
const categories = fs.readJSONSync(path.join(DATA_DIR, 'categories.json'));
const collections = fs.readJSONSync(path.join(DATA_DIR, 'collections.json'));
const redirects = fs.readJSONSync(path.join(DATA_DIR, 'redirects.json'));

// 2. Validation
console.log('Validating data...');
const toolIds = new Set();
const toolPaths = new Set();
const toolsById = {};

tools.forEach(t => {
  if (toolIds.has(t.id)) throw new Error(`Duplicate tool ID: ${t.id}`);
  if (toolPaths.has(t.path)) throw new Error(`Duplicate tool path: ${t.path}`);
  if (!t.template) throw new Error(`Missing template for tool: ${t.id}`);
  
  toolIds.add(t.id);
  toolPaths.add(t.path);
  toolsById[t.id] = t;
});

// Group tools by category and subcategory for the sidebar
const toolsByCategory = {};
categories.forEach(cat => {
  toolsByCategory[cat.id] = {};
  cat.subcategories.forEach(sub => {
    toolsByCategory[cat.id][sub.id] = tools.filter(t => t.category === cat.id && t.subcategory === sub.id).sort((a,b) => a.order - b.order);
  });
});

// 3. Clean Dist
console.log('Cleaning dist directory...');
fs.emptyDirSync(DIST_DIR);

// 4. Configure Nunjucks
const env = nunjucks.configure(SRC_DIR, {
  autoescape: false,
  trimBlocks: true,
  lstripBlocks: true
});

// Global context
const globalContext = {
  site: siteConfig,
  categories,
  collections,
  tools,
  toolsById,
  toolsByCategory
};

// 5. Generate Pages
console.log('Generating pages...');

// Home
const indexHtml = env.render('pages/index.njk', {
  ...globalContext,
  title: 'Home',
  id: 'index'
});
fs.outputFileSync(path.join(DIST_DIR, 'index.html'), indexHtml);

// Explore
const exploreHtml = env.render('pages/explore.njk', {
  ...globalContext,
  title: 'Explore Tools',
  description: 'Search and filter all available online tools.',
  id: 'explore'
});
fs.outputFileSync(path.join(DIST_DIR, 'explore', 'index.html'), exploreHtml);

// 6. Generate Tools
console.log(`Generating ${tools.length} tools...`);
tools.forEach(tool => {
  const templatePath = `tools/${tool.template}.njk`;
  
  try {
    const html = env.render(templatePath, {
      ...globalContext,
      ...tool
    });
    
    // Determine output path (handle flat files vs directories)
    let outPath;
    if (tool.path.endsWith('.html')) {
      outPath = path.join(DIST_DIR, tool.path);
    } else {
      outPath = path.join(DIST_DIR, tool.path, 'index.html');
    }
    
    fs.outputFileSync(outPath, html);
  } catch (err) {
    console.error(`Failed to render tool ${tool.id} with template ${templatePath}:`, err.message);
    throw err; // Fail build
  }
});

// 7. Generate Redirects
console.log(`Generating ${redirects.length} redirects...`);
redirects.forEach(r => {
  const html = env.render('redirect.njk', {
    site: siteConfig,
    target: r.target.replace('/online-tools/', '/') // Adjust to base relative
  });
  fs.outputFileSync(path.join(DIST_DIR, r.relPath), html);
});

// 8. Generate Sitemap & Robots
console.log('Generating sitemap and robots.txt...');
const sitemapUrls = tools.map(t => `${siteConfig.domain}${siteConfig.basePath}${t.path.startsWith('/') ? '' : '/'}${t.path}`);
sitemapUrls.unshift(`${siteConfig.domain}${siteConfig.basePath}/`);
sitemapUrls.unshift(`${siteConfig.domain}${siteConfig.basePath}/explore/`);

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map(url => `  <url>\n    <loc>${url}</loc>\n  </url>`).join('\n')}
</urlset>`;
fs.outputFileSync(path.join(DIST_DIR, 'sitemap.xml'), sitemapXml);

const robotsTxt = `User-agent: *
Allow: /
Sitemap: ${siteConfig.domain}${siteConfig.basePath}/sitemap.xml
`;
fs.outputFileSync(path.join(DIST_DIR, 'robots.txt'), robotsTxt);

// 9. Copy Assets
console.log('Copying legacy assets...');
const legacyAssets = ['css', 'js', 'images'];
legacyAssets.forEach(dir => {
  const src = path.join(ROOT, dir);
  if (fs.existsSync(src)) {
    fs.copySync(src, path.join(DIST_DIR, dir));
  }
});

console.log('Copying new assets...');
const newAssets = path.join(SRC_DIR, '..', 'assets');
if (fs.existsSync(newAssets)) {
  fs.copySync(newAssets, DIST_DIR);
}

console.log('====================================');
console.log('Build Complete!');
console.log(`- Tools: ${tools.length}`);
console.log(`- Redirects: ${redirects.length}`);
console.log(`- Pages: 2 (Home, Explore)`);
console.log('Output directory: dist/');
console.log('====================================');
