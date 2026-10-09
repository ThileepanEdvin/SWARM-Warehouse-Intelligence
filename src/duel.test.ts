import { describe, expect, it } from 'vitest';
import { Engine } from './engine';
import { DuelSession } from './duel';
import { createIntelligentDemo } from './demo';

describe('independent visual algorithm duel', () => {
  it('starts with identical immutable conditions except strategy and never mutates the live game', () => {
    const live = createIntelligentDemo(); live.tick(17);
    const before = live.serialize(), duel = new DuelSession(before);
    const a = JSON.parse(duel.nearest.serialize()), b = JSON.parse(duel.balanced.serialize());
    delete a.strategy; delete b.strategy;
    expect(a).toEqual(b);
    expect(duel.nearest.state.robots).not.toBe(duel.balanced.state.robots);
    duel.tick(100);
    expect(live.serialize()).toBe(before);
    expect(duel.nearest.state.tick).toBe(duel.balanced.state.tick);
    expect(duel.elapsed).toBe(100);
    expect(() => Engine.restore(duel.nearest.serialize())).not.toThrow();
    expect(() => Engine.restore(duel.balanced.serialize())).not.toThrow();
  });
  it('matches separate reference engines and reports deltas from the snapshot', () => {
    const live = createIntelligentDemo(77); live.tick(30);
    const snapshot = live.serialize(), duel = new DuelSession(snapshot, 120);
    duel.tick(200);
    expect(duel.elapsed).toBe(120); expect(duel.finished).toBe(true);
    for (const strategy of ['nearest', 'balanced'] as const) {
      const reference = Engine.restore(snapshot); reference.state.strategy = strategy; reference.tick(120);
      expect(duel[strategy].serialize()).toBe(reference.serialize());
      expect(duel.metrics(strategy).distance).toBe(reference.state.distance - live.state.distance);
      expect(duel.metrics(strategy).costs).toBeCloseTo(reference.state.costs - live.state.costs);
    }
  });
  it('restarts repeated duels with exactly the same outcomes and bounds runtime', () => {
    const duel = new DuelSession(createIntelligentDemo().serialize(), 160);
    duel.tick(160); const first = [duel.nearest.serialize(), duel.balanced.serialize()];
    for (let i = 0; i < 3; i++) { duel.reset(); expect(duel.elapsed).toBe(0); duel.tick(160); expect([duel.nearest.serialize(), duel.balanced.serialize()]).toEqual(first); }
    expect(() => new DuelSession('{}')).toThrow();
    expect(() => new DuelSession(createIntelligentDemo().serialize(), 100000)).toThrow();
    expect(() => duel.tick(-1)).toThrow();
  });
  it('computes ranking from real deliveries and preparation time, and recognizes ties', () => {
    for (const seed of [77, 2026, 123]) {
      const duel = new DuelSession(createIntelligentDemo(seed).serialize(), 240); duel.tick(240);
      const a = duel.metrics('nearest'), b = duel.metrics('balanced');
      const expected = a.completed !== b.completed ? (a.completed > b.completed ? 'nearest' : 'balanced') : Math.abs(a.averageTime - b.averageTime) > 1e-8 ? (a.averageTime < b.averageTime ? 'nearest' : 'balanced') : 'tie';
      expect(duel.winner).toBe(expected);
      if (seed === 77) expect(duel.winner).toBe('nearest');
      if (seed === 2026) expect(duel.winner).toBe('balanced');
    }
    const empty = new Engine(42,{demo:true}); empty.state.robots = []; const tie = new DuelSession(empty.serialize(), 20); tie.tick(20);
    expect(tie.winner).toBe('tie');
    expect(tie.metrics('nearest').completed).toBe(0);
  });
});
