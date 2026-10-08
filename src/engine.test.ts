import { describe, expect, it } from 'vitest';
import { Engine, findPath } from './engine';

describe('navigation',()=>{
  it('finds shortest valid cardinal routes and rejects sealed goals',()=>{
    const walls=new Set(['1,0','1,1']);const path=findPath({x:0,y:0},{x:2,y:0},4,4,walls)!;
    expect(path).toHaveLength(6);expect(path.every(p=>!walls.has(`${p.x},${p.y}`))).toBe(true);
    expect(findPath({x:0,y:0},{x:2,y:0},3,3,new Set(['1,0','1,1','1,2']))).toBeNull();
  });
});
describe('warehouse invariants',()=>{
  it('completes real orders without collisions, negative stock, or double deliveries',()=>{
    const e=new Engine();for(let i=0;i<1200;i++){
      const before=e.state.robots.map(r=>({...r}));e.tick();
      expect(new Set(e.state.robots.map(r=>`${r.x},${r.y}`)).size).toBe(e.state.robots.length);
      for(const r of e.state.robots){expect(e.state.tiles.some(t=>(t.kind==='shelf'||t.kind==='wall')&&t.x===r.x&&t.y===r.y)).toBe(false);const old=before.find(b=>b.id===r.id)!;for(const b of before)if(b.id!==r.id)expect(r.x===b.x&&r.y===b.y&&e.state.robots.find(n=>n.id===b.id)!.x===old.x&&e.state.robots.find(n=>n.id===b.id)!.y===old.y&& (r.x!==old.x||r.y!==old.y)).toBe(false);}
      expect(e.state.tiles.filter(t=>t.kind==='shelf').every(t=>t.stock!>=0)).toBe(true);
      expect(e.state.orders.every(o=>o.delivered+o.reserved<=o.quantity&&o.reserved>=0)).toBe(true);
    }
    expect(e.metrics.completed).toBeGreaterThan(5);const revenue=e.state.revenue;e.tick(300);expect(e.state.revenue).toBe(revenue);
  });
  it('is deterministic and resumes exactly from a validated save',()=>{
    const a=new Engine(11),b=new Engine(11);a.tick(70);b.tick(70);expect(a.serialize()).toBe(b.serialize());const c=Engine.restore(a.serialize());a.tick(60);c.tick(60);expect(c.serialize()).toBe(a.serialize());
  });
  it('redistributes unpicked missions and preserves picked cargo during failures',()=>{
    const e=new Engine();e.tick();const r=e.state.robots.find(r=>r.orderId)!;const o=e.state.orders.find(o=>o.id===r.orderId)!;const reserved=o.reserved;e.faultRobot(r.id);expect(o.reserved).toBe(reserved-1);const position={x:r.x,y:r.y};e.tick(20);expect({x:r.x,y:r.y}).toEqual(position);
    e.repairRobot(r.id);for(let i=0;i<100;i++){e.tick();const loaded=e.state.robots.find(r=>r.cargo);if(loaded){const order=loaded.orderId;e.faultRobot(loaded.id);e.tick(10);expect(loaded.cargo).toBe(1);expect(loaded.orderId).toBe(order);e.repairRobot(loaded.id);e.tick(500);expect(e.state.orders.find(o=>o.id===order)!.status).toBe('completed');return;}}throw new Error('No robot picked cargo');
  });
  it('charges gradually and makes zero battery immobile',()=>{
    const e=new Engine();const r=e.state.robots[0];e.setBattery(r.id,0);const {x,y}=r;e.tick(40);expect([r.x,r.y,r.state]).toEqual([x,y,'fault']);e.repairRobot(r.id);e.chargeRobot(r.id);e.tick(100);expect(r.battery).toBeGreaterThan(25);
  });
  it('handles no robots, no depots, no chargers, unavailable stock and 100 orders',()=>{
    const e=new Engine();e.state.robots=[];e.generateOrders(100);e.tick(100);expect(e.metrics.completed).toBe(0);
    const f=new Engine();f.state.tiles=f.state.tiles.filter(t=>t.kind!=='depot'&&t.kind!=='charger');for(const r of f.state.robots)r.battery=10;f.tick(100);expect(f.metrics.completed).toBe(0);expect(f.state.orders.some(o=>o.status==='blocked')).toBe(true);expect(f.state.robots.every(r=>r.state==='waiting')).toBe(true);
  });
  it('validates inputs and budget without mutating purchases',()=>{
    const e=new Engine();expect(e.createOrder('Z').ok).toBe(false);expect(e.createOrder('A',-1).ok).toBe(false);expect(e.generateOrders(101).ok).toBe(false);expect(e.place('wall',5,3).ok).toBe(false);expect(e.place('wall',-1,0).ok).toBe(false);e.state.budget=0;const length=e.state.robots.length;expect(e.buyRobot().ok).toBe(false);expect(e.state.robots).toHaveLength(length);expect(e.restock('A',20).ok).toBe(false);
  });
  it('rejects corrupt, duplicate, and inconsistent save states',()=>{
    expect(()=>Engine.restore('{bad')).toThrow();expect(()=>Engine.restore('{}')).toThrow();const e=new Engine();e.state.robots[1].x=e.state.robots[0].x;e.state.robots[1].y=e.state.robots[0].y;expect(()=>Engine.restore(e.serialize())).toThrow();const f=new Engine();f.state.orders[0].reserved=1;expect(()=>Engine.restore(f.serialize())).toThrow();
  });
  it('recalculates paths after editing and forbids deleting reserved shelves',()=>{
    const e=new Engine();e.tick();const r=e.state.robots.find(r=>r.shelfId)!;const shelf=e.state.tiles.find(t=>t.id===r.shelfId)!;expect(e.removeAt(shelf.x,shelf.y).ok).toBe(false);expect(e.place('wall',20,6).ok).toBe(true);expect(e.state.robots.every(r=>r.path.length===0)).toBe(true);e.tick(400);expect(e.metrics.completed).toBeGreaterThan(0);
  });
  it('clears 100 additional orders with a saturated 24-robot fleet',()=>{
    const e=new Engine();e.state.budget=100000;while(e.state.robots.length<24)expect(e.buyRobot().ok).toBe(true);e.generateOrders(100);
    for(let i=0;i<1000;i++){e.tick();expect(new Set(e.state.robots.map(r=>`${r.x},${r.y}`)).size).toBe(24);}
    expect(e.metrics.completed).toBe(112);expect(e.state.orders.every(o=>o.reserved===0&&o.delivered===o.quantity)).toBe(true);expect(()=>Engine.restore(e.serialize())).not.toThrow();
  });
  it('stops charging and unloading when their equipment is removed',()=>{
    const e=new Engine();const r=e.state.robots[0];r.x=1;r.y=3;r.state='charging';r.battery=20;expect(e.removeAt(1,3).ok).toBe(true);e.tick();expect(r.state).toBe('to-charge');expect(r.battery).toBe(20);
    const f=new Engine();for(let i=0;i<100;i++){f.tick();const robot=f.state.robots.find(r=>r.state==='unloading');if(robot){const order=f.state.orders.find(o=>o.id===robot.orderId)!;const delivered=order.delivered;f.removeAt(robot.x,robot.y);f.tick();expect(order.delivered).toBe(delivered);expect(robot.cargo).toBe(1);expect(robot.state).toBe('carrying');return;}}throw new Error('Missing unloading cycle');
  });
  it('rejects damaged route and robot metadata in saved files',()=>{
    const e=new Engine();const raw=JSON.parse(e.serialize());raw.robots[0].history=null;expect(()=>Engine.restore(JSON.stringify(raw))).toThrow();const route=JSON.parse(e.serialize());route.robots[0].path=[{x:23,y:15}];expect(()=>Engine.restore(JSON.stringify(route))).toThrow();
  });
});
