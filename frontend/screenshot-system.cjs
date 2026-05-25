const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:8080');
  await page.waitForTimeout(2000);
  try {
    await page.fill('input[type="email"]', 'demo@openestimator.io');
    await page.fill('input[type="password"]', 'SCyBTjwboBtKMxBYTR7Guw');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
  } catch {}
  await page.evaluate(() => {
    localStorage.setItem('oe_onboarding_completed', 'true');
    localStorage.setItem('oe_tour_completed', 'true');
    localStorage.setItem('oe_skip_onboarding_tour', '1');
  });
  await page.goto('http://localhost:8080/modules');
  await page.waitForTimeout(2000);
  await page.click('button[role="tab"]:has-text("System Modules")');
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'C:/Users/hoangdd/AppData/Local/Temp/system-modules.png' });
  await browser.close();
  console.log('done');
})().catch(e => { console.error(e.message); process.exit(1); });
