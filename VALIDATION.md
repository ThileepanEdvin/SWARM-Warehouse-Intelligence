# Validation de SWARM 1.4 — 9 octobre 2026

Contrôles réellement exécutés sur le projet Windows local. Point de restauration : commit `6b05bf0`, tag `restore/swarm-1.3-before-supply`.

- TypeScript (`npm run typecheck`, `tsc -b`) : réussi.
- ESLint : réussi.
- Production (`npm run build`) : réussi, 1 611 modules ; JS 410,88 kB / gzip 124,79 kB ; CSS 50,17 kB / gzip 11,75 kB.
- Vitest : 87 tests dans 8 suites. Les fixtures historiques utilisent explicitement le mode démonstration ; les nouveaux tests démarrent un moteur normal vide.
- Playwright Chromium : 27 parcours réussis (1 min 18 s environ), dont 3 nouveaux parcours d’approvisionnement.
- Git : `git diff --check` réussi après nettoyage des fins de fichier.
- Audit du serveur local : HTTP 200, `consoleErrors: []`.

## Contrôles métier

Les 19 nouveaux tests vérifient zéro commande/revenu/stock/cargo au démarrage et robots disponibles, catalogue sans marchandises, restauration exacte d’une ancienne sauvegarde avec colis en transit, stocks 100/50/1 000/10 000 et garde-fou numérique, capacité/encombrement et répartition sur plusieurs rayonnages, permissions et chemins, absence de mutation en cas de quantité/budget/SKU invalide, paramètres enregistrés sans stock, réservations protégées, finances Sandbox et équipement payant, commandes automatiques et manuelles, livraison progressive de 100 unités, erreurs détaillées en lecture seule, sauvegarde de grandes quantités avec mission en cours et Copilot partageant le même service.

## Parcours réels dans Chromium

1. Nouvelle partie sans sauvegarde : zéro commande, recette et colis ; six batteries initiales. Création COCA sans stock, ajout automatique 100 puis manuel 50 dans A-1, débit exact 1 200 €. Commande automatique de 10 livrée, puis manuelle de 5 exclusivement par le robot choisi : stock 135, revenu 180 €. Ajouts Sandbox 1 000 et 10 000 : stock 11 135, coût non débité 88 000 €, budget inchangé par les ajouts, toujours deux commandes et six robots. Sauvegarde/rechargement exacts, aucune exception JavaScript.
2. Stock insuffisant et quantité négative/décimale : explication visible et validation désactivée ; raccourci d’approvisionnement, paramètres sans mouvement, absence du champ doublon. Aucune commande créée après refus.
3. Copilot crée Eau et 1 000 unités dans un emplacement libre ; formulaire mobile crée Fanta et 10 000 unités. Les stocks sont exacts et aucune commande n’est créée. Largeur 390 pixels sans débordement horizontal.

Les 24 parcours précédents restent présents : pause, sauvegardes/corruption, équipements/obstacles, stock/catalogue/permissions, missions réelles, Copilot, Lab/pannes/ruptures/restauration, visite guidée, Arena 50 commandes et rejeu identique, actions de flotte et présentation complète. Les validations refusées sont vérifiées par leurs messages et boutons désactivés.

## Captures et limites

Captures générées et inspectées : `artifacts/swarm-supply-large-stock.png`, `swarm-supply-mobile.png`, `swarm-supply-validation.png`. Le rendu utilise un nombre borné de cartons décoratifs, jamais un objet par unité de stock. Les captures historiques sont régénérées par les parcours de régression.

Stockage sans plafond métier sous garde-fou de 1 milliard d’unités par rayonnage/ajout ; capacité configurable jusqu’à 10 milliards d’unités d’espace ; commande jusqu’à 1 million d’unités. Pas de plafond 50/500 dans les nouvelles opérations. Anciennes capacités configurées préservées et modifiables vers Sans plafond métier. Carte 24 × 16, 24 robots, 200 commandes ouvertes, 2 000 commandes archivées et 100 produits. Un colis par trajet : une grande commande prend réellement du temps, des recharges peuvent être nécessaires. Les diagnostics ne garantissent pas l’absence d’un obstacle ajouté après création ; les blocages ultérieurs restent visibles et réparables. La coordination locale peut nécessiter de rouvrir un passage totalement fermé.

Sauvegarde manuelle unique dans le navigateur ; conserver sa partie avant un scénario qui doit la remplacer. Les copies temporaires de démonstration/Lab et les duels restent en mémoire seulement. Aucun backend, cloud, LLM, déploiement, paiement ou changement de fichier personnel externe.
