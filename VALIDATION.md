# Vérification finale de SWARM 1.2 — 9 octobre 2026

Vérifications réellement exécutées sous Windows, Node.js 24.19 et Chromium Playwright. Aucun déploiement public, achat ou service externe.

| Contrôle | Résultat |
| --- | --- |
| TypeScript | Réussi, compilation `tsc -b` et commande typecheck |
| ESLint | Réussi |
| Build Vite | Réussi, 1 601 modules ; JS 366,37 kB / gzip 112,46 kB ; CSS 43,41 kB / gzip 10,41 kB |
| Tests métier Vitest | 50 tests réussis, 6 suites ; dernier run 4,47 s avec compilation et lint en parallèle |
| Tests Chromium Playwright | 19 parcours réussis : 13 parcours antérieurs conservés et 6 nouveaux parcours de gestion |
| Audit des rubriques | HTTP 200, aucune erreur de console ni exception JavaScript dans le parcours contrôlé |
| Rendu | Captures inspectées à 1920 × 1080, 1440 × 1000 et 390 × 844 ; tableaux avec défilement interne, pas de débordement horizontal de page dans les rubriques contrôlées |

## Contrôles métier

Les contrôles antérieurs d’A*, collisions, échanges de cases, batteries, pannes, recharge, livraison unique, reprise exacte, budget et optimisation sont conservés. La saturation vérifie 24 robots et 112 commandes sur 1 000 pas ; les 112 sont terminées sans collisions. Ce test a pris 2,01 s dans le dernier run parallèle : ce temps dépend de la machine et des vérifications exécutées.

Les 22 nouveaux tests couvrent produits personnalisés, doublons de catalogue, codes stables, capacités et encombrement, mouvements, stock réservé protégé, budget, exclusivités, priorité d’emplacement et de zone même avec un stock plus proche, commande plus grande que le stock autorisé au robot choisi, changements de permissions avant/après prélèvement, source/robot/dépôt choisis, livraison de cinq unités en plusieurs trajets et revenu unique.

Ils vérifient aussi annulation protégée, panne avec colis, réparation et budget insuffisant, suspension administrative et impossibilité de contourner une réparation payante, retrait de robot et nettoyage de références, migration d’une ancienne sauvegarde, sauvegardes incohérentes rejetées, intentions Copilot sans mutation avant exécution, ambiguïtés refusées et contraintes actuelles revérifiées.

Arena : charge commune déterministe de 50 commandes, copies indépendantes, instantanés de départ égaux hors stratégie, résultats identiques après relancement, stock limité annoncé et réduction d’une charge avec missions actives refusée. Le classement utilise les livraisons, puis le temps moyen, puis l’énergie ; l’égalité est vérifiée. Lab : dix incidents changent le moteur ou expliquent leur impossibilité, et l’instantané de départ peut être restauré exactement.

## Parcours navigateur

- Coca-Cola créé dans le catalogue, ancien contenu de A-1 retiré explicitement, ajout de dix marchandises, priorité R001, commande de cinq unités depuis A-1 avec R001, stock final cinq et revenu réel 60 €.
- Panne, diagnostic, réparation avec débit de 90 €, restauration de l’état initial et accès à la visite guidée fusionnée dans le Lab.
- Arena 50 commandes / deux minutes, zoom commun, fin du duel et rapport identique après rejeu.
- Copilot : aperçu sans mutation, confirmation, vrai produit créé, instruction ambiguë refusée.
- Navigation des nouvelles rubriques sur mobile, tableau de flotte et absence d’exceptions.
- Fiche du rayonnage → formulaire avec source préremplie ; incident du Lab → éditeur → Lab → restauration exacte sans modification préalable de la sauvegarde manuelle.

Les parcours antérieurs restent actifs : pause, vitesse, sauvegarde/rechargement exact, création invalide refusée, achats, obstacles, commandes autonomes, corruption de sauvegarde, comparaison historique, démo avec ancien/nouveau trajet, duel indépendant et répétable, raccourcis, pause pendant chargement, incidents tardifs, caméra et vue immersive.

## Captures et portée

Les fichiers `artifacts/swarm-inventory.png`, `swarm-fleet.png`, `swarm-fleet-mobile.png`, `swarm-lab.png` et `swarm-arena-50.png` montrent la refonte réelle. Les captures de simulation, mobile, intelligence, détournement, duel et vue immersive sont également conservées et actualisées par Playwright.

La validation ne prouve pas tous les agencements possibles. Firefox et Safari n’ont pas été testés. La coordination locale exige parfois de retirer un obstacle. Les permissions concernent le prélèvement. Les snapshots temporaires du Lab, de la visite guidée et des duels ne sont pas persistés ; la sauvegarde manuelle locale reste disponible. Les incidents peuvent être partiels quand une case est occupée ou le budget insuffisant, ce qui est indiqué dans leur résultat.

Les limites du moteur sont documentées dans README.md et DEMONSTRATION.md. Les workers de test et Chromium ont nécessité une exécution autorisée hors des restrictions du sandbox Windows.
