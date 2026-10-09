/* global localStorage -- Cette fonction est exécutée dans Chromium par page.evaluate. */
import { chromium, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch();
try {
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const snapshot=async()=>{await page.getByRole('button',{name:'Sauvegarder',exact:true}).click();return page.evaluate(()=>JSON.parse(localStorage.getItem('swarm-save')));};
 await page.goto('http://127.0.0.1:5173/');
 await page.getByTitle('Mettre en pause (Espace)').click();
 await page.getByRole('button',{name:'Stocks & Commandes',exact:true}).click();
 await page.getByRole('tab',{name:'Produits',exact:true}).click();
 await page.getByLabel('Nom du produit',{exact:true}).fill('Coca-Cola');
 await page.getByLabel('Référence SKU').fill('COCA');
 await page.getByLabel('Valeur unitaire').fill('12');
 await page.getByRole('button',{name:'Créer le produit',exact:true}).click();
 await page.getByRole('button',{name:'+ Ajouter du stock',exact:true}).click();
 await page.getByLabel('Produit à approvisionner').selectOption('COCA');
 await page.getByLabel('Quantité à approvisionner').fill('100');
 await page.getByRole('button',{name:'Confirmer l’ajout de stock',exact:true}).click();
 await page.getByRole('tab',{name:'Commandes',exact:true}).click();
 await page.getByRole('combobox',{name:'Produit',exact:true}).selectOption('COCA');
 await page.getByLabel('Quantité',{exact:true}).fill('10');
 await page.getByRole('button',{name:'Créer la commande',exact:true}).click();
 const before=await snapshot(),order=before.orders.at(-1);
 await page.screenshot({path:'captures/application/commandes-creees.png',fullPage:true});
 await page.getByRole('button',{name:'×10',exact:true}).click();
 await page.getByRole('button',{name:'Reprendre la simulation',exact:true}).click();
 await expect.poll(async()=> (await snapshot()).orders.find(o=>o.id===order.id).status,{timeout:45000,intervals:[1000]}).toBe('completed');
 await page.getByRole('button',{name:'Pause de la simulation',exact:true}).click();
 const after=await snapshot(),completed=after.orders.find(o=>o.id===order.id);
 const stock=s=>s.tiles.filter(t=>t.sku==='COCA').reduce((n,t)=>n+t.stock,0);
 assert.equal(stock(before),100);assert.equal(stock(after),90);assert.equal(completed.income,120);assert.equal(after.revenue,120);assert.deepEqual(errors,[]);
 await page.screenshot({path:'captures/application/commandes-livrees.png',fullPage:true});
 await page.getByRole('button',{name:'Analytics',exact:true}).click();
 await page.screenshot({path:'captures/application/analytics-livraisons.png',fullPage:true});
 await writeFile('captures/application/scenario-commandes.json',JSON.stringify({capturedAt:new Date().toISOString(),browser:browser.version(),viewport:{width:1440,height:1000},method:'Interactions réelles dans une nouvelle session Chromium, sans injection de sauvegarde ni modification du moteur.',before:{stock:stock(before),revenue:before.revenue,order},after:{stock:stock(after),revenue:after.revenue,order:completed},pageErrors:errors},null,2));
} finally { await browser.close(); }

