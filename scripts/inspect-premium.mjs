import { chromium } from 'playwright';
/* global document, getComputedStyle */
import { log } from 'node:console';
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto('http://127.0.0.1:5173/');
  await page.locator('.sidebar').getByRole('button', { name: 'SWARM LAB', exact: true }).click();
  await page.getByRole('button', {name:'Visite guidée · Démo intelligente',exact:true}).click();
  log(await page.evaluate(() => ['.simulation-body', '.map-container', '.warehouse-view', '.warehouse-svg', '.map-bottom'].map(selector => {
    const el = document.querySelector(selector); const rect = el.getBoundingClientRect(); const css = getComputedStyle(el);
    return { selector, width: rect.width, height: rect.height, top: rect.top, bottom: rect.bottom, minHeight: css.minHeight, flex: css.flex, overflow: css.overflow, aspectRatio: css.aspectRatio };
  })));
  await page.getByRole('button', { name: 'SWARM ARENA', exact: true }).click();
  for (const scenario of ['2026', '77']) {
    await page.getByLabel('Conditions initiales').selectOption(scenario);
    await page.getByRole('button', { name: '×10', exact: true }).click();
    await page.getByRole('button', { name: 'Lancer le duel', exact: true }).click();
    await page.waitForFunction(() => document.querySelector('[data-testid="duel"]').getAttribute('data-status') === 'finished');
    log({ scenario, report: await page.locator('.duel-report').innerText() });
  }
} finally { await browser.close(); }
