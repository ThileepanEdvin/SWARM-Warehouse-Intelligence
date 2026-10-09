import {chromium} from 'playwright';
import {log} from 'node:console';
import process from 'node:process';
const browser=await chromium.launch();
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});page.on('pageerror',error=>errors.push(error.message));
 const response=await page.goto('http://127.0.0.1:5173/');
 await page.getByRole('button',{name:'SWARM ARENA',exact:true}).click();await page.getByLabel('Conditions initiales').selectOption('batteries');
 for(const id of ['nearest','balanced','eco','priority','guardian','fairness']){await page.getByLabel('Stratégie équipe A').selectOption(id);await page.getByLabel('Stratégie équipe B').selectOption(id);}
 await page.getByLabel('Stratégie équipe A').selectOption('guardian');await page.getByLabel('Stratégie équipe B').selectOption('eco');await page.getByRole('button',{name:'×10',exact:true}).click();await page.getByRole('button',{name:'Lancer le duel',exact:true}).click();await page.waitForTimeout(2500);await page.getByRole('button',{name:'Pause du duel',exact:true}).click();
 log(JSON.stringify({http:response.status(),consoleErrors:errors,maps:await page.getByRole('img',{name:'Entrepôt interactif'}).count(),tick:await page.getByTestId('duel').getAttribute('data-tick')}));if(errors.length)process.exitCode=1;
}finally{await browser.close();}
