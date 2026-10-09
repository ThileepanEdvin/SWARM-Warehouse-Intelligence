import {Engine} from './engine';
import type {Product,Tile} from './engine';
import {MAX_STOCK,safeQuantity} from './limits';
export type SupplyPlacement={id:string;location:string;quantity:number};
export type SupplyPlan={ok:boolean;message:string;placements:SupplyPlacement[];cost:number};
export const productReference=(name:string)=>name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toUpperCase().replace(/[^A-Z0-9]+/g,'_').slice(0,24);
/** Pure preview shared by the form and Copilot. Nothing is reserved or spent here. */
export function planSupply(engine:Engine,sku:string,quantity:number,sourceId?:string,emptyOnly=false,draft?:Product):SupplyPlan{
 const fail=(message:string):SupplyPlan=>({ok:false,message,placements:[],cost:0});
 if(!safeQuantity(quantity))return fail(`Quantité invalide : entier de 1 à ${MAX_STOCK.toLocaleString('fr-FR')} unités attendu.`);
 let p=engine.products.find(p=>p.sku===sku);if(p&&draft)return fail('Cette référence existe déjà. Sélectionnez le produit existant ou choisissez un autre SKU.');
 if(!p){if(!draft)return fail('Choisissez un produit ou renseignez le nouveau produit.');const copy=Engine.restore(engine.serialize()),result=copy.createProduct(draft.name,draft.sku,draft.value,draft.color,draft.size);if(!result.ok)return fail(result.message);p=draft;}
 const empty=(t:Tile)=>!engine.stockInfo(t).total&&!engine.stockInfo(t).reserved&&!engine.state.robots.some(r=>r.shelfId===t.id)&&!engine.state.orders.some(o=>o.sourceId===t.id&&o.status!=='completed');
 const access=(t:Tile)=>engine.state.robots.some(r=>!r.disabled&&engine.isAuthorized(r,{...t,sku})&&engine.canReachShelf(r,t));
 const capacity=(t:Tile)=>Math.min(MAX_STOCK,t.capacity===null?MAX_STOCK:Math.floor((t.capacity??500)/p.size))-(t.stock??0);
 const ordered=engine.state.tiles.filter(t=>t.kind==='shelf').sort((a,b)=>(a.location??a.id).localeCompare(b.location??b.id,'fr',{numeric:true}));
 let candidates:Tile[];
 if(sourceId){const t=ordered.find(t=>t.id===sourceId);if(!t)return fail('Choisissez un rayonnage existant sur la carte.');if(t.sku!==sku&&!empty(t))return fail(`${t.location} contient un autre produit ou une mission. Aucune marchandise ne sera remplacée.`);if(!access(t))return fail(`Aucun robot autorisé à récupérer ${p.name} dans ${t.location}. Modifiez ses permissions.`);if(capacity(t)<quantity)return fail(`Capacité insuffisante dans ${t.location} : ${Math.max(0,capacity(t))} unités supplémentaires possibles. Choisissez le stockage sans plafond ou un autre rayonnage.`);candidates=[t];}
 else candidates=[...(!emptyOnly?ordered.filter(t=>t.sku===sku&&!empty(t)):[]),...ordered.filter(empty)].filter(t=>access(t)&&capacity(t)>0);
 let remaining=quantity;const placements:SupplyPlacement[]=[];
 for(const t of candidates){const placed=Math.min(remaining,capacity(t));if(placed>0){placements.push({id:t.id,location:t.location??t.id,quantity:placed});remaining-=placed;}if(!remaining)break;}
 if(remaining)return fail('Aucun emplacement compatible avec assez de capacité et un accès autorisé. Configurez une capacité extensible ou créez un rayonnage via l’éditeur. Aucun stock ajouté.');
 const cost=engine.supplyCost(quantity);if(cost>0&&cost>engine.state.budget)return fail(`Budget insuffisant : ${cost.toLocaleString('fr-FR')} € nécessaires. Activez l’approvisionnement gratuit en Sandbox pour expérimenter.`);
 return {ok:true,message:placements.map(t=>`${t.location} : ${t.quantity.toLocaleString('fr-FR')} unités`).join(' · '),placements,cost};
}
