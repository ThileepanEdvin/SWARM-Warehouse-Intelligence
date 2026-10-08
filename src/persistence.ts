import { Engine } from './engine';

export const SAVE_KEY = 'swarm-save';

/** Manual, versioned snapshots. Simulation time never advances while the page is closed. */
export function saveGame(engine: Engine, storage: Pick<Storage, 'setItem'> = localStorage): void {
  storage.setItem(SAVE_KEY, engine.serialize());
}

export function loadGame(storage: Pick<Storage, 'getItem'> = localStorage): Engine | null {
  const snapshot = storage.getItem(SAVE_KEY);
  return snapshot === null ? null : Engine.restore(snapshot);
}
