import {Engine} from './engine';
import {planSupply} from './supply';
import {MAX_STOCK} from './limits';
import type {Result,Product} from './engine';
export function transaction(engine:Engine,apply:(copy:Engine)=>Result):Result{
 try{const copy=Engine.restore(engine.serialize()),result=apply(copy);if(!result.ok)return result;Engine.restore(copy.serialize());
 // Keep live entity identities for inspectors and existing business clients.
 const merge=<T extends {id:string}>(old:T[],next:T[])=>next.map(value=>{const current=old.find(item=>item.id===value.id);if(!current)return value;for(const field of Object.keys(current))if(!(field in value))delete (current as Record<string,unknown>)[field];return Object.assign(current,value)});
 copy.state.tiles=merge(engine.state.tiles,copy.state.tiles);copy.state.robots=merge(engine.state.robots,copy.state.robots);copy.state.orders=merge(engine.state.orders,copy.state.orders);
 Object.assign(engine.state,copy.state);return result;}catch{return {ok:false,message:'Opération refusée : état ou contraintes incohérents. Aucune modification appliquée.'};}
}
export function compatibleShelf(engine:Engine,sku:string,quantity:number,emptyOnly=false){const p=engine.products.find(p=>p.sku===sku)??{sku,name:sku,value:85,color:'#75d7e5',size:1};const plan=planSupply(engine,sku,quantity,undefined,emptyOnly,engine.products.some(p=>p.sku===sku)?undefined:p);return plan.ok?engine.state.tiles.find(t=>t.id===plan.placements[0].id):undefined;}
export function stockOperation(engine:Engine,sku:string,name:string,quantity:number,sourceId?:string,emptyOnly=false,draft?:Product):Result{
 return transaction(engine,copy=>{const plan=planSupply(copy,sku,quantity,sourceId,emptyOnly,copy.products.some(p=>p.sku===sku)?draft:draft??{sku,name,value:85,color:'#75d7e5',size:1});if(!plan.ok)return plan;
 let p=copy.products.find(p=>p.sku===sku);if(!p){const product=draft??{sku,name,value:85,color:'#75d7e5',size:1};const result=copy.createProduct(product.name,product.sku,product.value,product.color,product.size);if(!result.ok)return result;p=copy.products.find(p=>p.sku===sku)!;}
 for(const placement of plan.placements){const t=copy.state.tiles.find(t=>t.id===placement.id)!;if(t.sku!==sku){const configured=copy.configureShelf(t.id,sku,t.capacity??null);if(!configured.ok)return configured;}const result=copy.adjustStock(t.id,placement.quantity);if(!result.ok)return result;}
 const t=copy.state.tiles.find(t=>t.id===plan.placements[0].id)!;return {ok:true,message:plan.placements.length===1?`${quantity} ${p.name} ajoutés dans ${t.location}. Stock total : ${t.stock} unités.`:`${quantity} ${p.name} ajoutés : ${plan.message}.`};
 });
}
export function saveShelfParameters(engine:Engine,id:string,sku:string,capacity:number|null,allowed?:string[],priority?:string){return saveShelf(engine,id,sku,capacity,0,allowed,priority);}
export function saveShelf(engine:Engine,id:string,sku:string,capacity:number|null,quantity:number,allowed?:string[],priority?:string):Result{return transaction(engine,copy=>{
 if(!Number.isInteger(quantity)||quantity<0||quantity>MAX_STOCK)return {ok:false,message:`Ajout attendu : 0 à ${MAX_STOCK} unités.`};
 let result=copy.configureShelf(id,sku,capacity);if(!result.ok)return result;
 result=copy.setShelfPermissions(id,allowed,priority);if(!result.ok)return result;
 if(quantity){result=copy.adjustStock(id,quantity);if(!result.ok)return result;}
 return {ok:true,message:`Emplacement ${copy.state.tiles.find(t=>t.id===id)?.location} enregistré${quantity?` · +${quantity} unités`:''}.`};
});}
