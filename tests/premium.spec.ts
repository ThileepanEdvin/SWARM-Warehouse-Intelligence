import {Engine} from '../src/engine';
import { test, expect } from '@playwright/test';

test.beforeEach(async({page})=>{await page.addInitScript(snapshot=>{if(!localStorage.getItem('swarm-save'))localStorage.setItem('swarm-save',snapshot)},new Engine(42,{demo:true}).serialize())});

test('intelligent demo explains scores, shows a real detour, and restores the original game', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');await page.getByTitle('Reprendre (Espace)').click();
  await page.getByTitle('Mettre en pause (Espace)').click();
  await page.getByRole('button', { name: 'Sauvegarder', exact: true }).click();
  const original = await page.evaluate(() => localStorage.getItem('swarm-save'));
  await page.locator('.sidebar').getByRole('button', { name: 'SWARM LAB', exact: true }).click();
  await page.getByRole('button', {name:'Visite guidée · Démo intelligente',exact:true}).click();
  await expect(page.locator('.sim-status')).toHaveText('En pause');
  await page.getByRole('button', { name: /Voir les livraisons/ }).click();
  await expect(page.locator('.sim-time')).not.toHaveText('00:00');
  await page.getByRole('button', { name: /Comprendre une mission/ }).click();
  await expect(page.locator('.sim-status')).toHaveText('En pause');
  await expect(page.getByTestId('robot-inspector')).toContainText('Pourquoi cette décision');
  await expect(page.locator('.current-route')).toHaveCount(1);
  await page.setViewportSize({ width: 1920, height: 1080 });
  const containment = await page.evaluate(() => {
    const map = document.querySelector('.map-container')!.getBoundingClientRect();
    const svg = document.querySelector('.warehouse-svg')!.getBoundingClientRect();
    return svg.bottom <= map.bottom + 1 && svg.top >= map.top - 1;
  });
  expect(containment).toBe(true);
  await page.screenshot({ path: 'artifacts/swarm-intelligence.png', fullPage: true });
  await page.getByRole('button', { name: /Fermer son passage/ }).click();
  await expect(page.locator('.old-route')).toHaveCount(1);
  await expect(page.locator('.current-route')).toHaveCount(1);
  await page.getByTitle('Mettre en pause (Espace)').click();
  await page.getByRole('button', { name: 'Sauvegarder', exact: true }).click();
  const edited = await page.evaluate(() => JSON.parse(localStorage.getItem('swarm-save')!));
  expect(edited.tiles.some((t: { kind: string }) => t.kind === 'wall')).toBe(true);
  expect(edited.robots.some((r: { previousRoute?: unknown }) => r.previousRoute)).toBe(true);
  await page.screenshot({ path: 'artifacts/swarm-reroute.png', fullPage: true });
  await page.getByRole('button', { name: 'Retour à ma partie conservée', exact: true }).click();
  await page.getByRole('button', { name: 'Sauvegarder', exact: true }).click();
  expect(await page.evaluate(() => localStorage.getItem('swarm-save'))).toBe(original);
  expect(errors).toEqual([]);
});

test('live duel starts identically, pauses both engines, finishes and resets reproducibly', async ({ page }) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/');await page.getByTitle('Reprendre (Espace)').click();
  await page.getByTitle('Mettre en pause (Espace)').click();
  await page.getByRole('button', { name: 'Sauvegarder', exact: true }).click();
  const original = await page.evaluate(() => localStorage.getItem('swarm-save'));
  await page.getByRole('button', { name: 'SWARM ARENA', exact: true }).click();
  await page.getByLabel('Conditions initiales').selectOption('2026');
  const positions = async (side: string) => page.getByTestId(`arena-${side}`).locator('g.robot').evaluateAll(nodes => nodes.map(n => n.getAttribute('transform')));
  const initial = await positions('nearest');
  expect(await positions('balanced')).toEqual(initial);
  await page.getByRole('button', { name: '×10', exact: true }).click();
  await page.getByRole('button', { name: 'Lancer le duel', exact: true }).click();
  await expect.poll(async () => Number(await page.getByTestId('duel').getAttribute('data-tick'))).toBeGreaterThan(15);
  await page.getByRole('button', { name: 'Pause du duel', exact: true }).click();
  const paused = [await positions('nearest'), await positions('balanced')];
  const elapsed = await page.getByTestId('duel').getAttribute('data-tick');
  await page.waitForTimeout(650);
  expect(await page.getByTestId('duel').getAttribute('data-tick')).toBe(elapsed);
  expect([await positions('nearest'), await positions('balanced')]).toEqual(paused);
  await page.screenshot({ path: 'artifacts/swarm-duel-live.png', fullPage: true });
  await page.getByRole('button', { name: 'Lancer le duel', exact: true }).click();
  await expect(page.getByTestId('duel')).toHaveAttribute('data-status', 'finished', { timeout: 25000 });
  await expect(page.getByTestId('duel')).toHaveAttribute('data-tick', '240');
  const report = await page.getByTestId('duel-report').locator('tbody').innerText();
  await expect(page.getByTestId('duel-report')).toContainText('Rapport final');
  await page.screenshot({ path: 'artifacts/swarm-duel-report.png', fullPage: true });
  await page.getByTitle('Réinitialiser le duel').click();
  expect(await positions('nearest')).toEqual(initial);
  expect(await positions('balanced')).toEqual(initial);
  await page.getByRole('button', { name: 'Lancer le duel', exact: true }).click();
  await expect(page.getByTestId('duel')).toHaveAttribute('data-status', 'finished', { timeout: 25000 });
  expect(await page.getByTestId('duel-report').locator('tbody').innerText()).toBe(report);
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(391);
  await page.screenshot({ path: 'artifacts/swarm-duel-mobile.png', fullPage: true });
  await page.getByRole('button', { name: 'Retour à mon entrepôt', exact: true }).click();
  await page.getByRole('button', { name: 'Sauvegarder', exact: true }).click();
  expect(await page.evaluate(() => localStorage.getItem('swarm-save'))).toBe(original);
  expect(errors).toEqual([]);
});

