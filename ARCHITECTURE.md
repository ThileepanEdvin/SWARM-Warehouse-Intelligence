# Architecture SWARM

SWARM utilise React, TypeScript et Vite. Le moteur métier est indépendant des composants React. Le rendu de la carte utilise SVG pour conserver une grille inspectable, nette à tout niveau de zoom et sans dépendance graphique lourde.

## Gestion métier 1.2

Le catalogue fait partie de SimulationState, contrairement à la constante PRODUCTS qui ne sert que de base A/B/C compatible et de scénario généré. Les emplacements ont un identifiant interne historique et un code stable A-1, A-2… ; les robots conservent leurs IDs et reçoivent des codes R001… jamais réutilisés dans une session. Les compteurs persistent.

Stock total = marchandises sur rayonnage. Réservé = robots affectés mais sans colis. Disponible = total − réservé. Le prélèvement décrémente le stock et enregistre un mouvement ; le colis devient une réservation de commande transportée. Modifier les permissions libère les missions non prélevées devenues interdites. Les colis déjà sécurisés terminent leur livraison. Une commande avec robot imposé ne peut dépasser le stock auquel il est autorisé.

L’affectation applique produit, source choisie, permissions croisées robot/emplacement et autonomie. Une priorité d’emplacement ou de zone admissible est considérée avant le score original de stratégie. Sans priorité, les scores Nearest et Balanced restent identiques à la version antérieure. Le cache de routes utilise le robot et la liste effective d’emplacements autorisés.

Chaque commande peut fixer source, robot et dépôt. La valeur unitaire est figée à sa création, le revenu est payé après livraison complète une seule fois. Un colis par robot, plusieurs trajets pour plusieurs unités. Les coûts de stock et réparation sont centralisés dans PRICES. La suspension administrative est distincte d’une panne et ne permet pas de contourner une réparation payante.

Le format externe version 1 reste compatible ; managementVersion 2 identifie l’extension. Les champs absents sont initialisés au chargement. Catalogue, codes, capacités, mouvements, références et missions non autorisées sont validés. Une sauvegarde corrompue est rejetée, une ancienne sauvegarde valide est migrée.

## Séparation des responsabilités

- `src/Management.tsx` : inventaire, catalogue, commandes et administration de la flotte.
- `src/copilot.ts`, `src/CopilotView.tsx` : parseur local sans LLM, aperçu, confirmation et revalidation.
- `src/arena.ts` : préparation déterministe de la charge commune et limites de stock.
- `src/incidents.ts`, `src/LabView.tsx` : incidents réels, diagnostic et solutions du laboratoire.
- `src/engine.ts` : état, navigation, progression des missions, règles de stock, énergie, économie et édition.
- `src/pathfinding.ts` : algorithme A* indépendant du rendu.
- `src/persistence.ts` : sauvegarde et chargement d'instantanés validés.
- `src/optimization.ts` : expériences reproductibles sur des copies de la simulation.
- `src/telemetry.ts` : observation des transitions, motifs de décisions, traces de routes et signaux graphiques bornés.
- `src/duel.ts` : sessions indépendantes, horloge synchronisée, métriques différentielles et classement reproductible.
- `src/demo.ts` : scénario reproductible et perturbations passant par les API métier normales.
- `src/DuelView.tsx`, `src/DemoGuide.tsx`, `src/RobotInspector.tsx` : parcours visuel, comparaison et explications des décisions.
- `src/messages.ts`, `src/OperationalAdvice.tsx` : français compréhensible et conseils fondés sur les conditions réelles.
- `src/Warehouse.tsx` : représentation de la grille, robots, colis et chemins ; sélection et caméra.
- `src/App.tsx` : commandes de l'utilisateur, horloge de simulation et panneaux contextuels.
- `tests/` : vérification des parcours dans un vrai navigateur.

Les contrôles utilisent les mêmes règles métier que la boucle autonome ; aucun robot n'est animé par un itinéraire décoratif.

## Instrumentation et animation

L’affectation enregistre les candidats admissibles, la batterie, la distance et le score au moment de la sélection. Les modifications d’agencement conservent l’ancien chemin ; les transitions de navigation identifient les détours et attentes. Les commandes gardent un historique d’affectations borné, permettant de constater une réaffectation après panne plutôt que de la prétendre.

`instrumentStep` compare l’état avant et après chaque pas logique. Les signaux de prélèvement, déchargement et récompense ne sont produits qu’après leurs transitions effectives. Le revenu de la récompense est celui enregistré par le moteur. Les signaux sont limités à 80 ; les routes précédentes, décisions et signaux sont validés au chargement, tout en acceptant les anciennes sauvegardes sans ces champs.

