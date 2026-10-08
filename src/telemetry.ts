import type { Point, Robot, SimulationState } from './engine';

export type DecisionKind = 'assignment' | 'reroute' | 'charging' | 'waiting' | 'fault' | 'pickup' | 'delivery' | 'idle';
export interface Decision { tick: number; kind: DecisionKind; message: string }
export interface Assignment { tick: number; strategy: 'nearest' | 'balanced'; score: number; distance: number; battery: number; candidates: number; priority: number }
export interface RouteChange { tick: number; path: Point[]; reason: string }
export interface Signal extends Point { id: string; tick: number; kind: 'pickup' | 'delivery' | 'reward' | 'purchase' | 'reroute' | 'fault'; robotId?: string; amount?: number; orderId?: string }

export function emitSignal(state: SimulationState, signal: Omit<Signal, 'id' | 'tick'>): void {
  state.signalCounter = (state.signalCounter ?? 0) + 1;
  const signals = state.signals ?? [];
  state.signals = [{ ...signal, id: `fx-${state.signalCounter}`, tick: state.tick }, ...signals].slice(0, 80);
}

export function explain(robot: Robot, state: SimulationState, kind: DecisionKind, message: string): void {
  if (robot.decision?.kind === kind && robot.decision.message === message) return;
  robot.decision = { tick: state.tick, kind, message };
}

/** Observe completed business transitions. This module cannot move a robot or alter stock. */
export function instrumentStep(state: SimulationState, before: Robot[], revenueBefore: number): void {
  for (const robot of state.robots) {
    const old = before.find(r => r.id === robot.id);
    if (!old) continue;
    robot.waitingNow = ['waiting', 'blocked'].includes(robot.state) || (robot.waitTicks > old.waitTicks && robot.x === old.x && robot.y === old.y);
    if (old.cargo === 0 && robot.cargo === 1) {
      emitSignal(state, { kind: 'pickup', robotId: robot.id, x: robot.x, y: robot.y });
      explain(robot, state, 'pickup', 'Colis prélevé : une unité a été retirée du stock. Je rejoins un dépôt accessible.');
    }
    if (old.cargo === 1 && robot.cargo === 0 && old.state === 'unloading') {
      emitSignal(state, { kind: 'delivery', robotId: robot.id, orderId: old.orderId, x: robot.x, y: robot.y });
      const order = state.orders.find(o => o.id === old.orderId);
      if (order?.status === 'completed' && state.revenue > revenueBefore) {
        // The reward uses the income recorded by the completed business transition.
        emitSignal(state, { kind: 'reward', orderId: order.id, amount: order.income ?? 0, x: robot.x, y: robot.y });
      }
      explain(robot, state, 'delivery', 'Colis déchargé et livraison enregistrée. Je suis prêt pour une nouvelle mission.');
    }
    if (robot.state === 'to-charge' && old.state !== 'to-charge') {
      explain(robot, state, 'charging', old.battery < 30 ? `Batterie à ${Math.round(robot.battery)} % : sous le seuil de 30 %, je cherche une borne accessible.` : 'Recharge demandée : je cherche une borne libre et accessible.');
    }
    if (robot.state === 'charging' && old.state !== 'charging') explain(robot, state, 'charging', 'Borne atteinte. La batterie augmente de 1,2 point par pas, jusqu’à 99 %.');
    if (robot.state === 'fault' && old.state !== 'fault') {
      emitSignal(state, { kind: 'fault', robotId: robot.id, x: robot.x, y: robot.y });
      explain(robot, state, 'fault', robot.cargo ? 'Robot immobilisé. Le colis reste à bord jusqu’à ma réparation.' : 'Robot immobilisé. Ma réservation a été libérée pour un autre robot.');
    }
    if (robot.state === 'blocked' || robot.state === 'waiting') {
      const kind = robot.cargo ? 'depot' : 'charger';
      const exists = state.tiles.some(t => t.kind === kind);
      explain(robot, state, 'waiting', exists ? (robot.cargo ? 'Aucun trajet utilisable vers un dépôt. Rouvrez un passage ou dégagez la zone.' : 'Aucune borne libre et accessible. J’attends qu’un accès se libère.') : (robot.cargo ? 'Aucun dépôt installé : le colis reste à bord.' : 'Aucune borne installée : ajoutez une station de recharge.'));
    } else if (robot.waitTicks > old.waitTicks && robot.x === old.x && robot.y === old.y && robot.destination) {
      explain(robot, state, 'waiting', robot.path.length ? 'La prochaine case est occupée. Je cède le passage et cherche un détour sûr.' : 'Destination inaccessible. Il faut dégager le passage avant de reprendre.');
    }
    const moved = robot.x !== old.x || robot.y !== old.y;
    const expected = moved ? old.path.slice(1) : old.path;
    const sameRoute = expected.length === robot.path.length && expected.every((p, i) => p.x === robot.path[i].x && p.y === robot.path[i].y);
    if (old.destination && robot.destination && old.destination.x === robot.destination.x && old.destination.y === robot.destination.y && old.path.length && !sameRoute && robot.path.length && !['loading', 'unloading'].includes(robot.state)) {
      const blockedByWall = old.path.some(p => state.tiles.some(t => (t.kind === 'wall' || t.kind === 'shelf') && t.x === p.x && t.y === p.y));
      const reason = blockedByWall ? 'Un équipement bloque l’ancien trajet.' : 'Une case est occupée : un autre chemin est disponible.';
      robot.previousRoute = { tick: state.tick, path: [{ x: old.x, y: old.y }, ...old.path], reason };
      explain(robot, state, 'reroute', `${reason} Nouveau trajet : ${robot.path.length} m restants.`);
      emitSignal(state, { kind: 'reroute', robotId: robot.id, x: robot.x, y: robot.y });
    }
  }
}
