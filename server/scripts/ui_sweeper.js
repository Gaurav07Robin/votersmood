import puppeteer from 'puppeteer';

async function runSweeper() {
  console.log("[QA Agent] Starting Frontend Route Sweeper...");
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  
  const routes = [
    { url: 'http://localhost:3000/', name: 'Home/Discussions' },
    { url: 'http://localhost:3000/elections/state/bihar/2020', name: 'Bihar 2020 State Results' },
    { url: 'http://localhost:3000/insights', name: 'Insights Blog' }
  ];

  let errors = 0;

  for (const route of routes) {
    try {
      console.log(`[QA Agent] Sweeping Route: ${route.name} (${route.url})`);
      const response = await page.goto(route.url, { waitUntil: 'networkidle0', timeout: 30000 });
      
      if (!response.ok()) {
        console.error(`[QA Agent] ❌ HTTP Error ${response.status()} on ${route.name}`);
        errors++;
        continue;
      }

      // Check for React Error Boundary / White Screen
      const content = await page.content();
      if (content.includes("Application error") || content.includes("TypeError")) {
         console.error(`[QA Agent] ❌ REACT FATAL CRASH found on ${route.name}`);
         errors++;
         continue;
      }

      // Specific Route Checks
      if (route.url.includes('bihar/2020')) {
         // Check if data loaded
         const text = await page.evaluate(() => document.body.innerText);
         if (!text.includes('Constituency') || !text.includes('Margin')) {
             console.error(`[QA Agent] ❌ DATA MISSING on Bihar 2020 (Missing table headers)`);
             errors++;
         } else {
             console.log(`[QA Agent] ✅ Structural data verified on ${route.name}`);
         }
      } else {
         console.log(`[QA Agent] ✅ Route ${route.name} successfully rendered.`);
      }

    } catch (err) {
      console.error(`[QA Agent] ❌ Failed to sweep ${route.name}: ${err.message}`);
      errors++;
    }
  }

  await browser.close();
  
  console.log("=========================================");
  if (errors === 0) {
      console.log("[QA Agent] 🏆 ALL FRONTEND ROUTES HEALTHY.");
  } else {
      console.log(`[QA Agent] ⚠️ SWEEPER COMPLETED WITH ${errors} ERRORS.`);
  }
  console.log("=========================================");
}

runSweeper().catch(console.error);
