const fs = require('fs');
const path = require('path');

const toolsPath = path.join(__dirname, 'data', 'tools.json');
const tools = JSON.parse(fs.readFileSync(toolsPath, 'utf8'));

tools.forEach(tool => {
    // Determine original HTML path
    let htmlPath = path.join(__dirname, tool.path, 'index.html');
    if (!fs.existsSync(htmlPath)) {
        htmlPath = path.join(__dirname, tool.slug.replace(/-/g, '_') + '.html');
    }
    if (!fs.existsSync(htmlPath)) {
        console.log('Could not find original HTML for', tool.id);
        return;
    }

    const htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // Extract delayScripts
    const regex = /delayScripts\.push\(\{\s*src:\s*["']([^"']+)["']/g;
    let match;
    const scripts = [];
    while ((match = regex.exec(htmlContent)) !== null) {
        let src = match[1];
        // Strip query params like ?v=6
        src = src.split('?')[0];
        
        // Exclude globally handled scripts by the new template
        if (src.includes('clipboard.min.js')) continue;
        if (src.includes('monaco-editor.js')) continue;
        
        scripts.push(src);
    }
    
    // Assign to tool
    tool.scripts = scripts;
});

fs.writeFileSync(toolsPath, JSON.stringify(tools, null, 2));
console.log('tools.json updated successfully from original HTML files.');