test('duel keyboard and rapid speed changes keep the live warehouse paused', async ({ page }) => {
  await page.goto('/');await page.getByTitle('Reprendre (Espace)').click();
  await page.getByTitle('Mettre en pause (Espace)').click();
  await page.getByRole('button', { name: 'Sauvegarder', exact: true }).click();
  const original = await page.evaluate(() => localStorage.getItem('swarm-save'));
  await page.getByRole('button', { name: 'SWARM ARENA', exact: true }).click();
  await page.locator('body').click({ position: { x: 2, y: 2 } });
  await page.keyboard.press('Space');
  await expect(page.getByTestId('duel')).toHaveAttribute('data-status', 'running');
  await expect(page.getByLabel('Durée du duel')).toBeDisabled();
  await page.getByTitle('Réinitialiser le duel').click();
  await page.getByLabel('Durée du duel').selectOption('600');
  await expect(page.getByTestId('duel')).toHaveAttribute('data-status', 'paused');
  await expect(page.getByTestId('duel')).toHaveAttribute('data-tick', '0');
  await expect(page.locator('.duel-clock')).toContainText('05:00');
  await page.getByRole('button', { name: 'Lancer le duel', exact: true }).click();
  for (const speed of [10, 1, 5, 2, 10]) await page.getByRole('button', { name: `×${speed}`, exact: true }).click();
  await page.getByRole('button', { name: 'Pause du duel', exact: true }).click();
  await page.getByRole('button', { name: 'Retour à mon entrepôt', exact: true }).click();
  await expect(page.locator('.sim-status')).toHaveText('En pause');
  await page.getByRole('button', { name: 'Sauvegarder', exact: true }).click();
  expect(await page.evaluate(() => localStorage.getItem('swarm-save'))).toBe(original);
});

test('pause during real loading freezes handling, stock and telemetry across reload', async ({ page }) => {
  await page.goto('/');await page.getByTitle('Reprendre (Espace)').click();
  await expect(page.locator('g.robot[data-state="loading"]').first()).toBeVisible();
  await page.getByTitle('Mettre en pause (Espace)').click();
  await page.getByRole('button', { name: 'Sauvegarder', exact: true }).click();
  const saved = await page.evaluate(() => localStorage.getItem('swarm-save'));
  expect(JSON.parse(saved!).robots.some((r: { state: string }) => r.state === 'loading')).toBe(true);
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: 'Sauvegarder', exact: true }).click();
  expect(await page.evaluate(() => localStorage.getItem('swarm-save'))).toBe(saved);
  await page.reload();
  await expect(page.locator('.sim-status')).toHaveText('En pause');
  await page.getByRole('button', { name: 'Sauvegarder', exact: true }).click();
  expect(await page.evaluate(() => localStorage.getItem('swarm-save'))).toBe(saved);
});

