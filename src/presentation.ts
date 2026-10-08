import type { RobotState } from './engine';
export const robotStates: Record<RobotState, string> = { idle: 'Disponible', 'to-pickup': 'Vers le produit', loading: 'Prélèvement du colis', carrying: 'Transport du colis', unloading: 'Déchargement', 'to-charge': 'Vers une borne', charging: 'Recharge', waiting: 'En attente', blocked: 'Bloqué', fault: 'En panne' };
export const money = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
export const preciseMoney = (n: number) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);
export const simTime = (ticks: number) => `${Math.floor(ticks * .5 / 60).toString().padStart(2, '0')}:${Math.floor(ticks * .5 % 60).toString().padStart(2, '0')}`;
