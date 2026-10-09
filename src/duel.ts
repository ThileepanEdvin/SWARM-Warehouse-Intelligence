import {isStrategy,type StrategyId} from './arenaStrategies';
import { Engine } from './engine';

export interface DuelMetrics { completed: number; distance: number; energy: number; averageTime: number; waiting: number; stalled: number; costs: number; revenue: number; pending:number; busy:number; impossible:number; total:number; queued:number; charging:number; urgent:number; urgentAverageTime:number; critical:number; faults:number; deliveredUnits:number; fairness:number; distribution:{code:string;assignments:number;deliveries:number;workSeconds:number;distance:number}[] }
export type DuelWinner = 'nearest' | 'balanced' | 'tie';

/** Both clones receive exactly one logical tick together. The live engine is never referenced. */
export class DuelSession {
  readonly snapshot: string;
  readonly horizon: number;
  nearest: Engine;
  balanced: Engine;
  elapsed = 0;
  private baseline: Engine;
  readonly strategyA:StrategyId;
  readonly strategyB:StrategyId;
  private readonly advanced:boolean;

  constructor(snapshot: string, horizon = 240, strategyA?:StrategyId, strategyB?:StrategyId) {
    if (!Number.isInteger(horizon) || horizon < 20 || horizon > 1200) throw new Error('Le duel doit durer de 20 à 1 200 pas.');
    this.strategyA=strategyA??'nearest';this.strategyB=strategyB??'balanced';this.advanced=strategyA!==undefined||strategyB!==undefined;
    if(!isStrategy(this.strategyA)||!isStrategy(this.strategyB))throw new Error('Stratégie inconnue.');
    this.snapshot = snapshot;
    this.horizon = horizon;
    this.baseline = Engine.restore(snapshot);
    this.nearest = Engine.restore(snapshot);
    this.balanced = Engine.restore(snapshot);
    if(this.advanced){this.nearest.configureArenaStrategy(this.strategyA);this.balanced.configureArenaStrategy(this.strategyB);}else{this.nearest.state.strategy='nearest';this.balanced.state.strategy='balanced';}
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
    if(this.advanced){this.nearest.configureArenaStrategy(this.strategyA);this.balanced.configureArenaStrategy(this.strategyB);}else{this.nearest.state.strategy='nearest';this.balanced.state.strategy='balanced';}
    this.elapsed = 0;
  }
  metrics(strategy: 'nearest' | 'balanced'): DuelMetrics {
    const engine = this[strategy];
    const initialDone = new Set(this.baseline.state.orders.filter(o => o.status === 'completed').map(o => o.id));
    const done = engine.state.orders.filter(o => o.status === 'completed' && !initialDone.has(o.id));
    const preparation=(o:typeof done[number])=>(o.completedAt!-(this.advanced?Math.max(this.baseline.state.tick,o.createdAt):o.createdAt))*.5;
    const urgent=done.filter(o=>o.priority===3);
    const distribution=engine.state.robots.map(r=>{const work=engine.arenaWork.get(r.id);return {code:r.code??r.id,assignments:work?.assignments??0,deliveries:work?.deliveries??0,workSeconds:(work?.workTicks??0)*.5,distance:r.distance-(this.baseline.state.robots.find(b=>b.id===r.id)?.distance??0)};});
    const deliveredUnits=engine.state.orders.reduce((n,o)=>n+o.delivered-(this.baseline.state.orders.find(b=>b.id===o.id)?.delivered??0),0);
    const sum=distribution.reduce((n,r)=>n+r.deliveries,0),squares=distribution.reduce((n,r)=>n+r.deliveries**2,0);
    return {
      total:this.baseline.state.orders.filter(o=>o.status!=='completed').length,queued:engine.state.orders.filter(o=>o.status==='pending').length,charging:engine.state.robots.filter(r=>r.state==='charging').length,urgent:urgent.length,urgentAverageTime:urgent.length?urgent.reduce((n,o)=>n+preparation(o),0)/urgent.length:0,critical:engine.state.robots.filter(r=>r.battery<=15).length,faults:engine.state.robots.filter(r=>r.state==='fault').length,deliveredUnits,distribution,fairness:squares?sum*sum/(distribution.length*squares)*100:0,
      completed: done.length, pending:engine.state.orders.filter(o=>o.status!=='completed').length, busy:engine.state.robots.filter(r=>r.orderId).length, impossible:engine.state.orders.filter(o=>o.status==='blocked').length,
      distance: engine.state.distance - this.baseline.state.distance,
      energy: engine.state.energy - this.baseline.state.energy,
      averageTime: done.length ? done.reduce((sum, o) => sum + preparation(o), 0) / done.length : 0,
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

export function criterionWinner(a:number,b:number,lower=false):DuelWinner{if(Math.abs(a-b)<1e-8)return 'tie';return (lower?a<b:a>b)?'nearest':'balanced';}
