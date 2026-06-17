const fs = require('fs');
const old = fs.readFileSync('qr-code/generator/index.html', 'utf8');

const mainMatch = old.match(/<main>([\s\S]*?)<\/main>/);
const headMatch = old.match(/<link rel="stylesheet" href="css\/qrcode\.css[^>]*>/);
const scriptMatch = old.match(/<script src="https:\/\/artf\.github\.io\/grapick\/dist\/grapick\.min\.js"><\/script>[\s\S]*?<script src="js\/qrcode\.js\?v=8"><\/script>/);

let out = `{% extends "layouts/tool.njk" %}\n\n`;

out += `{% block page_styles %}\n  `;
if (headMatch) {
  out += headMatch[0].replace('href="css/', 'href="{{ asset(\'css/');
  out = out.replace('.css?v=6"', '.css?v=6\') }}"');
}
out += `\n  <link rel="stylesheet" href="https://artf.github.io/grapick/dist/grapick.min.css" />\n{% endblock %}\n\n`;

out += `{% block tool_input %}\n`;
if (mainMatch) {
  let mainContent = mainMatch[1];
  // Remove the wrapper elements that we don't need (like old layout block)
  // Let's just paste it exactly. BUT we need to fix image paths.
  mainContent = mainContent.replace(/src="images\//g, 'src="{{ asset(\'images/');
  mainContent = mainContent.replace(/\.svg"/g, '.svg\') }}"');
  mainContent = mainContent.replace(/\.png"/g, '.png\') }}"');
  
  // Also we want to inject it cleanly into the tool layout.
  // Actually, wait, if we extend `layouts/base.njk`, we don't have to use `tool_input`. 
  // Let's just override `main` block!
}
out = `{% extends "layouts/base.njk" %}\n\n`;

out += `{% block page_styles %}\n  `;
if (headMatch) {
  let href = headMatch[0];
  href = href.replace('href="css/', 'href="{{ asset(\'css/');
  href = href.replace('.css?v=6"', '.css?v=6\') }}"');
  out += href;
}
out += `\n  <link rel="stylesheet" href="https://artf.github.io/grapick/dist/grapick.min.css" />\n{% endblock %}\n\n`;

out += `{% block main %}\n`;
if (mainMatch) {
  let mainContent = mainMatch[1];
  mainContent = mainContent.replace(/src="images\//g, 'src="{{ asset(\'images/');
  mainContent = mainContent.replace(/\.svg"/g, '.svg\') }}"');
  mainContent = mainContent.replace(/\.png"/g, '.png\') }}"');
  out += mainContent;
}
out += `\n{% endblock %}\n\n`;

out += `{% block page_scripts %}\n  `;
if (scriptMatch) {
  let scripts = scriptMatch[0];
  scripts = scripts.replace(/src="js\//g, 'src="{{ asset(\'js/');
  scripts = scripts.replace(/\.js"/g, '.js\') }}"');
  scripts = scripts.replace(/\.js\?v=8"/g, '.js?v=8\') }}"');
  out += scripts;
}
out += `\n{% endblock %}\n`;

fs.writeFileSync('src/views/tools/tool-qr-code-generator.njk', out);
