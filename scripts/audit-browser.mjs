import { chromium } from 'playwright';
import process from 'node:process';
import { log } from 'node:console';
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('pageerror', error => errors.push(error.message));
  const response = await page.goto('http://127.0.0.1:5173/');
  await page.waitForTimeout(1500);
  for (const name of ['Flotte de robots', 'Stocks & Commandes', 'Éditeur d’entrepôt', 'Stations de recharge', 'SWARM LAB', 'Analytics', 'Événements', 'Paramètres']) {
    await page.getByRole('button', { name, exact: true }).click();
  }
  log(JSON.stringify({ http: response.status(), consoleErrors: errors }));
  if (errors.length) process.exitCode = 1;
} finally {
  await browser.close();
}
