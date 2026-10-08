import { AlertTriangle, Plus } from 'lucide-react';
import type { SimulationState } from './engine';
type Props = { state: SimulationState; buyRobot: () => void; build: (kind: 'depot' | 'charger') => void };
export default function OperationalAdvice({ state, buyRobot, build }: Props) {
  let message = '', action: (() => void) | undefined, label = '';
  if (!state.robots.length) { message = 'Aucun robot ne peut préparer les commandes.'; action = buyRobot; label = 'Acheter un robot'; }
  else if (!state.tiles.some(t => t.kind === 'depot')) { message = 'Aucun dépôt : les colis restent à bord et les commandes ne rapportent rien.'; action = () => build('depot'); label = 'Installer un dépôt'; }
  else if (!state.tiles.some(t => t.kind === 'charger')) { message = 'Aucune borne : les robots ne pourront pas récupérer leur énergie.'; action = () => build('charger'); label = 'Installer une borne'; }
  else if (state.robots.every(r => r.state === 'fault')) message = 'Tous les robots sont en panne. Sélectionnez-en un puis cliquez sur Réparer.';
  else if (state.orders.some(o => o.status === 'blocked')) message = `${state.orders.filter(o => o.status === 'blocked').length} commande(s) bloquée(s). Vérifiez le stock disponible et les accès aux équipements.`;
  else if (state.robots.filter(r => r.waitingNow).length > state.robots.length / 2) message = 'Plus de la moitié des robots attendent : dégagez les couloirs ou répartissez les équipements.';
  else if (state.budget < 0) message = 'Les dépenses dépassent le budget. De nouvelles livraisons peuvent financer la suite.';
  if (!message) return null;
  return <div className="operational-advice" role="status"><AlertTriangle size={16}/><div><p>{message}</p>{action && <button onClick={action}><Plus size={13}/>{label}</button>}</div></div>;
}
