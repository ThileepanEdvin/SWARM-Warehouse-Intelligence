const messages: Record<string, string> = {
  'Insufficient funds.': 'Budget insuffisant pour cet achat.', 'Cell is occupied.': 'Cette case est occupée. Choisissez une case vide.',
  'Choose a cell inside the warehouse.': 'Choisissez une case à l’intérieur de l’entrepôt.', 'No equipment here.': 'Il n’y a aucun équipement sur cette case.',
  'Shelf has an active reservation.': 'Ce rayonnage est utilisé par une mission. Attendez la fin du prélèvement.', 'Equipment removed.': 'Équipement retiré. Les trajets sont recalculés.',
  'Robot deployed.': 'Robot acheté et déployé.', 'Fleet limit: 24 robots.': 'La flotte est au maximum : 24 robots.', 'No clear deployment cell.': 'Aucune case de déploiement libre à gauche.',
  'Robot not found.': 'Ce robot n’est plus disponible.', 'Robot stopped.': 'Robot arrêté. Les missions non prélevées peuvent être réaffectées.',
  'Robot is already offline.': 'Ce robot est déjà en panne.', 'Select a failed robot.': 'Sélectionnez un robot en panne.', 'Robot repaired.': 'Robot réparé et prêt à reprendre.',
  'Repair costs 90 credits.': 'La réparation coûte 90 €. Votre budget est insuffisant.', 'Robot unavailable.': 'Ce robot est indisponible.',
  'Finish delivery before charging.': 'Le robot doit livrer son colis avant de se recharger.', 'Charging requested.': 'Recharge demandée. Le robot cherche une borne accessible.',
  'Battery must be 0–100%.': 'La batterie doit être comprise entre 0 et 100 %.', 'Battery updated.': 'Niveau de batterie modifié.',
  'Deliver secured cargo before removing this robot.': 'Livrez le colis sécurisé avant de retirer ce robot.', 'Robot retired without refund.': 'Robot retiré sans remboursement.',
  'Invalid order or priority.': 'La priorité doit être comprise entre 1 et 3.', 'Priority updated.': 'Priorité de la commande modifiée.',
  'Order added to dispatch queue.': 'Commande créée. Elle attend un robot disponible.', 'Invalid product, quantity (1–50), or priority (1–3).': 'Choisissez un produit connu, une quantité de 1 à 50 et une priorité de 1 à 3.',
  'Queue limit: 200 open orders.': 'La file est pleine : 200 commandes ouvertes. Attendez des livraisons.',
  'Archive limit reached (2000 orders). Reset scenario to start a fresh session.': 'L’archive a atteint 2 000 commandes. Commencez un nouveau scénario.',
  'Generate between 1 and 100 orders.': 'Générez de 1 à 100 commandes à la fois.', 'Stock replenished.': 'Stock réapprovisionné.', 'Invalid restock (1–500 units).': 'Le réapprovisionnement doit compter de 1 à 500 unités.',
  'Layout changed · routes recalculating': 'Agencement modifié : recalcul des trajets.', 'No delivery depot · all deliveries are blocked.': 'Aucun dépôt : les livraisons sont bloquées.',
  'No charging stations · fleet cannot replenish energy.': 'Aucune borne : les robots ne peuvent pas se recharger.', 'Robot purchased and deployed': 'Un robot a été acheté et déployé.',
  'Layout disconnects a robot from all delivery depots.': 'Un robot n’a plus accès aux dépôts. Rouvrez un passage.', 'Layout disconnects a robot from all charging stations.': 'Un robot n’a plus accès aux bornes. Rouvrez un passage.',
  'Operating balance below zero · purchases suspended until deliveries restore funds.': 'Le solde est négatif. Les achats reprendront après de nouvelles recettes.',
  'SWARM online · deterministic demo ready': 'Entrepôt prêt. Les commandes initiales attendent leurs robots.',
};
export function frenchMessage(message: string): string {
  if (messages[message]) return messages[message];
  const generated = message.match(/^(\d+) of (\d+) orders generated\.$/);
  if (generated) return `${generated[1]} commande(s) créée(s) sur ${generated[2]} demandées.`;
  const installed = message.match(/^(shelf|depot|charger|wall) installed\.$/);
  if (installed) return `${({ shelf: 'Rayonnage', depot: 'Dépôt', charger: 'Borne', wall: 'Obstacle' } as Record<string, string>)[installed[1]]} installé. Le budget a été débité.`;
  return message.replace('delivered · +', 'livrée · +').replace(' credits', ' €').replace('offline · cargo secured, unpicked work redistributed', 'en panne · colis sécurisé, réservation non prélevée libérée').replace('waiting · destination blocked', 'attend · destination inaccessible ou occupée');
}
