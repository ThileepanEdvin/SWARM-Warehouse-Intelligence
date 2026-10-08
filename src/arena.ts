import { Engine } from './engine';
import { createIntelligentDemo } from './demo';
export function prepareArena(snapshot:string,scenario:string,count:number):{snapshot:string;warning:string}{
 if(!Number.isInteger(count)||count<1||count>200)throw new Error('Choisissez entre 1 et 200 commandes.');
 const engine=scenario==='current'?Engine.restore(snapshot):createIntelligentDemo(Number(scenario));
 const open=engine.state.orders.filter(o=>o.status!=='completed');
 // Active missions cannot be silently truncated. Increasing preserves exact live work.
 if(count<open.length&&engine.state.robots.some(r=>r.orderId))throw new Error(`Ce scénario a ${open.length} commandes et des missions actives. Choisissez au moins ${open.length}, ou une graine prédéfinie.`);
 if(count<open.length)engine.state.orders=engine.state.orders.filter(o=>o.status==='completed'||open.slice(0,count).includes(o));
 let missing=count-engine.state.orders.filter(o=>o.status!=='completed').length;
 while(missing>0){const n=Math.min(100,missing);const result=engine.generateOrders(n);if(!result.ok)throw new Error(result.message);missing-=n;}
 const demand=new Map<string,number>();for(const o of engine.state.orders.filter(o=>o.status!=='completed'))demand.set(o.sku,(demand.get(o.sku)??0)+o.quantity-o.delivered);
 const shortages=[...demand].filter(([sku,quantity])=>engine.state.tiles.filter(t=>t.kind==='shelf'&&t.sku===sku).reduce((n,t)=>n+(t.stock??0),0)<quantity);
 return {snapshot:engine.serialize(),warning:shortages.length?`Stock limité pour ${shortages.map(([sku])=>sku).join(', ')} : les commandes impossibles resteront signalées. Aucune marchandise ajoutée artificiellement.`:'Stock total suffisant pour le travail demandé ; permissions et accessibilité restent appliquées.'};
}
