import { Engine } from './engine';
import { createIntelligentDemo } from './demo';
export function prepareArena(snapshot:string,scenario:string,count:number):{snapshot:string;warning:string}{
 if(!Number.isInteger(count)||count<1||count>200)throw new Error('Choisissez entre 1 et 200 commandes.');
 const presets:Record<string,{seed:number;batteries:number[];description:string}>={
  batteries:{seed:2026,batteries:[28,96,35,88,44,81],description:'Batteries déséquilibrées : 28 à 96 %, mêmes robots et charge pour les deux équipes.'},
  urgent:{seed:77,batteries:[95,95,95,95,95,95],description:'Commandes urgentes : les premières commandes sont basses ; puis normales et urgentes. Priority First peut dépasser les demandes anciennes.'},
  energy:{seed:2026,batteries:[95,89,83,77,71,65],description:'Forte consommation : stock principalement dans les colonnes éloignées, deux dépôts à l’ouest et un à l’est ; trajets à vide et chargés différents.'},
  fleet:{seed:77,batteries:[95,95,95,95,95,95],description:'Répartition de la flotte : six robots, stock abondant et commandes unitaires ; aucun quota de résultat imposé.'},
 };
 if(scenario!=='current'&&!presets[scenario]&&!['2026','77'].includes(scenario))throw new Error('Conditions initiales inconnues.');
 const preset=presets[scenario],engine=scenario==='current'?Engine.restore(snapshot):createIntelligentDemo(preset?.seed??Number(scenario));
 if(preset){engine.state.orders=[];engine.state.robots.forEach((r,i)=>engine.setBattery(r.id,preset.batteries[i]));for(const t of engine.state.tiles.filter(t=>t.kind==='shelf')){t.stock=100;t.capacity=500;}if(scenario==='energy'){for(const t of engine.state.tiles.filter(t=>t.kind==='shelf'))t.stock=t.x>=14?100:0;engine.state.tiles.filter(t=>t.kind==='depot').slice(0,2).forEach(t=>t.x=2);}}

 const open=engine.state.orders.filter(o=>o.status!=='completed');
 // Active missions cannot be silently truncated. Increasing preserves exact live work.
 if(count<open.length&&engine.state.robots.some(r=>r.orderId))throw new Error(`Ce scénario a ${open.length} commandes et des missions actives. Choisissez au moins ${open.length}, ou une graine prédéfinie.`);
 if(count<open.length)engine.state.orders=engine.state.orders.filter(o=>o.status==='completed'||open.slice(0,count).includes(o));
 let missing=count-engine.state.orders.filter(o=>o.status!=='completed').length;
 while(missing>0){const n=Math.min(100,missing);const result=engine.generateOrders(n);if(!result.ok)throw new Error(result.message);missing-=n;}
 if(scenario==='urgent')engine.state.orders.forEach((o,i)=>{o.quantity=1;o.priority=i<count/3?1:i<count*2/3?2:3;});if(scenario==='fleet')engine.state.orders.forEach(o=>o.quantity=1);
 const demand=new Map<string,number>();for(const o of engine.state.orders.filter(o=>o.status!=='completed'))demand.set(o.sku,(demand.get(o.sku)??0)+o.quantity-o.delivered);
 const shortages=[...demand].filter(([sku,quantity])=>engine.state.tiles.filter(t=>t.kind==='shelf'&&t.sku===sku).reduce((n,t)=>n+(t.stock??0),0)<quantity);
 return {snapshot:engine.serialize(),warning:(preset?preset.description+' ':'')+(shortages.length?`Stock limité pour ${shortages.map(([sku])=>sku).join(', ')} : les commandes impossibles resteront signalées. Aucune marchandise ajoutée artificiellement.`:'Stock total suffisant pour le travail demandé ; permissions et accessibilité restent appliquées.')};
}
