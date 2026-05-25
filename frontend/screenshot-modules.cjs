const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  await page.goto('http://localhost:8080');
  await page.waitForTimeout(2000);

  // Login
  try {
    await page.fill('input[type="email"]', 'demo@openestimator.io');
    await page.fill('input[type="password"]', 'SCyBTjwboBtKMxBYTR7Guw');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(3000);
  } catch {}

  // Skip onboarding
  await page.evaluate(() => {
    localStorage.setItem('oe_onboarding_completed', 'true');
    localStorage.setItem('oe_tour_completed', 'true');
    localStorage.setItem('oe_skip_onboarding_tour', '1');
  });

  await page.goto('http://localhost:8080/modules');
  await page.waitForTimeout(3000);

  await page.screenshot({ path: 'C:/Users/hoangdd/AppData/Local/Temp/modules-nav-tab-v2.png', fullPage: false });
  console.log('URL:', page.url());

  // Click the Navigation tab
  try {
    await page.click('button[role="tab"]:has-text("Navigation")');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'C:/Users/hoangdd/AppData/Local/Temp/modules-nav-tab-v3.png', fullPage: false });
    console.log('Navigation tab screenshot taken');
  } catch (e) {
    console.log('Navigation tab click failed:', e.message);
  }

  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
