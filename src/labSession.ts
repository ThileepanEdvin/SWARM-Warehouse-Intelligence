import {Engine} from './engine';
import type {Result} from './engine';
import {triggerIncident} from './incidents';
import type {IncidentName} from './incidents';
import {transaction} from './operations';
export type LabIncident={id:string;name:IncidentName;target:string;tick:number;robots:string[];shelves:string[];walls:string[];orders:string[];message:string};
export type LabParameters={target?:string;count?:number;battery?:number;cell?:{x:number;y:number};sku?:string};
export function applyLabIncident(engine:Engine,name:IncidentName,parameters:LabParameters,records:LabIncident[]):Result{
 if(records.filter(r=>!incidentResolved(engine,r)).length>=12)return {ok:false,message:'Limite de 12 incidents actifs. Résolvez un incident ou restaurez le laboratoire.'};
 if(['Commandes massives','Pannes simultanées'].includes(name)&&(!Number.isInteger(parameters.count??3)||(parameters.count??3)<1||(parameters.count??3)>(name==='Commandes massives'?100:engine.state.robots.length)))return {ok:false,message:'Nombre invalide pour cet incident.'};
 if(name==='Batterie critique'&&(!Number.isFinite(parameters.battery??5)||(parameters.battery??5)<0||(parameters.battery??5)>20))return {ok:false,message:'La batterie critique doit être comprise entre 0 et 20 %.'};
 if(records.length>=100)return {ok:false,message:'Limite de 100 incidents par expérience. Restaurez le laboratoire.'};
 if(['Robot en panne','Robot immobilisé','Batterie critique'].includes(name)&&!engine.state.robots.some(r=>r.id===parameters.target))return {ok:false,message:'Sélectionnez un robot existant.'};
 if(['Rupture de stock','Zone interdite'].includes(name)&&!parameters.sku&&!engine.state.tiles.some(t=>t.kind==='shelf'&&t.id===parameters.target))return {ok:false,message:'Sélectionnez un rayonnage existant.'};
 if(name==='Zone interdite'&&engine.state.tiles.find(t=>t.id===parameters.target)?.allowedRobots?.length===0)return {ok:false,message:'Ce rayonnage est déjà interdit.'};
 if(name==='Batterie critique'&&engine.state.robots.find(r=>r.id===parameters.target)?.battery===(parameters.battery??5))return {ok:false,message:'Ce robot possède déjà ce niveau de batterie.'};
 const before=Engine.restore(engine.serialize()),p=parameters;let record:LabIncident|undefined;
 const result=transaction(engine,copy=>{
  let result:Result;
  if(name==='Passage bloqué')result=p.cell?copy.place('wall',p.cell.x,p.cell.y):{ok:false,message:'Cliquez sur une case libre de la carte.'};
  else if(name==='Batterie critique')result=p.target?copy.setBattery(p.target,p.battery??5):{ok:false,message:'Sélectionnez un robot.'};
  else if(name==='Rupture de stock'&&p.sku){let removed=0;for(const t of copy.state.tiles.filter(t=>t.kind==='shelf'&&t.sku===p.sku)){const available=copy.stockInfo(t).available;if(available){const r=copy.adjustStock(t.id,-available);if(!r.ok)return r;removed+=available;}}result={ok:removed>0,message:removed?`${removed} unités disponibles retirées. Les réservations sont conservées.`:'Aucun stock disponible à retirer.'};}
  else if(name==='Station saturée'){const station=copy.state.tiles.find(t=>t.id===p.target&&t.kind==='charger');if(!station)return {ok:false,message:'Sélectionnez une borne.'};for(const t of copy.state.tiles.filter(t=>t.kind==='charger'&&t.id!==station.id)){const r=copy.removeAt(t.x,t.y);if(!r.ok)return r;}let affected=0;for(const r of copy.state.robots.filter(r=>!r.disabled&&r.state!=='fault'&&!r.cargo)){copy.setBattery(r.id,10);if(copy.chargeRobot(r.id).ok)affected++;}result={ok:affected>0,message:`${affected} robots demandent la borne sélectionnée. Les autres bornes ont été retirées pour cette expérience restaurable.`};}
  else if(name==='Dépôt inaccessible'){const t=copy.state.tiles.find(t=>t.id===p.target&&t.kind==='depot');if(!t)return {ok:false,message:'Sélectionnez un dépôt.'};let installed=0;for(const cell of [{x:t.x-1,y:t.y},{x:t.x+1,y:t.y},{x:t.x,y:t.y-1},{x:t.x,y:t.y+1}])if(copy.place('wall',cell.x,cell.y).ok)installed++;result={ok:installed>0,message:`${installed} obstacles placés aux abords du dépôt. Les cases occupées restent intactes ; vérifiez si un accès subsiste.`};}
  else result=triggerIncident(copy,name,p.target,p.count??3);
  if(!result.ok)return result;
  const robots=copy.state.robots.filter(r=>{const old=before.state.robots.find(o=>o.id===r.id);return !old||old.state!==r.state||old.battery!==r.battery;}).map(r=>r.id);
  const shelves=copy.state.tiles.filter(t=>t.kind==='shelf'&&JSON.stringify(t)!==JSON.stringify(before.state.tiles.find(o=>o.id===t.id))).map(t=>t.id);
  const walls=copy.state.tiles.filter(t=>t.kind==='wall'&&!before.state.tiles.some(o=>o.id===t.id)).map(t=>t.id);
  for(const r of before.state.robots)if(r.path.some(point=>copy.state.tiles.some(t=>walls.includes(t.id)&&t.x===point.x&&t.y===point.y))&&!robots.includes(r.id))robots.push(r.id);
  const skus=new Set(copy.state.tiles.filter(t=>shelves.includes(t.id)).map(t=>t.sku));
  const orders=copy.state.orders.filter(o=>!before.state.orders.some(old=>old.id===o.id)||before.state.robots.some(r=>robots.includes(r.id)&&r.orderId===o.id)||o.status!=='completed'&&(shelves.includes(o.sourceId??'')||skus.has(o.sku))||(name==='Dépôt inaccessible'&&o.status!=='completed'&&(!o.depotId||o.depotId===p.target))).map(o=>o.id);
  record={id:`incident-${records.length+1}-${copy.state.tick}`,name,target:p.cell?`Case ${p.cell.x+1}, ${p.cell.y+1}`:p.sku?copy.products.find(x=>x.sku===p.sku)?.name??p.sku:copy.state.robots.find(r=>r.id===p.target)?.code??copy.state.tiles.find(t=>t.id===p.target)?.location??p.target??'Scénario collectif',tick:copy.state.tick,robots,shelves,walls,orders,message:result.message};
  return result;
 });
 if(result.ok&&record)records.push(record);return result;
}
export function incidentResolved(engine:Engine,record:LabIncident){const s=engine.state;
 if(['Robot en panne','Robot immobilisé','Pannes simultanées'].includes(record.name))return record.robots.every(id=>s.robots.find(r=>r.id===id)?.state!=='fault');
 if(record.name==='Batterie critique'||record.name==='Station saturée')return record.robots.every(id=>{const r=s.robots.find(r=>r.id===id);return !r||r.battery>25&&!['waiting','to-charge','charging'].includes(r.state)});
 if(record.name==='Passage bloqué'||record.name==='Dépôt inaccessible')return record.walls.every(id=>!s.tiles.some(t=>t.id===id));
 if(record.name==='Rupture de stock')return record.shelves.every(id=>{const t=s.tiles.find(t=>t.id===id);return !t||engine.stockInfo(t).available>0});
 if(record.name==='Zone interdite')return record.shelves.every(id=>{const t=s.tiles.find(t=>t.id===id);return !t||s.robots.some(r=>!r.disabled&&engine.isAuthorized(r,t))});
 return record.orders.every(id=>s.orders.find(o=>o.id===id)?.status==='completed');
}
