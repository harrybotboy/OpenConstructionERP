const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });

  // Login
  await page.goto('http://localhost:8080');
  await page.waitForTimeout(2000);
  await page.fill('input[type="email"]', 'demo@openestimator.io');
  await page.fill('input[type="password"]', 'SCyBTjwboBtKMxBYTR7Guw');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  // Skip onboarding
  await page.evaluate(() => {
    localStorage.setItem('oe_onboarding_completed', 'true');
    localStorage.setItem('oe_tour_completed', 'true');
    localStorage.setItem('oe_skip_onboarding_tour', '1');
  });

  // Go to /modules — but this is the pre-built Docker image, not our dev changes
  // The dev server at :5180 has our changes
  // Let's use the dev server instead
  await page.goto('http://localhost:5180');
  await page.waitForTimeout(2000);

  // Login on dev server
  await page.fill('input[type="email"]', 'demo@openestimator.io');
  await page.fill('input[type="password"]', 'SCyBTjwboBtKMxBYTR7Guw');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);

  await page.evaluate(() => {
    localStorage.setItem('oe_onboarding_completed', 'true');
    localStorage.setItem('oe_tour_completed', 'true');
    localStorage.setItem('oe_skip_onboarding_tour', '1');
  });

  await page.goto('http://localhost:5180/modules');
  await page.waitForTimeout(3000);

  await page.screenshot({ path: 'C:/Users/hoangdd/AppData/Local/Temp/modules-nav-tab.png' });
  console.log('URL:', page.url());
  await browser.close();
})().catch(e => { console.error(e.message); process.exit(1); });
