import { expect, it } from 'vitest';
import { Engine } from './engine';
import { loadGame, saveGame } from './persistence';

it('round trips a live mission through storage without advancing simulated time', () => {
  const entries = new Map<string, string>();
  const storage = { getItem: (key: string) => entries.get(key) ?? null, setItem: (key: string, value: string) => { entries.set(key, value); } };
  expect(loadGame(storage)).toBeNull();
  const engine = new Engine(42,{demo:true});
  engine.tick(17);
  saveGame(engine, storage);
  expect(loadGame(storage)?.serialize()).toBe(engine.serialize());
});

it('propagates storage denial so the interface can report a save failure', () => {
  expect(() => saveGame(new Engine(42,{demo:true}), { setItem: () => { throw new Error('quota'); } })).toThrow('quota');
});
