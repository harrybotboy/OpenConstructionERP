const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:8080');
  await page.waitForTimeout(2000);
  await page.fill('input[type="email"]', 'demo@openestimator.io');
  await page.fill('input[type="password"]', 'DemoPass1234!');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'C:/Users/hoangdd/AppData/Local/Temp/sidebar-after-login.png' });
  await browser.close();
  console.log('done');
})().catch(e => { console.error(e.message); process.exit(1); });
