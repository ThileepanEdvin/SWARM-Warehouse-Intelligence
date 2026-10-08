import { useEffect, useState } from 'react';
import { Swords, Play, Pause, RotateCcw, ShieldCheck, ArrowLeft, Trophy, Route, Package, Zap, Clock3 } from 'lucide-react';
import { DuelSession } from './duel';
import {prepareArena} from './arena';
import {Engine} from './engine';
import Warehouse from './Warehouse';
import { money, simTime } from './presentation';
import type { DuelMetrics } from './duel';

type Props = { snapshot: string; back: () => void };
const labels = { nearest: 'SPRINT', balanced: 'SMART BALANCE', tie: 'Égalité' };
export default function Duel({ snapshot, back }: Props) {
  const [session] = useState(() => {const amount=Engine.restore(snapshot).state.orders.filter(o=>o.status!=='completed').length||10;return {current:new DuelSession(prepareArena(snapshot,'current',amount).snapshot)};});
  const [running, setRunning] = useState(false), [speed, setSpeed] = useState(5), [, redraw] = useState(0);
  const [selectedA, setSelectedA] = useState<string | null>(session.current.nearest.state.robots[0]?.id ?? null);
  const [selectedB, setSelectedB] = useState<string | null>(session.current.balanced.state.robots[0]?.id ?? null);
  const [scenario, setScenario] = useState('current'), [error, setError] = useState(''), [horizon, setHorizon] = useState(240);
  const [count,setCount]=useState(session.current.nearest.state.orders.filter(o=>o.status!=='completed').length||10),[warning,setWarning]=useState('');
  const [camera,setCamera]=useState({zoom:1,x:0,y:0});
  const refresh = () => redraw(n => n + 1);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.code !== 'Space' || (event.target as HTMLElement).matches('input,select,textarea,button,a')) return;
      event.preventDefault();
      if (!session.current.finished) setRunning(value => !value);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => {
    if (!running) return;
    const timer = setInterval(() => {
      try { session.current.tick(); refresh(); if (session.current.finished) setRunning(false); }
      catch { setError('Le duel a été arrêté pour préserver les deux simulations. Rechargez le scénario.'); setRunning(false); }
    }, 500 / speed);
    return () => clearInterval(timer);
  }, [running, speed]);
  const reset = () => { session.current.reset(); setRunning(false); refresh(); };
  const configure=(value:string,duration:number,amount:number)=>{try{const prepared=prepareArena(snapshot,value,amount);session.current=new DuelSession(prepared.snapshot,duration);setWarning(prepared.warning);setError('');setRunning(false);setSelectedA(session.current.nearest.state.robots[0]?.id??null);setSelectedB(session.current.balanced.state.robots[0]?.id??null);refresh();}catch(e){setError((e as Error).message);setRunning(false);}};
  const changeScenario=(value:string)=>{setScenario(value);configure(value,horizon,count)};
  const changeDuration=(value:number)=>{setHorizon(value);configure(scenario,value,count)};
  const a = session.current.metrics('nearest'), b = session.current.metrics('balanced');
  const rows: { name: string; unit: string; read: (m: DuelMetrics) => number; digits?: number }[] = [
    {name:'Commandes encore en attente',unit:'',read:m=>m.pending},{name:'Robots occupés',unit:'',read:m=>m.busy},{name:'Missions impossibles / bloquées',unit:'',read:m=>m.impossible},{ name: 'Commandes terminées', unit: '', read: m => m.completed }, { name: 'Distance parcourue', unit: 'm', read: m => m.distance },
    { name: 'Énergie consommée', unit: 'unités', read: m => m.energy, digits: 1 }, { name: 'Préparation moyenne', unit: 's', read: m => m.averageTime, digits: 1 },
    { name: 'Temps d’attente cumulé', unit: 's', read: m => m.waiting, digits: 1 }, { name: 'Robots bloqués / en attente / en panne', unit: '', read: m => m.stalled },
    { name: 'Coût de fonctionnement', unit: '€', read: m => m.costs, digits: 2 },
  ];
  return <section className="duel-space" data-testid="duel" data-tick={session.current.elapsed} data-status={running ? 'running' : session.current.finished ? 'finished' : 'paused'}><div className="duel-heading"><div><div className="eyebrow">SWARM INTELLIGENCE / COMPARAISON EN DIRECT</div><h1><Swords size={27}/> SWARM ARENA</h1><p>Deux stratégies. Le même départ. Des résultats observables.</p></div><button onClick={back}><ArrowLeft size={16}/>Retour à mon entrepôt</button></div>
    <div className="duel-control"><label>Conditions initiales<select value={scenario} onChange={e => changeScenario(e.target.value)}><option value="current">Copie de mon entrepôt</option><option value="2026">Batteries variées · graine 2026</option><option value="77">Autre charge de travail · graine 77</option></select></label><label className="duel-duration">Durée du duel<select value={horizon} onChange={e=>changeDuration(Number(e.target.value))}><option value="120">1 minute</option><option value="240">2 minutes</option><option value="600">5 minutes</option><option value="1200">10 minutes</option></select></label><label>Nombre de commandes<input type="number" min="1" max="200" value={count} onChange={e=>{const n=Number(e.target.value);setCount(n);configure(scenario,horizon,n)}}/><span className="button-row">{[10,25,50,100].map(n=><button key={n} onClick={()=>{setCount(n);configure(scenario,horizon,n)}}>{n}</button>)}</span></label><div className="duel-start-actions"><button className="primary" onClick={() => { if (session.current.finished) session.current.reset(); if(!error)setRunning(!running); refresh(); }}>{running ? <Pause size={16}/> : <Play size={16}/>} {running ? 'Pause du duel' : session.current.finished ? 'Relancer le duel' : 'Lancer le duel'}</button><button title="Réinitialiser le duel" onClick={reset}><RotateCcw size={16}/></button><div className="speed-controls">{[1, 2, 5, 10].map(s => <button key={s} className={s === speed ? 'active' : ''} onClick={() => setSpeed(s)}>×{s}</button>)}</div><span className="duel-clock">{simTime(session.current.elapsed)} / {simTime(session.current.horizon)}</span></div></div>
    <div className="duel-equality"><ShieldCheck size={15}/> Même état initial : {session.current.nearest.state.robots.length} robots, positions, commandes, stocks, batteries et équipements identiques. Votre partie reste en pause.</div>
    {warning&&<p className="hint">{warning}</p>}{error && <p role="alert">{error}</p>}<button disabled={!!error} onClick={()=>{reset();setRunning(true)}}>Rejouer exactement le même duel</button>
    <div className="duel-maps">{(['nearest', 'balanced'] as const).map((strategy, i) => {
      const metrics = strategy === 'nearest' ? a : b;
      return <article className={`duel-arena arena-${strategy}`} key={strategy} data-testid={`arena-${strategy}`}><header><span className="arena-letter">{i === 0 ? 'A' : 'B'}</span><div><h2>{labels[strategy]}</h2><p>{strategy === 'nearest' ? 'Le trajet le plus court vers le produit' : 'Un compromis entre distance et batterie'}</p></div><span className="tag">{running ? 'En activité' : session.current.finished ? 'Terminé' : 'En pause'}</span></header>
        <Warehouse compact camera={camera} setCamera={setCamera} state={session.current[strategy].state} selected={i === 0 ? selectedA : selectedB} select={i === 0 ? setSelectedA : setSelectedB} speed={speed} playing={running} tool="select" onPlace={() => {}}/>
        <div className="arena-metrics"><div><Package size={16}/><strong>{metrics.completed}</strong><span>livrées</span></div><div><Route size={16}/><strong>{metrics.distance}</strong><span>mètres</span></div><div><Zap size={16}/><strong>{metrics.energy.toFixed(1)}</strong><span>énergie</span></div><div><Clock3 size={16}/><strong>{metrics.averageTime ? metrics.averageTime.toFixed(1) : '—'}</strong><span>secondes / commande</span></div></div>
      </article>;
    })}</div>
    <div className="duel-progress"><span style={{ width: `${session.current.elapsed / session.current.horizon * 100}%` }}/></div>
    <section className="duel-report" data-testid="duel-report"><div className="report-heading"><div><h2>{session.current.finished ? 'Rapport final' : 'Comparaison en direct'}</h2><p>Mesures depuis le lancement. Une case parcourue = un mètre ; un pas = 0,5 seconde simulée.</p></div>{session.current.finished && <div className="winner"><Trophy size={22}/><strong>{session.current.winner === 'tie' ? 'Égalité sur les critères de résultat' : `${labels[session.current.winner]} remporte ce scénario`}</strong></div>}</div>
      <table><thead><tr><th>Mesure</th><th>SPRINT</th><th>SMART BALANCE</th></tr></thead><tbody>{rows.map(row => <tr key={row.name}><th>{row.name}</th><td>{row.read(a).toFixed(row.digits ?? 0)} {row.unit}</td><td>{row.read(b).toFixed(row.digits ?? 0)} {row.unit}</td></tr>)}</tbody></table>
      <p className="hint">Classement : davantage de commandes livrées, puis préparation moyenne la plus courte. Puis énergie consommée la plus faible. Si les trois critères sont identiques, égalité. Aucune stratégie n’est favorisée.</p><p className="hint">Revenus du duel : Sprint {money(a.revenue)} · Smart Balance {money(b.revenue)}. Les charges historiques de la partie ne sont pas comptées dans les différences. La préparation moyenne couvre la durée complète, depuis la création, des commandes achevées pendant le duel.</p>
    </section>
  </section>;
}
