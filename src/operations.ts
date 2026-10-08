import {Engine,PRICES} from './engine';
import type {Result,Tile} from './engine';
export function transaction(engine:Engine,apply:(copy:Engine)=>Result):Result{
 try{const copy=Engine.restore(engine.serialize()),result=apply(copy);if(!result.ok)return result;Engine.restore(copy.serialize());
 // Keep live entity identities for inspectors and existing business clients.
 const merge=<T extends {id:string}>(old:T[],next:T[])=>next.map(value=>{const current=old.find(item=>item.id===value.id);if(!current)return value;for(const field of Object.keys(current))if(!(field in value))delete (current as Record<string,unknown>)[field];return Object.assign(current,value)});
 copy.state.tiles=merge(engine.state.tiles,copy.state.tiles);copy.state.robots=merge(engine.state.robots,copy.state.robots);copy.state.orders=merge(engine.state.orders,copy.state.orders);
 Object.assign(engine.state,copy.state);return result;}catch{return {ok:false,message:'Opération refusée : état ou contraintes incohérents. Aucune modification appliquée.'};}
}
export function compatibleShelf(engine:Engine,sku:string,quantity:number,emptyOnly=false){const p=engine.products.find(p=>p.sku===sku),size=p?.size??1;
 const shelves=engine.state.tiles.filter(t=>t.kind==='shelf'&&(t.stock??0)+quantity<=(t.capacity??500)/size).sort((a,b)=>(a.location??a.id).localeCompare(b.location??b.id,'fr',{numeric:true}));
 const empty=(t:Tile)=>!engine.stockInfo(t).total&&!engine.stockInfo(t).reserved&&!engine.state.robots.some(r=>r.shelfId===t.id)&&!engine.state.orders.some(o=>o.sourceId===t.id&&o.status!=='completed');
 return (!emptyOnly?shelves.find(t=>t.sku===sku):undefined)??shelves.find(empty);
}
export function stockOperation(engine:Engine,sku:string,name:string,quantity:number,sourceId?:string,emptyOnly=false):Result{
 if(!Number.isInteger(quantity)||quantity<1||quantity>500)return {ok:false,message:'Quantité attendue : 1 à 500 unités.'};
 return transaction(engine,copy=>{let p=copy.products.find(p=>p.sku===sku);if(!p){const result=copy.createProduct(name,sku);if(!result.ok)return result;p=copy.products.find(p=>p.sku===sku)!;}
 const t=sourceId?copy.state.tiles.find(t=>t.kind==='shelf'&&t.id===sourceId):compatibleShelf(copy,sku,quantity,emptyOnly);if(!t)return {ok:false,message:'Aucun emplacement compatible avec assez de capacité.'};
 if(copy.state.budget<quantity*PRICES.stockUnit)return {ok:false,message:'Budget insuffisant.'};
 if(t.sku!==sku){const result=copy.configureShelf(t.id,sku,t.capacity??500);if(!result.ok)return result;}
 const result=copy.adjustStock(t.id,quantity);return result.ok?{ok:true,message:`${quantity} ${p.name} ajoutés dans ${t.location}. Stock total : ${t.stock} unités.`}:result;
 });
}
export function saveShelf(engine:Engine,id:string,sku:string,capacity:number,quantity:number,allowed?:string[],priority?:string):Result{return transaction(engine,copy=>{
 if(!Number.isInteger(quantity)||quantity<0||quantity>500)return {ok:false,message:'Ajout attendu : 0 à 500 unités.'};
 let result=copy.configureShelf(id,sku,capacity);if(!result.ok)return result;
 result=copy.setShelfPermissions(id,allowed,priority);if(!result.ok)return result;
 if(quantity){result=copy.adjustStock(id,quantity);if(!result.ok)return result;}
 return {ok:true,message:`Emplacement ${copy.state.tiles.find(t=>t.id===id)?.location} enregistré${quantity?` · +${quantity} unités`:''}.`};
});}
