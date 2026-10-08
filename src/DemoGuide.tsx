import { useState } from 'react';
import { Check, Play, Route, AlertTriangle, Wrench, BatteryCharging, Swords, RotateCcw } from 'lucide-react';
type Props = { stage: number; message: string; next: (action: 'observe' | 'select' | 'block' | 'fault' | 'charge' | 'duel') => void; reset: () => void; compact?: boolean; horizontal?: boolean };
const steps = [
  { action: 'observe', title: 'Voir les livraisons', text: 'Lancez la flotte : les cartons passent du stock aux dépôts.', icon: Play },
  { action: 'select', title: 'Comprendre une mission', text: 'Un robot affiche son trajet et le score de son affectation.', icon: Route },
  { action: 'block', title: 'Fermer son passage', text: 'Placez un obstacle sur son vrai trajet, avec un détour possible.', icon: AlertTriangle },
  { action: 'fault', title: 'Provoquer une panne', text: 'Une réservation non prélevée est libérée pour un autre robot.', icon: Wrench },
  { action: 'charge', title: 'Observer la recharge', text: 'Un robot à 18 % se dirige vers une borne accessible.', icon: BatteryCharging },
  { action: 'duel', title: 'Comparer les stratégies', text: 'Deux copies identiques évoluent avec deux décisions différentes.', icon: Swords },
] as const;
export default function DemoGuide({ stage, message, next, reset, compact = false, horizontal = false }: Props) {
  const [expanded, setExpanded] = useState(false);
  return <div className={`demo-guide ${horizontal?'demo-ribbon':''} ${compact && !expanded ? 'is-compact' : ''}`}><div className="demo-title"><span className="eyebrow">PARCOURS DE PRÉSENTATION</span><h3>Démo intelligente</h3><p>Étape {Math.min(stage + 1, 6)} / 6 · Événements réels du moteur.</p></div><div className="demo-steps">{steps.map((s, i) => <button title={s.text} key={s.action} className={`demo-step ${i === stage ? 'current' : ''} ${i < stage ? 'done' : ''}`} onClick={() => next(s.action)}><span className="demo-step-number">{i < stage ? <Check size={15}/> : i + 1}</span><div><strong>{s.title}</strong><small>{s.text}</small></div><s.icon size={17}/></button>)}</div><p className="demo-message" role="status">{message || 'Cliquez sur « Voir les livraisons » pour commencer.'}</p>{compact && <button className="full subtle" onClick={() => setExpanded(!expanded)}>{expanded ? 'Réduire le parcours' : 'Voir toutes les étapes'}</button>}<button className="full" onClick={reset}><RotateCcw size={15}/>Réinitialiser la démo</button></div>;
}