test('immersive view frames the complete warehouse and Escape restores the interface', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/');await page.getByTitle('Reprendre (Espace)').click();
  await page.getByTitle('Vue immersive').click();
  await expect(page.locator('.simulation-card')).toHaveClass(/immersive-card/);
  const dimensions = await page.locator('.simulation-card').boundingBox();
  expect(dimensions!.height).toBeGreaterThan(1000);
  await page.locator('g.robot').first().click();
  await expect(page.getByTestId('robot-inspector')).toBeVisible();
  const containment = await page.evaluate(() => {
    const card = document.querySelector('.simulation-card')!.getBoundingClientRect();
    const svg = document.querySelector('.warehouse-svg')!.getBoundingClientRect();
    const bottom = document.querySelector('.map-bottom')!.getBoundingClientRect();
    return svg.bottom <= card.bottom && bottom.bottom <= card.bottom + 1;
  });
  expect(containment).toBe(true);
  await page.screenshot({ path: 'artifacts/swarm-immersive.png' });
  await page.keyboard.press('Escape');
  await expect(page.locator('.simulation-card')).not.toHaveClass(/immersive-card/);
  expect(errors).toEqual([]);
});

test('demo incidents and charging use actual fleet states even after delayed clicks', async ({ page }) => {
  await page.goto('/');await page.getByTitle('Reprendre (Espace)').click();
  await page.locator('.sidebar').getByRole('button', { name: 'SWARM LAB', exact: true }).click();
  await page.getByRole('button', {name:'Visite guidée · Démo intelligente',exact:true}).click();
  await page.getByRole('button', { name: /Voir les livraisons/ }).click();
  await page.getByRole('button', { name: '×10', exact: true }).click();
  await expect.poll(async () => {
    await page.getByRole('button', { name: 'Sauvegarder', exact: true }).click();
    return page.evaluate(() => JSON.parse(localStorage.getItem('swarm-save')!).tick);
  }).toBeGreaterThan(18);
  await page.getByRole('button', { name: /Provoquer une panne/ }).click();
  await expect.poll(async () => {
    await page.getByRole('button', { name: 'Sauvegarder', exact: true }).click();
    return page.evaluate(() => JSON.parse(localStorage.getItem('swarm-save')!).robots.some((r: { state: string }) => r.state === 'fault'));
  }, { timeout: 15000 }).toBe(true);
  await page.getByRole('button', { name: /Observer la recharge/ }).click();
  await expect.poll(async () => {
    await page.getByRole('button', { name: 'Sauvegarder', exact: true }).click();
    return page.evaluate(() => JSON.parse(localStorage.getItem('swarm-save')!).robots.some((r: { state: string; battery: number }) => ['to-charge', 'charging'].includes(r.state) && r.battery < 35));
  }, { timeout: 15000 }).toBe(true);
  await page.getByTitle('Mettre en pause (Espace)').click();
  await page.getByRole('button', { name: 'Sauvegarder', exact: true }).click();
  const state = await page.evaluate(() => JSON.parse(localStorage.getItem('swarm-save')!));
  expect(new Set(state.robots.map((r: { x: number; y: number }) => `${r.x},${r.y}`)).size).toBe(state.robots.length);
  expect(state.orders.every((o: { delivered: number; reserved: number; quantity: number }) => o.delivered + o.reserved <= o.quantity)).toBe(true);
});

test('camera zoom and dragging do not place equipment or alter the paused warehouse', async ({ page }) => {
  await page.goto('/');await page.getByTitle('Reprendre (Espace)').click();
  await page.getByTitle('Mettre en pause (Espace)').click();
  await page.getByRole('button', { name: 'Sauvegarder', exact: true }).click();
  const before = await page.evaluate(() => localStorage.getItem('swarm-save'));
  await page.getByRole('button', { name: 'Éditeur d’entrepôt', exact: true }).click();
  await page.getByRole('button', { name: /^Obstacle/ }).click();
  await page.getByTitle('Déplacer la caméra').click();
  const group = page.locator('.warehouse-svg > g');
  const transform = await group.getAttribute('transform');
  const box = await page.locator('.warehouse-svg').boundingBox();
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.down(); await page.mouse.move(box!.x + box!.width / 2 + 60, box!.y + box!.height / 2 + 30, { steps: 5 }); await page.mouse.up();
  expect(await group.getAttribute('transform')).not.toBe(transform);
  await page.getByTitle('Agrandir', { exact: true }).click();
  await expect(page.locator('.map-controls')).toContainText('115%');
  const scrollBefore = await page.evaluate(() => window.scrollY);
  await page.mouse.move(box!.x + box!.width / 2, box!.y + box!.height / 2);
  await page.mouse.wheel(0, 100);
  await expect(page.locator('.map-controls')).toContainText('105%');
  expect(await page.evaluate(() => window.scrollY)).toBe(scrollBefore);
  await page.getByTitle('Recentrer').click();
  await expect(page.locator('.map-controls')).toContainText('100%');
  await page.getByRole('button', { name: 'Sauvegarder', exact: true }).click();
  expect(await page.evaluate(() => localStorage.getItem('swarm-save'))).toBe(before);
});
