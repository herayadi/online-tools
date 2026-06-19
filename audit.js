const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const tools = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'tools.json'), 'utf-8'));

async function run() {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const results = { total: tools.length, working: [], partial: [], broken: [], rootCauses: {} };
  
  console.log(`Starting audit of ${tools.length} tools...`);
  
  // To avoid max listeners warning and run faster, run in batches of 5
  const batchSize = 5;
  for (let i = 0; i < tools.length; i += batchSize) {
    const batch = tools.slice(i, i + batchSize);
    await Promise.all(batch.map(async (tool) => {
      const page = await browser.newPage();
      let status = 'WORKING';
      let errorMsg = '';
      
      const errors = [];
      page.on('pageerror', err => {
        errors.push(err.toString());
      });
      page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
      });

      try {
        const actualPath = tool.path.endsWith('/') ? tool.path + 'index.html' : tool.path;
        await page.goto(`http://localhost:5500/${actualPath}`, { waitUntil: 'networkidle2', timeout: 15000 });
        
        await page.waitForFunction('window.waitLoadCount !== undefined', { timeout: 3000 }).catch(() => {});
        await page.waitForFunction('window.waitLoadCount === 0', { timeout: 5000 }).catch(() => {});
        
        const hasExecute = await page.$('#execute');
        if (!hasExecute) {
           // Not all tools have an execute button? Most should.
           // Auto-update ones might not.
           const hasInput = await page.$('#input');
           if (!hasInput) {
             status = 'BROKEN';
             errorMsg = 'No execute button and no input field found';
           } else {
             // Maybe it auto updates
             await page.type('#input', 'test');
             await new Promise(r => setTimeout(r, 1000));
             const outValue = await page.$eval('#output', el => el.value).catch(() => '');
             if (!outValue || outValue === 'loading...') {
               status = 'BROKEN';
               errorMsg = outValue === 'loading...' ? 'Stuck on loading...' : 'Empty output';
             }
           }
        } else {
          const hasInput = await page.$('#input');
          if (hasInput) {
            // clear first just in case
            await page.$eval('#input', el => el.value = '');
            await page.type('#input', 'test');
          }
          await page.click('#execute');
          await new Promise(r => setTimeout(r, 1000));
          
          const hasOutput = await page.$('#output');
          if (hasOutput) {
            const outValue = await page.$eval('#output', el => el.value).catch(() => '');
            if (!outValue || outValue === 'loading...') {
               status = 'BROKEN';
               errorMsg = outValue === 'loading...' ? 'Stuck on loading...' : 'Empty output';
            } else if (outValue.includes('ReferenceError') || outValue.includes('TypeError') || outValue.includes('Error')) {
               status = 'BROKEN';
               errorMsg = outValue;
            }
          }
        }
        
        if (errors.length > 0) {
           if (status === 'WORKING') status = 'PARTIAL';
           const consoleErrors = errors.join('; ');
           errorMsg = (errorMsg ? errorMsg + ' | ' : '') + 'Console: ' + consoleErrors;
           if (status === 'PARTIAL' && consoleErrors.includes('not defined')) {
               status = 'BROKEN'; // If a method is not defined, it's broken
           }
        }
      } catch (err) {
         status = 'BROKEN';
         errorMsg = err.toString();
      }
      
      console.log(`[${status}] ${tool.id}: ${errorMsg || 'OK'}`);
      
      if (status === 'WORKING') results.working.push(tool.id);
      if (status === 'PARTIAL') results.partial.push({ id: tool.id, error: errorMsg });
      if (status === 'BROKEN') results.broken.push({ id: tool.id, error: errorMsg });
      
      await page.close();
    }));
  }
  
  await browser.close();
  fs.writeFileSync('audit_results.json', JSON.stringify(results, null, 2));
  console.log(`Audit finished. Working: ${results.working.length}, Partial: ${results.partial.length}, Broken: ${results.broken.length}`);
}

run();
