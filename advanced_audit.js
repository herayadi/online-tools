const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const tools = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'tools.json'), 'utf-8'));

async function run() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const results = [];
  
  console.log(`Starting advanced audit of ${tools.length} tools...`);
  
  const batchSize = 3;
  for (let i = 0; i < tools.length; i += batchSize) {
    const batch = tools.slice(i, i + batchSize);
    await Promise.all(batch.map(async (tool) => {
      const page = await browser.newPage();
      let toolResult = {
        id: tool.id,
        status: 'WORKING', // WORKING, PARTIAL, BROKEN
        issues: [],
        features: {
            hasInput: false,
            autoUpdateWorks: null,
            executeWorks: null,
            hasOptions: false,
            hasCopy: false,
            hasFullscreen: false,
            fullscreenWorks: null
        }
      };
      
      const errors = [];
      page.on('pageerror', err => errors.push(err.toString()));
      page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()); });

      try {
        const actualPath = tool.path.endsWith('/') ? tool.path + 'index.html' : tool.path;
        await page.goto(`http://localhost:5500/${actualPath}`, { waitUntil: 'networkidle2', timeout: 15000 });
        
        await page.waitForFunction('window.waitLoadCount !== undefined', { timeout: 3000 }).catch(() => {});
        await page.waitForFunction('window.waitLoadCount === 0', { timeout: 5000 }).catch(() => {});
        
        const hasInput = await page.$('#input');
        const hasExecute = await page.$('#execute');
        const autoUpdate = await page.$('#auto-update');
        const options = await page.$$('[data-option]');
        const copyBtn = await page.$('[data-toggle="copyblock"], .btn-copy, [data-clipboard-target], .copy-btn');
        const fullScreenBtn = await page.$('[data-toggle="fullscreen"]');

        toolResult.features.hasInput = !!hasInput;
        toolResult.features.hasCopy = !!copyBtn;
        toolResult.features.hasFullscreen = !!fullScreenBtn;
        toolResult.features.hasOptions = options.length > 0;

        if (hasInput) {
           await page.$eval('#input', el => el.value = '');
           await page.type('#input', 'test-input');
           
           if (autoUpdate) {
               const isChecked = await page.$eval('#auto-update', el => el.checked);
               if (!isChecked) await page.click('#auto-update');
               
               await new Promise(r => setTimeout(r, 1000));
               const outValue = await page.$eval('#output', el => el.value).catch(() => '');
               
               if (outValue && outValue !== 'loading...' && !outValue.includes('Error')) {
                   toolResult.features.autoUpdateWorks = true;
               } else {
                   toolResult.features.autoUpdateWorks = false;
                   toolResult.issues.push('Auto-update failed or returned error');
               }
           }
           
           if (hasExecute) {
               await page.click('#execute');
               await new Promise(r => setTimeout(r, 1000));
               const outValue = await page.$eval('#output', el => el.value).catch(() => '');
               if (outValue && outValue !== 'loading...' && !outValue.includes('Error') && !outValue.includes('not defined')) {
                   toolResult.features.executeWorks = true;
               } else {
                   toolResult.features.executeWorks = false;
                   toolResult.issues.push('Execute button failed or returned error: ' + outValue);
               }
           }
        } else if (hasExecute) {
            await page.click('#execute');
            await new Promise(r => setTimeout(r, 1000));
            const outValue = await page.$eval('#output', el => el.value).catch(() => '');
            if (outValue && outValue !== 'loading...' && !outValue.includes('Error')) {
                toolResult.features.executeWorks = true;
            } else {
                toolResult.features.executeWorks = false;
                toolResult.issues.push('Execute failed or returned error');
            }
        }
        
        if (fullScreenBtn) {
            await fullScreenBtn.click();
            const isFullscreen = await page.$eval('.block', el => el.classList.contains('fullscreen')).catch(()=>false);
            if (isFullscreen) {
                toolResult.features.fullscreenWorks = true;
            } else {
                toolResult.features.fullscreenWorks = false;
                toolResult.issues.push('Fullscreen button did not toggle class');
            }
        }

        if (errors.length > 0) {
            toolResult.issues.push('Console Errors: ' + errors.join('; '));
        }

      } catch (err) {
         toolResult.status = 'BROKEN';
         toolResult.issues.push('Navigation/Timeout Error: ' + err.toString());
      }
      
      if (toolResult.issues.length > 0 && toolResult.status !== 'BROKEN') {
          if (!toolResult.features.hasInput && !toolResult.features.executeWorks) {
              toolResult.status = 'BROKEN';
          } else {
              toolResult.status = 'PARTIAL';
          }
      }
      if (toolResult.status === 'BROKEN' || toolResult.status === 'PARTIAL') {
          if (toolResult.issues.some(msg => msg.includes('not defined') || msg.includes('Cannot read properties') || msg.includes('Error:'))) {
              toolResult.status = 'BROKEN';
          }
      }

      console.log(`[${toolResult.status}] ${tool.id}: ${toolResult.issues.join(' | ') || 'OK'}`);
      results.push(toolResult);
      
      await page.close();
    }));
  }
  
  await browser.close();
  fs.writeFileSync('advanced_audit_results.json', JSON.stringify(results, null, 2));
  console.log(`Audit finished.`);
}

run();
