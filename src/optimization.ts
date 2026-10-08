import { Engine } from './engine';
import type { Metrics } from './engine';

export type Experiment = { strategy: 'balanced' | 'nearest'; metrics: Metrics; ticks: number; elapsedMs: number };
/** Runs identical snapshots. No mutations of the live simulation and no random performance claims. */
export async function compareStrategies(snapshot: string, ticks = 1200): Promise<Experiment[]> {
  if (!Number.isInteger(ticks) || ticks < 20 || ticks > 5000) throw new Error('Durée invalide.');
  const experiments: Experiment[] = [];
  for (const strategy of ['balanced', 'nearest'] as const) {
    const engine = Engine.restore(snapshot);
    engine.state.strategy = strategy;
    const start = performance.now();
    for (let i = 0; i < ticks; i += 20) {
      engine.tick(Math.min(20, ticks - i));
      await new Promise<void>(resolve => setTimeout(resolve, 0));
    }
    experiments.push({ strategy, metrics: engine.metrics, ticks, elapsedMs: performance.now() - start });
  }
  return experiments;
}
