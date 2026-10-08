import { describe, expect, it } from 'vitest';
import { Engine } from './engine';
import { compareStrategies } from './optimization';

describe('reproducible optimization', () => {
  it('compares clones without advancing or mutating the live warehouse', async () => {
    const live = new Engine(17);
    const before = live.serialize();
    const results = await compareStrategies(before, 40);
    expect(live.serialize()).toBe(before);
    expect(results.map(r => r.strategy)).toEqual(['balanced', 'nearest']);
    for (const result of results) {
      const reference = Engine.restore(before);
      reference.state.strategy = result.strategy;
      reference.tick(40);
      expect(result.metrics).toEqual(reference.metrics);
    }
  });
  it('rejects unbounded experiment durations', async () => {
    await expect(compareStrategies(new Engine().serialize(), 100000)).rejects.toThrow();
  });
});
