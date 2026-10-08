import {PRICES} from './engine';
import type { Engine, Result } from './engine';
export type CopilotPlan={message:string;mutates:boolean;execute?:()=>Result};
const fold=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[«»".!?]/g,'').trim();
/** Local intent parser: ambiguity never triggers a best-guess mutation. */
export function parseCopilot(engine:Engine,input:string):CopilotPlan{
 const text=fold(input).replace(/\s+/g,' ');const fail=(message:string):CopilotPlan=>({message,mutates:false});
 const action=(message:string,execute:()=>Result):CopilotPlan=>({message,mutates:true,execute});
 const product=(name:string)=>engine.products.filter(p=>fold(p.name)===fold(name)||fold(p.sku)===fold(name));
 const shelf=(code:string)=>engine.state.tiles.find(t=>t.kind==='shelf'&&fold(t.location??t.id)===fold(code));
 const robot=(code:string)=>engine.state.robots.find(r=>fold(r.code??r.id)===fold(code)||fold(r.id)===fold(code));
 let m=text.match(/^cree (?:un|le) produit (.+)$/);
 if(m){const name=input.trim().replace(/[.!?]$/,'').replace(/^cr[eé]e (?:un|le) produit /i,'');if(product(name).length)return fail('Ce produit existe déjà.');const sku=name.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^A-Z0-9]+/g,'_').slice(0,24);return action(`Créer « ${name} », SKU ${sku}, valeur 85 €, encombrement 1.`,()=>engine.createProduct(name,sku));}
 m=text.match(/^(?:mets|ajoute) (\d+) (.+) dans ([a-z]+-\d+)$/);
 if(m){const quantity=Number(m[1]),matches=product(m[2]),t=shelf(m[3]);if(matches.length!==1||!t)return fail('Produit ou emplacement inconnu. Créez le produit et utilisez un identifiant exact, par exemple A-1.');const p=matches[0],info=engine.stockInfo(t);if(t.sku!==p.sku&&(info.total||info.reserved))return fail(`${t.location} contient déjà un autre produit. Retirez ses marchandises non réservées avant de le changer.`);if(quantity<1||quantity>500||(info.total+quantity)*p.size>t.capacity!)return fail('Quantité invalide ou capacité dépassée.');if(engine.state.budget<quantity*PRICES.stockUnit)return fail('Budget insuffisant pour les marchandises.');return action(`Ajouter ${quantity} ${p.name} dans ${t.location}, coût ${quantity*PRICES.stockUnit} €.`,()=>{if(t.sku!==p.sku){const result=engine.configureShelf(t.id,p.sku,t.capacity!);if(!result.ok)return result;}return engine.adjustStock(t.id,quantity)});}
 m=text.match(/^seul (r\d+) peut travailler sur ([a-z]+-\d+)$/);
 if(m){const r=robot(m[1]),t=shelf(m[2]);if(!r||!t)return fail('Robot ou emplacement inconnu.');return action(`Réserver ${t.location} exclusivement à ${r.code}. Les missions non prélevées devenues interdites seront libérées.`,()=>engine.setShelfPermissions(t.id,[r.id],t.priorityRobot===r.id?r.id:undefined));}
 m=text.match(/^mets (r\d+) prioritaire sur ([a-z]+-\d+)$/);
 if(m){const r=robot(m[1]),t=shelf(m[2]);if(!r||!t)return fail('Robot ou emplacement inconnu.');if(t.allowedRobots&&!t.allowedRobots.includes(r.id))return fail('Ce robot n’est pas autorisé sur cet emplacement.');return action(`Donner la priorité à ${r.code} sur ${t.location}.`,()=>engine.setShelfPermissions(t.id,t.allowedRobots,r.id));}
 m=text.match(/^combien de (.+) reste(?:-t-il| t il)?$/);
 if(m){const matches=product(m[1]);if(matches.length!==1)return fail('Produit inconnu ou ambigu. Utilisez son nom exact ou son SKU.');const p=matches[0],tiles=engine.state.tiles.filter(t=>t.sku===p.sku&&t.kind==='shelf');return fail(`${p.name} : ${tiles.reduce((n,t)=>n+engine.stockInfo(t).available,0)} disponibles, ${tiles.reduce((n,t)=>n+engine.stockInfo(t).reserved,0)} réservés, ${tiles.reduce((n,t)=>n+(t.stock??0),0)} au total.`);}
 if(text==='montre les emplacements presque vides'){const tiles=engine.state.tiles.filter(t=>t.kind==='shelf'&&engine.stockInfo(t).available<5);return fail(tiles.length?tiles.map(t=>`${t.location} : ${engine.stockInfo(t).available} disponibles`).join(' · '):'Aucun emplacement avec moins de 5 unités disponibles.');}
 m=text.match(/^cree une commande(?: (urgente|normale|basse))? de (\d+) (.+?)(?: avec (r\d+))?$/);
 if(m){const matches=product(m[3]),r=m[4]?robot(m[4]):undefined;if(matches.length!==1||m[4]&&!r)return fail('Produit ou robot inconnu.');const p=matches[0],quantity=Number(m[2]),priority=m[1]==='urgente'?3:m[1]==='basse'?1:2;const eligible=engine.eligibleRobots(p.sku,{robotId:r?.id});const stock=engine.state.tiles.filter(t=>t.kind==='shelf'&&t.sku===p.sku&&(!r||engine.isAuthorized(r,t))).reduce((n,t)=>n+engine.stockInfo(t).available,0);if(quantity<1||quantity>50||stock<quantity||!eligible.length)return fail('Stock disponible, quantité ou robots éligibles insuffisants.');return action(`Créer une commande ${m[1]??'normale'} de ${quantity} ${p.name}${r?` avec ${r.code}`:''}.`,()=>engine.createOrder(p.sku,quantity,priority,{robotId:r?.id}));}
 return fail('Instruction non reconnue ou ambiguë. Utilisez un exemple avec un nom de produit, un emplacement et un robot exacts. Aucune modification effectuée.');
}
