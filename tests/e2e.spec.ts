import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('real playback pauses, advances, and preserves an explicitly saved state', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.getByTitle('Mettre en pause (Espace)').click();
  const time = await page.locator('.sim-time').textContent();
  const robots = await page.locator('g.robot').evaluateAll(nodes => nodes.map(n => n.getAttribute('transform')));
  await page.waitForTimeout(1100);
  expect(await page.locator('.sim-time').textContent()).toBe(time);
  expect(await page.locator('g.robot').evaluateAll(nodes => nodes.map(n => n.getAttribute('transform')))).toEqual(robots);
  await page.getByRole('button', { name: '×10', exact: true }).click();
  await page.getByTitle('Reprendre (Espace)').click();
  await expect(page.locator('.sim-time')).not.toHaveText(time!);
  await page.getByTitle('Mettre en pause (Espace)').click();
  await page.getByRole('button', { name: 'Sauvegarder', exact: true }).click();
  const saved = await page.evaluate(() => localStorage.getItem('swarm-save'));
  expect(JSON.parse(saved!).tick).toBeGreaterThan(0);
  await page.reload();
  await expect(page.locator('.sim-status')).toHaveText('En pause');
  expect(await page.evaluate(() => localStorage.getItem('swarm-save'))).toBe(saved);
  await page.getByRole('button', { name: 'Sauvegarder', exact: true }).click();
  expect(await page.evaluate(() => localStorage.getItem('swarm-save'))).toBe(saved);
  expect(errors).toEqual([]);
});

test('order creation validates inputs and laboratory failure changes the real fleet', async ({ page }) => {
  await page.getByTitle('Mettre en pause (Espace)').click();
  await page.getByRole('button', { name: 'Nouvelle commande', exact: true }).click();
  const before = await page.getByTestId('stock-management').locator('tbody tr').count();
  await page.getByLabel('Quantité', { exact: true }).fill('2');
  await page.getByRole('button', { name: 'Créer la commande', exact: true }).click();
  await expect(page.getByTestId('stock-management').locator('tbody tr')).toHaveCount(before + 1);
  await page.getByLabel('Quantité', { exact: true }).fill('-1');
  await page.getByRole('button', { name: 'Créer la commande', exact: true }).click();
  await expect(page.getByTestId('stock-management').locator('tbody tr')).toHaveCount(before + 1);
  await page.getByRole('button', { name: 'SWARM LAB', exact: false }).click();
  await page.getByLabel('Scénario d’incident').selectOption('Commandes massives');
  await page.getByLabel('Nombre (charge / pannes)').fill('100');
  await page.getByRole('button',{name:'Déclencher l’incident',exact:true}).click();
  await page.getByLabel('Scénario d’incident').selectOption('Robot en panne');
  await page.getByRole('button',{name:'Déclencher l’incident',exact:true}).click();
  await page.getByRole('button', { name: 'Flotte de robots', exact: true }).click();
  await expect(page.locator('.management-page')).toContainText('En panne');
  await page.getByRole('button', { name: 'Sauvegarder', exact: true }).click();
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('swarm-save')!));
  expect(state.orders).toHaveLength(before + 101);
  expect(state.robots.filter((r: { state: string }) => r.state === 'fault')).toHaveLength(1);
});

test('editor places equipment, rejects occupied cells and debits only successful purchases', async ({ page }) => {
  await page.getByTitle('Mettre en pause (Espace)').click();
  await page.getByRole('button', { name: 'Éditeur d’entrepôt', exact: true }).click();
  await page.getByRole('button', { name: /^Obstacle/ }).click();
  await page.locator('.floor-hit').nth(0).click();
  await page.getByRole('button', { name: 'Sauvegarder', exact: true }).click();
  const first = await page.evaluate(() => JSON.parse(localStorage.getItem('swarm-save')!));
  expect(first.tiles.some((t: { x: number; y: number; kind: string }) => t.x === 0 && t.y === 0 && t.kind === 'wall')).toBe(true);
  await page.locator('g.tile').filter({ has: page.locator('path') }).last().click();
  await page.getByRole('button', { name: 'Sauvegarder', exact: true }).click();
  const second = await page.evaluate(() => JSON.parse(localStorage.getItem('swarm-save')!));
  expect(second.budget).toBe(first.budget);
  expect(second.tiles.length).toBe(first.tiles.length);
});

test('responsive screens render without console exceptions and capture real screenshots', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(page.getByRole('img', { name: 'Entrepôt interactif' })).toBeVisible();
  await page.waitForTimeout(1800);
  await page.screenshot({ path: 'artifacts/swarm-desktop.png', fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('img', { name: 'Entrepôt interactif' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);
  await page.screenshot({ path: 'artifacts/swarm-mobile.png', fullPage: true });
  expect(errors).toEqual([]);
});

test('autonomous dispatch delivers stock-backed orders and corrupt saves recover safely', async ({ page }) => {
  await page.getByRole('button', { name: '×10', exact: true }).click();
  await expect.poll(async () => {
    await page.getByRole('button', { name: 'Sauvegarder', exact: true }).click();
    return page.evaluate(() => JSON.parse(localStorage.getItem('swarm-save')!).orders.filter((o: { status: string }) => o.status === 'completed').length);
  }, { timeout: 20_000, intervals: [1000] }).toBeGreaterThan(0);
  await page.getByTitle('Mettre en pause (Espace)').click();
  await page.getByRole('button', { name: 'Sauvegarder', exact: true }).click();
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('swarm-save')!));
  expect(state.revenue).toBeGreaterThan(0);
  expect(state.distance).toBeGreaterThan(0);
  expect(state.tiles.filter((t: { kind: string }) => t.kind === 'shelf').reduce((sum: number, t: { stock: number }) => sum + t.stock, 0)).toBeLessThan(480);
  expect(new Set(state.robots.map((r: { x: number; y: number }) => `${r.x},${r.y}`)).size).toBe(state.robots.length);
  await page.evaluate(() => localStorage.setItem('swarm-save', '{broken'));
  await page.reload();
  await expect(page.getByRole('status')).toContainText('Sauvegarde illisible');
  await expect(page.locator('.fleet-list .robot-row')).toHaveCount(6);
  await expect(page.getByRole('img', { name: 'Entrepôt interactif' })).toBeVisible();
});

test('strategy comparison runs both real scenarios without mutating the paused warehouse', async ({ page }) => {
  await page.getByTitle('Mettre en pause (Espace)').click();
  await page.getByRole('button', { name: 'Sauvegarder', exact: true }).click();
  const before = await page.evaluate(() => localStorage.getItem('swarm-save'));
  await page.getByRole('button', { name: 'SWARM LAB', exact: false }).click();
  await page.getByRole('button', { name: 'Comparer les stratégies · 10 min', exact: true }).click();
  await expect(page.locator('.experiment-results .order-card')).toHaveCount(2, { timeout: 25_000 });
  await expect(page.locator('.experiment-results')).toContainText('Batterie + distance');
  await expect(page.locator('.experiment-results')).toContainText('Robot le plus proche');
  await page.getByRole('button', { name: 'Sauvegarder', exact: true }).click();
  expect(await page.evaluate(() => localStorage.getItem('swarm-save'))).toBe(before);
});
