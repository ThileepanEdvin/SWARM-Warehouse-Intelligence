import { Bot, BatteryCharging, Route, Wrench, X, ArrowRight, BrainCircuit } from 'lucide-react';
import type { Robot, SimulationState } from './engine';
import { robotStates,money } from './presentation';
import {PRICES} from './engine';

type Props = { robot: Robot; state: SimulationState; charge: () => void; fault: () => void; retire: () => void };
export default function RobotInspector({ robot, state, charge, fault, retire }: Props) {
  const order = state.orders.find(o => o.id === robot.orderId);
  const target = robot.destination ? state.tiles.find(t => t.x === robot.destination!.x && t.y === robot.destination!.y) : undefined;
  const destination = robot.state === 'to-charge' || robot.state === 'charging' ? 'Station de recharge' : robot.cargo || robot.state === 'unloading' ? 'Dépôt d’expédition' : robot.orderId ? 'Rayonnage du produit' : 'Aucune destination';
  const stage = robot.state === 'to-pickup' ? 0 : robot.state === 'loading' ? 1 : robot.state === 'carrying' ? 2 : robot.state === 'unloading' ? 3 : -1;
  return <div className="robot-inspector" data-testid="robot-inspector"><div className="selected-robot"><div className={`robot-avatar ${robot.state === 'fault' ? 'failed' : ''}`}><Bot size={32}/></div><div><h2>{robot.code??robot.id}</h2><span className={`tag ${robot.state === 'fault' ? 'red' : 'green'}`}>{robotStates[robot.state]}</span></div></div>
    <div className="inspector-battery"><BatteryCharging size={17}/><span>Batterie</span><strong>{robot.battery.toFixed(0)} %</strong></div><div className="battery-bar"><span style={{ width: `${robot.battery}%`, background: robot.battery < 20 ? '#e79678' : undefined }}/></div>
    <div className="mission-card"><span className="eyebrow">MISSION EN COURS</span><strong>{order ? `Préparer ${state.products?.find(p=>p.sku===order.sku)?.name??order.sku}` : robot.state === 'idle' ? 'Prêt à recevoir une commande' : 'Gestion de la batterie ou incident'}</strong>{order && <small>{order.id} · {order.delivered}/{order.quantity} unités livrées · priorité {order.priority}</small>}
      <div className="mission-stages">{['Chercher', 'Charger', 'Livrer', 'Déposer'].map((label, i) => <span className={i <= stage ? 'reached' : ''} key={label}><i/>{label}</span>)}</div>
    </div>
    <div className="destination-card"><ArrowRight size={18}/><div><strong>{destination}</strong><small>{robot.destination ? `Cellule ${robot.destination.x + 1}, ${robot.destination.y + 1}${target ? ` · ${target.id}` : ''}` : 'En attente d’une mission'}</small></div><span>{robot.path.length} m</span></div>
    <div className="decision-card"><div><BrainCircuit size={18}/><strong>Pourquoi cette décision ?</strong></div><p>{robot.decision?.message ?? 'Aucune décision enregistrée depuis cette sauvegarde. Les prochaines missions seront expliquées ici.'}</p>{robot.previousRoute && state.tick - robot.previousRoute.tick < 24 && <p className="reroute-explanation"><Route size={14}/>{robot.previousRoute.reason} {robot.path.length ? `${robot.path.length} m sur le nouveau trajet.` : 'Recalcul en attente.'}</p>}</div>
    {robot.assignment && <details className="assignment-details"><summary>Comprendre son affectation</summary><p>Au pas {robot.assignment.tick}, {robot.assignment.candidates} robot(s) avaient assez de batterie et un accès au produit. Les priorités admissibles sont prises en compte avant le plus petit score.</p><dl><dt>Distance initiale</dt><dd>{robot.assignment.distance} m</dd><dt>Batterie à l’affectation</dt><dd>{robot.assignment.battery.toFixed(1)} %</dd><dt>Stratégie</dt><dd>{robot.assignment.strategy === 'nearest' ? 'Distance seule' : 'Distance + batterie'}</dd><dt>Score calculé</dt><dd>{robot.assignment.score.toFixed(2)}</dd></dl></details>}
    <div className="stats-list"><div><span>Colis sur le plateau</span><strong>{robot.cargo}</strong></div><div><span>Distance totale</span><strong>{robot.distance} m</strong></div><div><span>Attente cumulée</span><strong>{(robot.waitTicks * .5).toFixed(1)} s</strong></div></div>
    <div className="button-row">{!robot.disabled&&robot.state!=='fault'&&!robot.cargo&&!['to-charge','charging'].includes(robot.state)&&<button onClick={charge}><BatteryCharging size={15}/>Recharger</button>}{!robot.disabled&&<button onClick={fault}><Wrench size={15}/>{robot.state === 'fault' ? `Réparer · ${money(PRICES.repair)}` : 'Panne'}</button>}</div>{!robot.cargo&&<button className="full subtle" onClick={retire}><X size={14}/>Retirer le robot</button>}
  </div>;
}
