import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
  page.on('pageerror', error => console.log('BROWSER ERROR:', error.message));
  
  await page.goto('http://localhost:3000/');
  
  // Wait a second for react to render
  await new Promise(r => setTimeout(r, 2000));
  
  const content = await page.content();
  console.log("BODY LENGTH:", content.length);
  
  await browser.close();
})();
