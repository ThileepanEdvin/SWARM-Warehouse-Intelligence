import type {Order} from './engine';
export const STRATEGY_IDS=['nearest','balanced','eco','priority','guardian','fairness'] as const;
export type StrategyId=typeof STRATEGY_IDS[number];
export interface MissionEstimate {pickup:number;delivery:number;energy:number;returnEnergy:number;chargerAvailable:boolean;hasCharger:boolean;battery:number;assignments:number;workSeconds:number;distance:number}
export interface CoordinationStrategy {id:StrategyId;name:string;description:string;details:string;order:(a:Order,b:Order)=>number;score:(m:MissionEstimate)=>number;admissible:(m:MissionEstimate)=>boolean}
const fifo=(a:Order,b:Order)=>a.createdAt-b.createdAt||a.id.localeCompare(b.id);
const feasible=(m:MissionEstimate)=>m.battery>25&&m.battery>m.pickup*.18+20&&m.battery>=m.energy+5;
export const STRATEGIES:Record<StrategyId,CoordinationStrategy>={
 nearest:{id:'nearest',name:'Sprint',description:'Le robot le plus proche est privilégié.',details:'Ordre d’arrivée ; distance A* vers le prélèvement. Les préférences de rayonnage admissibles restent prioritaires.',order:fifo,score:m=>m.pickup,admissible:feasible},
 balanced:{id:'balanced',name:'Smart Balance',description:'Compromis entre distance et batterie.',details:'Ordre d’arrivée ; distance de prélèvement + (100 − batterie) × 0,12. Même formule que la stratégie historique.',order:fifo,score:m=>m.pickup+(100-m.battery)*.12,admissible:feasible},
 eco:{id:'eco',name:'Eco Drive',description:'Réduire la consommation énergétique.',details:'Ordre d’arrivée ; énergie estimée : 0,12 par case à vide + 0,18 par case chargée jusqu’au dépôt. En égalité, moins de prélèvement puis plus de batterie. Les trajets utilisent A*.',order:fifo,score:m=>m.energy,admissible:feasible},
 priority:{id:'priority',name:'Priority First',description:'Traiter les commandes urgentes d’abord.',details:'Urgente, normale, basse ; puis arrivée et identifiant. Pour chaque commande, robot compatible le plus proche ; égalités déterministes.',order:(a,b)=>b.priority-a.priority||fifo(a,b),score:m=>m.pickup,admissible:feasible},
 guardian:{id:'guardian',name:'Battery Guardian',description:'Préserver la batterie des robots.',details:'Mission et retour à une borne accessibles, réserve de 15 points. Score : énergie aller/retour rapportée à la batterie restante, plus pénalité si les bornes accessibles sont occupées. Recharge anticipée si la réserve ne suffit pas.',order:fifo,score:m=>(m.energy+m.returnEnergy)/Math.max(1,m.battery-m.energy-m.returnEnergy)+(m.chargerAvailable?0:1),admissible:m=>feasible(m)&&m.hasCharger&&m.battery>=m.energy+m.returnEnergy+15},
 fairness:{id:'fairness',name:'Fleet Fairness',description:'Répartir le travail entre les robots.',details:'Ordre d’arrivée ; score = affectations × 100 + secondes en mission × 0,1 + distance cumulée × 0,1 + distance de prélèvement. Compteurs mesurés depuis le départ du duel.',order:fifo,score:m=>m.assignments*100+m.workSeconds*.1+m.distance*.1+m.pickup,admissible:feasible},
};
export const isStrategy=(v:unknown):v is StrategyId=>typeof v==='string'&&STRATEGY_IDS.includes(v as StrategyId);
