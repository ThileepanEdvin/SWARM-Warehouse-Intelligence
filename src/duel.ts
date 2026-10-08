import { Engine } from './engine';

export interface DuelMetrics { completed: number; distance: number; energy: number; averageTime: number; waiting: number; stalled: number; costs: number; revenue: number; pending:number; busy:number; impossible:number }
export type DuelWinner = 'nearest' | 'balanced' | 'tie';

/** Both clones receive exactly one logical tick together. The live engine is never referenced. */
export class DuelSession {
  readonly snapshot: string;
  readonly horizon: number;
  nearest: Engine;
  balanced: Engine;
  elapsed = 0;
  private baseline: Engine;

  constructor(snapshot: string, horizon = 240) {
    if (!Number.isInteger(horizon) || horizon < 20 || horizon > 1200) throw new Error('Le duel doit durer de 20 à 1 200 pas.');
    this.snapshot = snapshot;
    this.horizon = horizon;
    this.baseline = Engine.restore(snapshot);
    this.nearest = Engine.restore(snapshot);
    this.balanced = Engine.restore(snapshot);
    this.nearest.state.strategy = 'nearest';
    this.balanced.state.strategy = 'balanced';
  }
  get finished() { return this.elapsed === this.horizon; }
  tick(count = 1): void {
    if (!Number.isInteger(count) || count < 1 || count > 1000) throw new Error('Nombre de pas invalide.');
    for (let i = 0; i < count && !this.finished; i++) {
      this.nearest.tick();
      this.balanced.tick();
      this.elapsed++;
    }
  }
  reset(): void {
    this.nearest = Engine.restore(this.snapshot);
    this.balanced = Engine.restore(this.snapshot);
    this.nearest.state.strategy = 'nearest';
    this.balanced.state.strategy = 'balanced';
    this.elapsed = 0;
  }
  metrics(strategy: 'nearest' | 'balanced'): DuelMetrics {
    const engine = this[strategy];
    const initialDone = new Set(this.baseline.state.orders.filter(o => o.status === 'completed').map(o => o.id));
    const done = engine.state.orders.filter(o => o.status === 'completed' && !initialDone.has(o.id));
    return {
      completed: done.length, pending:engine.state.orders.filter(o=>o.status!=='completed').length, busy:engine.state.robots.filter(r=>r.orderId).length, impossible:engine.state.orders.filter(o=>o.status==='blocked').length,
      distance: engine.state.distance - this.baseline.state.distance,
      energy: engine.state.energy - this.baseline.state.energy,
      averageTime: done.length ? done.reduce((sum, o) => sum + (o.completedAt! - o.createdAt) * .5, 0) / done.length : 0,
      waiting: (engine.metrics.waiting - this.baseline.metrics.waiting) * .5,
      stalled: engine.state.robots.filter(r => ['waiting', 'blocked', 'fault'].includes(r.state) || r.waitingNow).length,
      costs: engine.state.costs - this.baseline.state.costs,
      revenue: engine.state.revenue - this.baseline.state.revenue,
    };
  }
  get winner(): DuelWinner {
    const a = this.metrics('nearest'), b = this.metrics('balanced');
    if (a.completed !== b.completed) return a.completed > b.completed ? 'nearest' : 'balanced';
    if (a.completed && Math.abs(a.averageTime - b.averageTime) > 1e-8) return a.averageTime < b.averageTime ? 'nearest' : 'balanced';
    if (Math.abs(a.energy-b.energy)>1e-8) return a.energy<b.energy?'nearest':'balanced';
    return 'tie';
  }
}
