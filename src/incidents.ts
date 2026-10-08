import { Engine } from './engine';
import type { Result } from './engine';
import { blockDemoRoute } from './demo';
export const INCIDENTS=['Robot en panne','Batterie critique','Passage bloqué','Commandes massives','Rupture de stock','Station saturée','Dépôt inaccessible','Robot immobilisé','Pannes simultanées','Zone interdite'] as const;
export type IncidentName=typeof INCIDENTS[number];
export function triggerIncident(engine:Engine,name:IncidentName,id?:string,count=3):Result{
 const state=engine.state,r=state.robots.find(r=>r.id===id)??state.robots.find(r=>r.state!=='fault'),shelf=state.tiles.find(t=>t.id===id&&t.kind==='shelf')??state.tiles.find(t=>t.kind==='shelf');
 if(name==='Robot en panne'||name==='Robot immobilisé')return r?engine.faultRobot(r.id):{ok:false,message:'Aucun robot.'};
 if(name==='Batterie critique')return r?engine.setBattery(r.id,5):{ok:false,message:'Aucun robot.'};
 if(name==='Passage bloqué')return blockDemoRoute(engine,r?.id??null);
 if(name==='Commandes massives')return engine.generateOrders(count);
 if(name==='Rupture de stock'){if(!shelf)return {ok:false,message:'Aucun rayonnage.'};const available=engine.stockInfo(shelf).available;return available?engine.adjustStock(shelf.id,-available):{ok:false,message:'Stock disponible déjà nul. Les réservations sont conservées.'};}
 if(name==='Zone interdite')return shelf?engine.setShelfPermissions(shelf.id,[]):{ok:false,message:'Aucun rayonnage.'};
 if(name==='Pannes simultanées'){const robots=state.robots.filter(r=>r.state!=='fault').slice(0,count);robots.forEach(r=>engine.faultRobot(r.id));return {ok:robots.length>0,message:`${robots.length} robots arrêtés ; colis sécurisés et réservations non prélevées libérées.`};}
 if(name==='Station saturée'){const chargers=state.tiles.filter(t=>t.kind==='charger');if(!chargers.length)return {ok:false,message:'Aucune borne. Installez-en une.'};for(const t of chargers.slice(1))engine.removeAt(t.x,t.y);let affected=0;for(const r of state.robots.filter(r=>r.state!=='fault'&&!r.cargo)){engine.setBattery(r.id,10);if(engine.chargeRobot(r.id).ok)affected++;}return {ok:affected>0,message:`Une borne conservée, ${affected} demandes de recharge. Les robots chargés conservent leur livraison.`};}
 // Close real approaches without deleting an explicitly chosen destination.
 const depots=state.tiles.filter(t=>t.kind==='depot');let installed=0;
 for(const t of depots)for(const p of [{x:t.x-1,y:t.y},{x:t.x+1,y:t.y},{x:t.x,y:t.y-1},{x:t.x,y:t.y+1}])if(engine.place('wall',p.x,p.y).ok)installed++;
 return {ok:installed>0,message:`${installed} obstacles installés près des dépôts. Les cases occupées sont conservées ; un accès peut rester ouvert. Les colis restent sécurisés. Retirez les obstacles pour rétablir les trajets.`};
}
export function diagnose(engine:Engine){const s=engine.state;return {robots:s.robots.filter(r=>r.state==='fault'||r.battery<20||r.waitingNow||['blocked','waiting'].includes(r.state)),orders:s.orders.filter(o=>o.status==='blocked'||s.robots.some(r=>r.orderId===o.id&&r.state==='fault')),empty:s.tiles.filter(t=>t.kind==='shelf'&&engine.stockInfo(t).available===0),chargers:s.tiles.filter(t=>t.kind==='charger'),depots:s.tiles.filter(t=>t.kind==='depot')};}