Le SVG interpole uniquement entre deux cellules consécutives. La vitesse modifie la fréquence des pas et la durée d’interpolation ensemble. La manipulation des cartons dépend du compteur de chargement/déchargement et les effets de livraison expirent selon les pas simulés. Les effets de recharge et d’attente se figent avec la pause ; le mode de réduction des animations est respecté. Les identifiants de motifs SVG sont propres à chaque carte, y compris dans le duel.

Les incidents guidés peuvent attendre une mission non prélevée ou un déchargement. Ces demandes sont des contrôles temporaires de présentation ; elles appellent les mêmes API de panne et recharge quand les conditions sont effectivement réunies. Elles ne sont pas sauvegardées.

## Duel

Une session conserve un instantané immuable et restaure deux objets Engine distincts. Seul le champ de stratégie est modifié au départ. Chaque appel de progression avance les deux moteurs d’un pas ; l’arrêt, la vitesse et la durée sont communs. Le reset restaure exactement l’instantané. Le moteur de la partie n’est jamais utilisé pour calculer les résultats du duel.

Distance, consommation, revenu, attente et coûts sont rapportés en différence avec le départ. Les livraisons déjà terminées avant le duel sont exclues. La préparation moyenne concerne les commandes achevées pendant le duel et couvre leur durée totale depuis leur création. Le classement annoncé compare commandes livrées, durée moyenne, puis énergie. Les commandes occupées restent en attente ; les problèmes d’autorisation, de stock ou de trajet sont identifiés séparément. Les deux cartes partagent uniquement leur caméra de présentation, jamais leur état métier.

## Navigation et coordination

A* explore les quatre voisins d'une cellule et emploie la distance de Manhattan. Les rayonnages et murs sont infranchissables. Pour prélever, un robot rejoint une case adjacente au rayonnage. Les dépôts et bornes sont des destinations accessibles.

L'affectation trie les commandes par priorité puis ancienneté. La stratégie « nearest » privilégie le trajet court ; « balanced » ajoute une pénalité pour une batterie faible. Un robot transporte une unité par mission. La réservation empêche plusieurs robots d'attribuer la même unité disponible. Le stock diminue au chargement et la livraison valide la commande après déchargement.

Chaque pas traite les robots dans un ordre tournant et réserve immédiatement leur prochaine case. Les positions occupées interdisent les collisions et les échanges directs de cases. Un robot recalcule son trajet si le prochain pas devient occupé ou si l'éditeur modifie la carte. Cette stratégie locale n'est pas un solveur optimal de planification multi-robots : un couloir définitivement fermé peut nécessiter une intervention de l'utilisateur.

Les batteries diminuent de 0,12 point par cellule, ou 0,18 avec un colis. La recharge ajoute jusqu'à 1,2 point par pas. Les missions sont limitées aux robots disposant d'une réserve suffisante ; les robots à zéro sont immobilisés. En panne avant le prélèvement, une réservation est libérée. Après le prélèvement, le colis reste sur le robot jusqu'à sa réparation.

Les robots disponibles dégagent les équipements et les chemins demandés. Un robot qui attend plusieurs pas peut rejoindre une cellule voisine libre pour dénouer un conflit, en conservant les mêmes contrôles d'occupation. Les calculs d’affectation partagent un cache par robot et liste effective d’emplacements pendant un pas. Les murs ajoutés déclenchent une vérification de connectivité et des alertes si la configuration devient inaccessible.

## Horloge, mesures et expériences

Un pas logique représente 0,5 seconde simulée. Les coûts, distances, énergie, commandes terminées et durées proviennent des transitions du moteur. Les échantillons historiques sont conservés sur une fenêtre bornée. Le mode comparaison restaure deux copies du même instantané et exécute les deux stratégies pendant un même nombre de pas ; il ne modifie pas la partie en cours et n'invente aucun gain.

## Périmètre

La carte est fixe (24 × 16), la flotte est limitée à 24 robots et la file à 200 commandes ouvertes. Trois références compatibles sont proposées et le catalogue accepte jusqu’à 100 produits personnalisés. Une commande contient une référence et une quantité, décomposée en missions unitaires. L'économie est volontairement abstraite et locale. Il n'y a pas de backend, compte, synchronisation multi-utilisateur, échéances contractuelles, mise à niveau d'équipement ni redimensionnement de la carte.


Le Lab conserve son instantané initial dans App afin de permettre un passage vers l’éditeur puis une restauration. Cette copie, la partie d’origine de la visite guidée, les intentions Copilot en attente et les duels sont temporaires en mémoire. La sauvegarde manuelle reste la seule persistance de la partie.
