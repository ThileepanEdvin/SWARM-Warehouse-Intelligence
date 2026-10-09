import { describe, expect, it } from 'vitest';
import { Engine } from './engine';
import { createIntelligentDemo, selectDemoRobot, blockDemoRoute, faultDemoRobot, chargeDemoRobot } from './demo';

describe('real decision instrumentation', () => {
  it('records the actual dispatch score and leaves quantities governed by the engine', () => {
    const engine = createIntelligentDemo();
    engine.tick();
    for (const robot of engine.state.robots.filter(r => r.orderId)) {
      const assignment = robot.assignment!;
      expect(assignment.candidates).toBeGreaterThan(0);
      expect(assignment.score).toBeCloseTo(assignment.distance + (100 - assignment.battery) * .12);
      expect(robot.decision?.kind).toBe('assignment');
    }
    expect(engine.state.tiles.filter(t => t.kind === 'shelf').reduce((n, t) => n + t.stock!, 0)).toBe(480);
  });
  it('blocks a real route, preserves its trace and replans around the installed wall', () => {
    const engine = createIntelligentDemo(); engine.tick();
    const id = selectDemoRobot(engine);
    const result = blockDemoRoute(engine, id);
    expect(result.ok).toBe(true);
    const robot = engine.state.robots.find(r => r.id === result.robotId)!;
    expect(robot.previousRoute?.path.some(p => p.x === result.cell!.x && p.y === result.cell!.y)).toBe(true);
    expect(robot.previousRoute?.reason).toContain('bloque');
    engine.tick();
    expect(robot.path.some(p => p.x === result.cell!.x && p.y === result.cell!.y)).toBe(false);
    expect(() => Engine.restore(engine.serialize())).not.toThrow();
  });
  it('shows fault redistribution from reservations, not from a decorative event', () => {
    const engine = createIntelligentDemo(); engine.tick();
    const result = faultDemoRobot(engine);
    expect(result.ok).toBe(true);
    const failed = engine.state.robots.find(r => r.id === result.robotId)!;
    const position = [failed.x, failed.y];
    const failureTick = engine.state.tick;
    engine.tick(150);
    expect([failed.x, failed.y]).toEqual(position);
    expect(engine.state.orders.find(o => o.id === result.orderId)?.assignments?.some(a => a.robotId !== failed.id && a.tick > failureTick)).toBe(true);
    expect(failed.decision?.kind).toBe('fault');
  });
  it('uses real charge and delivery transitions for effects, freezes effects with logical time', () => {
    const engine = createIntelligentDemo();
    const result = chargeDemoRobot(engine);
    expect(result.ok).toBe(true);
    const robot = engine.state.robots.find(r => r.id === result.robotId)!;
    let charging = false;
    for (let i = 0; i < 150; i++) { engine.tick(); charging ||= robot.state === 'charging'; }
    expect(charging).toBe(true);
    const rewards = (engine.state.signals ?? []).filter(s => s.kind === 'reward');
    expect(engine.state.orders.some(o => o.status === 'completed')).toBe(true);
    for (const reward of rewards) expect(engine.state.orders.find(o => o.id === reward.orderId)?.income).toBe(reward.amount);
    const before = engine.serialize();
    expect(engine.serialize()).toBe(before);
    const clone = Engine.restore(before); engine.tick(20); clone.tick(20);
    expect(clone.serialize()).toBe(engine.serialize());
  });
  it('accepts old snapshots and rejects damaged new visual metadata', () => {
    const original = new Engine(42,{demo:true}); original.tick(10);
    const data = JSON.parse(original.serialize());
    delete data.signals; delete data.signalCounter;
    for (const robot of data.robots) { delete robot.assignment; delete robot.decision; delete robot.previousRoute; }
    const restored = Engine.restore(JSON.stringify(data)); restored.tick();
    expect(restored.state.tick).toBe(11);
    const invalid = JSON.parse(original.serialize()); invalid.robots[0].previousRoute = { tick: 2, reason: 'x', path: [{ x: -1, y: 0 }] };
    expect(() => Engine.restore(JSON.stringify(invalid))).toThrow();
    const brokenSignal = JSON.parse(original.serialize()); brokenSignal.signals = [{ id: 'a', tick: 10, kind: 'reward', x: 99, y: 0 }]; brokenSignal.signalCounter = 1;
    expect(() => Engine.restore(JSON.stringify(brokenSignal))).toThrow();
  });
  it('limits workloads, rejects duplicate placements, and handles simultaneous faults', () => {
    const engine = new Engine(42,{demo:true}); engine.state.budget = 100000;
    while (engine.state.robots.length < 24) expect(engine.buyRobot().ok).toBe(true);
    expect(engine.buyRobot().ok).toBe(false);
    engine.generateOrders(100); engine.generateOrders(100);
    expect(engine.state.orders.filter(o => o.status !== 'completed')).toHaveLength(200);
    expect(engine.createOrder('A').ok).toBe(false);
    engine.tick();
    for (const robot of engine.state.robots.slice(0, 8)) engine.setBattery(robot.id, 0);
    engine.tick(20);
    expect(engine.state.robots.filter(r => r.state === 'fault')).toHaveLength(8);
    expect(new Set(engine.state.robots.map(r => `${r.x},${r.y}`)).size).toBe(24);
    expect(() => Engine.restore(engine.serialize())).not.toThrow();
  });
  it('explains unavailable stock and a sealed warehouse, then recovers after reopening', () => {
    const shortage = new Engine(42,{demo:true}); shortage.state.orders = [];
    shortage.createOrder('A', 3);
    shortage.state.tiles.filter(t => t.kind === 'shelf').forEach(t => { t.stock = 0; });
    shortage.tick(10);
    expect(shortage.state.orders[0].status).toBe('blocked');
    expect(shortage.state.orders[0].blockReason).toContain('Stock');
    shortage.restock('A', 20); shortage.tick(300);
    expect(shortage.state.orders[0].status).toBe('completed');
    const sealed = new Engine(42,{demo:true}); sealed.state.orders = [];
    sealed.createOrder('A', 1);
    for (let y = 0; y < 16; y++) expect(sealed.place('wall', 4, y).ok).toBe(true);
    sealed.tick(20);
    expect(sealed.state.orders[0].blockReason).toContain('trajet');
    expect(sealed.state.robots.every(r => r.x < 4)).toBe(true);
    sealed.removeAt(4, 6); sealed.tick(300);
    expect(sealed.state.orders[0].status).toBe('completed');
  });
  it('shares a single charging station without sharing a cell', () => {
    const engine = new Engine(42,{demo:true});
    const chargers = engine.state.tiles.filter(t => t.kind === 'charger');
    chargers.slice(1).forEach(t => engine.removeAt(t.x, t.y));
    engine.state.robots.forEach(r => engine.setBattery(r.id, 10));
    let queued = false;
    for (let tick = 0; tick < 200; tick++) {
      engine.tick();
      expect(engine.state.robots.filter(r => r.state === 'charging').length).toBeLessThanOrEqual(1);
      expect(new Set(engine.state.robots.map(r => `${r.x},${r.y}`)).size).toBe(engine.state.robots.length);
      queued ||= engine.state.robots.some(r => r.waitingNow);
    }
    expect(queued).toBe(true);
  });
});
