import { Engine, findPath } from './engine';
import type { Point, Result } from './engine';

/** Reproducible workload; changes go through the normal business APIs. */
export function createIntelligentDemo(seed = 2026): Engine {
  const engine = new Engine(seed,{demo:true});
  const batteries = [38, 96, 52, 88, 68, 81];
  engine.state.robots.forEach((r, i) => engine.setBattery(r.id, batteries[i]));
  engine.generateOrders(10);
  return engine;
}

export function selectDemoRobot(engine: Engine): string | null {
  return engine.state.robots.find(r => r.state === 'to-pickup' && r.path.length > 2)?.id
    ?? engine.state.robots.find(r => r.cargo && r.path.length > 2)?.id
    ?? engine.state.robots.find(r => r.state !== 'fault')?.id ?? null;
}

export function blockDemoRoute(engine: Engine, id: string | null): Result & { robotId?: string; cell?: Point } {
  const robot = engine.state.robots.find(r => r.id === id && r.path.length > 1) ?? engine.state.robots.find(r => r.path.length > 1);
  if (!robot?.destination) return { ok: false, message: 'Lancez la simulation quelques instants : il faut un robot avec un trajet actif.' };
  const occupied = new Set([...engine.state.tiles, ...engine.state.robots].map(p => `${p.x},${p.y}`));
  const solid = new Set(engine.state.tiles.filter(t => t.kind === 'wall' || t.kind === 'shelf').map(p => `${p.x},${p.y}`));
  for (const cell of robot.path.slice(1, -1)) {
    if (occupied.has(`${cell.x},${cell.y}`)) continue;
    const blocked = new Set([...solid, `${cell.x},${cell.y}`]);
    if (findPath(robot, robot.destination, engine.state.width, engine.state.height, blocked) === null) continue;
    const result = engine.place('wall', cell.x, cell.y);
    return { ...result, robotId: robot.id, cell };
  }
  return { ok: false, message: 'Ce trajet ne permet pas un détour sûr. Choisissez un autre robot.' };
}

export function faultDemoRobot(engine: Engine): Result & { robotId?: string; orderId?: string } {
  const robot = engine.state.robots.find(r => r.orderId && !r.cargo && r.state !== 'fault');
  if (!robot) return { ok: false, message: 'Attendez une nouvelle mission non prélevée pour montrer sa réaffectation.' };
  const orderId = robot.orderId;
  return { ...engine.faultRobot(robot.id), robotId: robot.id, orderId };
}

export function chargeDemoRobot(engine: Engine): Result & { robotId?: string } {
  const robot = engine.state.robots.find(r => !r.cargo && r.state !== 'fault');
  if (!robot) return { ok: false, message: 'Attendez qu’un robot termine sa livraison.' };
  engine.setBattery(robot.id, 18);
  return { ...engine.chargeRobot(robot.id), robotId: robot.id };
}
