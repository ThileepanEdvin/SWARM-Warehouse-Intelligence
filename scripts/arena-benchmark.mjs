/* global console */
import {createServer} from 'vite';
import {writeFile} from 'node:fs/promises';
const server=await createServer({server:{middlewareMode:true},appType:'custom'});
try{
 const {Engine}=await server.ssrLoadModule('/src/engine.ts');
 const {prepareArena}=await server.ssrLoadModule('/src/arena.ts');
 const {DuelSession}=await server.ssrLoadModule('/src/duel.ts');
 const cases=[['batteries',50,240,'nearest','guardian'],['urgent',100,120,'nearest','priority'],['energy',50,240,'nearest','eco'],['fleet',100,600,'nearest','fairness']];
 const results=cases.map(([scenario,count,horizon,a,b])=>{const prepared=prepareArena(new Engine().serialize(),scenario,count),session=new DuelSession(prepared.snapshot,horizon,a,b);session.tick(horizon);return {scenario,count,seconds:horizon*.5,strategyA:a,strategyB:b,teamA:session.metrics('nearest'),teamB:session.metrics('balanced'),winner:session.winner};});
 await writeFile('artifacts/arena-benchmarks.json',JSON.stringify(results,null,2)+'\n');
 console.log(JSON.stringify(results.map(r=>({scenario:r.scenario,A:r.strategyA,B:r.strategyB,completed:[r.teamA.completed,r.teamB.completed],energy:[r.teamA.energy,r.teamB.energy],urgent:[r.teamA.urgent,r.teamB.urgent],equity:[r.teamA.fairness,r.teamB.fairness],winner:r.winner})),null,2));
}finally{await server.close();}
