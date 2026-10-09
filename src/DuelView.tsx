import { useEffect, useState } from 'react';
import { Swords, Play, Pause, RotateCcw, ShieldCheck, ArrowLeft, Trophy, Route, Package, Zap, Clock3 } from 'lucide-react';
import { DuelSession,criterionWinner } from './duel';
import {STRATEGIES,STRATEGY_IDS,type StrategyId} from './arenaStrategies';
import './arenaUpgrade.css';
import {prepareArena} from './arena';
import {Engine} from './engine';
import Warehouse from './Warehouse';
import { money, simTime } from './presentation';
import type { DuelMetrics } from './duel';

type Props = { snapshot: string; back: () => void };

export default function Duel({ snapshot, back }: Props) {
  const [session] = useState(() => {const amount=Engine.restore(snapshot).state.orders.filter(o=>o.status!=='completed').length||10;return {current:new DuelSession(prepareArena(snapshot,'current',amount).snapshot,240,'nearest','balanced')};});
  const [running, setRunning] = useState(false), [speed, setSpeed] = useState(5), [, redraw] = useState(0);
  const [selectedA, setSelectedA] = useState<string | null>(session.current.nearest.state.robots[0]?.id ?? null);
  const [selectedB, setSelectedB] = useState<string | null>(session.current.balanced.state.robots[0]?.id ?? null);
  const [scenario, setScenario] = useState('current'), [error, setError] = useState(''), [horizon, setHorizon] = useState(240);
  const [count,setCount]=useState(session.current.nearest.state.orders.filter(o=>o.status!=='completed').length||10),[warning,setWarning]=useState(()=>prepareArena(snapshot,'current',count).warning);
  const [algorithmA,setAlgorithmA]=useState<StrategyId>('nearest'),[algorithmB,setAlgorithmB]=useState<StrategyId>('balanced'),[started,setStarted]=useState(false);
  const locked=started&&!session.current.finished;
  const labels={nearest:STRATEGIES[session.current.strategyA].name.toUpperCase(),balanced:STRATEGIES[session.current.strategyB].name.toUpperCase(),tie:'Égalité'};
  const [camera,setCamera]=useState({zoom:1,x:0,y:0});
  const refresh = () => redraw(n => n + 1);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || (event.target as HTMLElement).matches('input,select,textarea,button,a')) return;
      event.preventDefault();
      if (!session.current.finished&&!error){setStarted(true);setRunning(value => !value);}
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [error]);
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      try { session.current.tick(); refresh(); if (session.current.finished) setRunning(false); }
      catch { setError('Le duel a été arrêté pour préserver les deux simulations. Rechargez le scénario.'); setRunning(false); }
    }, 500 / speed);
    return () => clearInterval(timer);
  }, [running, speed]);
  const reset = () => { session.current.reset(); setRunning(false); setStarted(false);refresh(); };
  const configure=(value:string,duration:number,amount:number,strategyA:StrategyId=algorithmA,strategyB:StrategyId=algorithmB)=>{try{const prepared=prepareArena(snapshot,value,amount);session.current=new DuelSession(prepared.snapshot,duration,strategyA,strategyB);setWarning(prepared.warning);setError('');setRunning(false);setStarted(false);setSelectedA(session.current.nearest.state.robots[0]?.id??null);setSelectedB(session.current.balanced.state.robots[0]?.id??null);refresh();}catch(e){setError((e as Error).message);setRunning(false);}};
  const changeScenario=(value:string)=>{setScenario(value);configure(value,horizon,count)};
  const changeDuration=(value:number)=>{setHorizon(value);configure(scenario,value,count)};
  const a = session.current.metrics('nearest'), b = session.current.metrics('balanced');
  const rows: { name: string; unit: string; read: (m: DuelMetrics) => number; digits?: number;lower?:boolean;rank?:boolean }[] = [
    {name:'Préparation moyenne des urgences',unit:'s',read:m=>m.urgentAverageTime,digits:1,rank:true,lower:true},{name:'Batteries critiques (≤ 15 %)',unit:'',read:m=>m.critical,rank:true,lower:true},{name:'Robots en panne',unit:'',read:m=>m.faults},{name:'Commandes urgentes livrées',unit:'',read:m=>m.urgent,rank:true},{name:'Équité des livraisons (Jain)',unit:'%',read:m=>m.fairness,digits:1,rank:true},{name:'Colis livrés',unit:'',read:m=>m.deliveredUnits},{name:'Robots en recharge',unit:'',read:m=>m.charging},{name:'Commandes en attente',unit:'',read:m=>m.queued},{name:'Commandes restantes (attente, cours, blocage)',unit:'',read:m=>m.pending},{name:'Robots occupés',unit:'',read:m=>m.busy},{name:'Missions impossibles / bloquées',unit:'',read:m=>m.impossible},{ name: 'Commandes terminées', unit: '', read: m => m.completed,rank:true }, { name: 'Distance parcourue', unit: 'm', read: m => m.distance,rank:true,lower:true },
    { name: 'Énergie consommée', unit: 'unités', read: m => m.energy, digits: 1,rank:true,lower:true }, { name: 'Préparation moyenne', unit: 's', read: m => m.averageTime, digits: 1,rank:true,lower:true },
    { name: 'Temps d’attente cumulé', unit: 's', read: m => m.waiting, digits: 1 }, { name: 'Robots bloqués / en attente / en panne', unit: '', read: m => m.stalled },
    { name: 'Coût de fonctionnement', unit: '€', read: m => m.costs, digits: 2 },
  ];
  return <section className="duel-space" data-testid="duel" data-tick={session.current.elapsed} data-status={running ? 'running' : session.current.finished ? 'finished' : 'paused'}><div className="duel-heading"><div><div className="eyebrow">SWARM INTELLIGENCE / COMPARAISON EN DIRECT</div><h1><Swords size={27}/> SWARM ARENA</h1><p>Deux stratégies. Le même départ. Des résultats observables.</p></div><button onClick={back}><ArrowLeft size={16}/>Retour à mon entrepôt</button></div>
    <div className="duel-control"><label>Conditions initiales<select disabled={locked} value={scenario} onChange={e => changeScenario(e.target.value)}><option value="current">Copie de mon entrepôt</option><option value="2026">Batteries variées · graine 2026</option><option value="77">Autre charge de travail · graine 77</option><option value="batteries">A · Batteries déséquilibrées</option><option value="urgent">B · Commandes urgentes</option><option value="energy">C · Forte consommation</option><option value="fleet">D · Répartition de la flotte</option></select></label><label className="duel-duration">Durée du duel<select disabled={locked} value={horizon} onChange={e=>changeDuration(Number(e.target.value))}><option value="120">1 minute</option><option value="240">2 minutes</option><option value="600">5 minutes</option><option value="1200">10 minutes</option></select></label><label>Nombre de commandes<input disabled={locked} type="number" min="1" max="200" value={Number.isNaN(count)?'':count} onChange={e=>{const n=e.target.value===''?NaN:Number(e.target.value);setCount(n);configure(scenario,horizon,n)}}/><span className="button-row">{[10,25,50,100].map(n=><button disabled={locked} key={n} onClick={()=>{setCount(n);configure(scenario,horizon,n)}}>{n}</button>)}</span></label><div className="duel-start-actions"><button className="primary" disabled={!!error} onClick={() => { setStarted(true);if (session.current.finished) session.current.reset(); if(!error)setRunning(!running); refresh(); }}>{running ? <Pause size={16}/> : <Play size={16}/>} {running ? 'Pause du duel' : session.current.finished ? 'Relancer le duel' : 'Lancer le duel'}</button><button title="Réinitialiser le duel" onClick={reset}><RotateCcw size={16}/></button><div className="speed-controls">{[1, 2, 5, 10].map(s => <button key={s} className={s === speed ? 'active' : ''} onClick={() => setSpeed(s)}>×{s}</button>)}</div><span className="duel-clock">{simTime(session.current.elapsed)} / {simTime(session.current.horizon)}</span></div></div>
    <div className="duel-equality"><ShieldCheck size={15}/> Même état initial : {session.current.nearest.state.robots.length} robots, positions, commandes, stocks, batteries et équipements identiques. Votre partie reste en pause.</div>
    {locked&&<p className="hint">Paramètres verrouillés pendant le duel, y compris en pause. Réinitialisez pour changer les conditions ou les stratégies.</p>}{warning&&<p className="hint">{warning}</p>}{error && <p role="alert">{error}</p>}<button disabled={!!error||running} onClick={()=>{reset();setStarted(true);setRunning(true)}}>Rejouer exactement le même duel</button>
    <div className="duel-maps">{(['nearest', 'balanced'] as const).map((strategy, i) => {
      const metrics = strategy === 'nearest' ? a : b;
      return <article className={`duel-arena arena-${strategy}`} key={strategy} data-testid={`arena-${strategy}`} data-strategy={session.current[strategy].state.strategy}><header><span className="arena-letter">{i === 0 ? 'A' : 'B'}</span><div><h2>{labels[strategy]}</h2><label className="arena-strategy">ÉQUIPE {i===0?'A':'B'} — Choisir une stratégie<select aria-label={`Stratégie équipe ${i===0?'A':'B'}`} disabled={locked} value={i===0?algorithmA:algorithmB} onChange={e=>{const id=e.target.value as StrategyId;if(i===0){setAlgorithmA(id);configure(scenario,horizon,count,id,algorithmB);}else{setAlgorithmB(id);configure(scenario,horizon,count,algorithmA,id);}}}>{STRATEGY_IDS.map(id=><option key={id} value={id}>{STRATEGIES[id].name}</option>)}</select></label><p>{STRATEGIES[i===0?algorithmA:algorithmB].description}</p><details className="arena-method"><summary>Comment ça marche ?</summary><p>{STRATEGIES[i===0?algorithmA:algorithmB].details}</p></details></div><span className="tag">{running ? 'En activité' : session.current.finished ? 'Terminé' : 'En pause'}</span></header>
        <Warehouse compact camera={camera} setCamera={setCamera} state={session.current[strategy].state} selected={i === 0 ? selectedA : selectedB} select={i === 0 ? setSelectedA : setSelectedB} speed={speed} playing={running} tool="select" onPlace={() => {}}/>
        <div className="arena-metrics"><div><Package size={16}/><strong>{metrics.completed}/{metrics.total}</strong><span>commandes livrées</span></div><div><Route size={16}/><strong>{metrics.distance}</strong><span>mètres</span></div><div><Zap size={16}/><strong>{metrics.energy.toFixed(1)}</strong><span>énergie</span></div><div><Clock3 size={16}/><strong>{metrics.averageTime ? metrics.averageTime.toFixed(1) : '—'}</strong><span>secondes / commande</span></div><div><strong>{metrics.queued}</strong><span>commandes en attente</span></div><div><strong>{metrics.busy}</strong><span>robots actifs en mission</span></div><div><strong>{metrics.charging}</strong><span>robots en recharge</span></div><div><strong>{metrics.impossible}</strong><span>missions bloquées</span></div></div>
      </article>;
    })}</div>
    <div className="duel-progress"><span style={{ width: `${session.current.elapsed / session.current.horizon * 100}%` }}/></div>
    <section className="duel-report" data-testid="duel-report"><div className="report-heading"><div><h2>{session.current.finished ? 'Rapport final' : 'Comparaison en direct'}</h2><p>Mesures depuis le lancement. Une case parcourue = un mètre ; un pas = 0,5 seconde simulée.</p></div>{session.current.finished && <div className="winner"><Trophy size={22}/><strong>{session.current.winner === 'tie' ? 'Égalité sur les critères de résultat' : `${labels[session.current.winner]} remporte ce scénario`}</strong></div>}</div>
      <div className="arena-report-scroll"><table><thead><tr><th>Mesure</th><th>Équipe A · {labels.nearest}</th><th>Équipe B · {labels.balanced}</th><th>Meilleur résultat</th></tr></thead><tbody>{rows.map(row => <tr key={row.name}><th>{row.name}</th><td>{row.read(a).toFixed(row.digits ?? 0)} {row.unit}</td><td>{row.read(b).toFixed(row.digits ?? 0)} {row.unit}</td><td>{!row.rank?'—':(row.name==='Préparation moyenne'&&(!a.completed||!b.completed)||row.name==='Préparation moyenne des urgences'&&(!a.urgent||!b.urgent))?'Non comparable':labels[criterionWinner(row.read(a),row.read(b),row.lower)]}</td></tr>)}</tbody></table></div>
      <p className="hint">Classement : davantage de commandes livrées, puis préparation moyenne la plus courte. Puis énergie consommée la plus faible. Si les trois critères sont identiques, égalité. Aucune stratégie n’est favorisée.</p><p className="hint">Revenus du duel : équipe A {money(a.revenue)} · équipe B {money(b.revenue)}. Les charges historiques de la partie ne sont pas comptées dans les différences. La préparation est mesurée depuis la disponibilité de la commande dans le duel ; les commandes déjà présentes sont chronométrées à partir du départ. Seules les commandes achevées entrent dans cette moyenne.</p>
      <details className="arena-distribution"><summary>Répartition des missions par robot</summary><p className="hint">Affectations nouvelles / colis livrés / secondes en mission depuis le départ. L’équité de Jain inclut tous les robots : 100 % = même nombre de colis par robot ; 0 % = aucun colis livré.</p><ul className="arena-distribution-list">{a.distribution.map((r,i)=><li key={r.code}><strong>{r.code}</strong><span>A : {r.assignments} / {r.deliveries} / {r.workSeconds.toFixed(1)} s</span><span>B : {b.distribution[i]?.assignments??0} / {b.distribution[i]?.deliveries??0} / {(b.distribution[i]?.workSeconds??0).toFixed(1)} s</span></li>)}</ul></details>
      {session.current.finished&&<div className="arena-conclusion"><p>Productivité : {labels[criterionWinner(a.completed,b.completed)]} · Énergie totale : {labels[criterionWinner(a.energy,b.energy,true)]} · Urgences livrées : {labels[criterionWinner(a.urgent,b.urgent)]}.</p><p>{rows.every(row=>Math.abs(row.read(a)-row.read(b))<1e-8)?'Les indicateurs de ce tableau sont identiques sur ce scénario. Les contraintes ou les choix admissibles peuvent rendre plusieurs règles équivalentes.':'Les écarts mesurés dépendent de cette charge et de cette durée. Une énergie totale plus faible peut aussi correspondre à moins de livraisons ; comparez les critères ensemble.'}</p></div>}
    </section>
  </section>;
}
