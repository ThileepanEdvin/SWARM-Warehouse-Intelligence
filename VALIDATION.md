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
## Extension ciblée SWARM ARENA — validation finale

Point stable préservé avant modification : `579a1e9`, tag `restore/swarm-1.4-before-arena`.

| Contrôle | Résultat exécuté |
| --- | --- |
| TypeScript | Typecheck et compilation `tsc -b` réussis |
| ESLint | Réussi |
| Vitest | 113 tests réussis dans 9 suites : 87 précédents + 26 nouveaux contrôles Arena |
| Chromium complet | 30 parcours réussis avec `npm run test:e2e -- --workers=3`, dont les 27 parcours précédents |
| Chromium Arena final | Trois parcours rejoués après clarification des statistiques d’attente et des conclusions |
| Audit Arena sur 5173 | HTTP 200, deux cartes, six stratégies sélectionnées, duel Guardian/Eco exécuté, aucune erreur de console ni exception JavaScript |
| Audit autres rubriques | HTTP 200, aucune erreur de console ni exception JavaScript |
| Build Vite final | 1 613 modules ; JS 425,10 kB / gzip 129,16 kB ; CSS 51,45 kB / gzip 12,02 kB |
| Visuel | Captures inspectées à 1920, 1440, 1280 et 390 pixels ; deux cartes, sélecteurs visibles, tableau mobile avec défilement horizontal, aucun débordement de page |
| Git | Point stable vérifié ; `git diff --check` réussi |

Les contrôles couvrent chaque stratégie, mêmes états initiaux, absence de partage mutable, autorisations, batteries, collisions et obstacles, conservation stock + colis + livraisons, revenus uniques, priorité réelle d’urgences, sélection Eco d’un trajet moins coûteux, réserve et retour de Guardian, répartition réelle de Fairness avec arrivées espacées, répétition de résultats avec stratégies identiques, reset/rejeu, statistiques cohérentes et exclusions des temps historiques. Les cas sans robot, sans stock, sans dépôt, en panne ou avec batteries nulles sont testés.

Les parcours navigateur ajoutent les six sélecteurs indépendants, quatre scénarios, refus de 201 commandes, paramètres verrouillés même en pause, reset, égalité et rejeu de Priority First, profils Sprint/Eco et conservation exacte de la partie principale. Les scénarios de stocks, Copilot, Lab, équipements et sauvegardes restent opérationnels. Le test clavier Arena demande maintenant une réinitialisation avant changement de durée, conformément au nouveau verrouillage.

Une première exécution complète à six workers a dépassé le délai réel d’un duel sous charge CPU ; l’affectation a été optimisée pour les stratégies basées sur le prélèvement, sans changer les résultats des benchmarks. La validation complète à trois workers est réussie ; ce réglage limite les ressources de Chromium sous Windows, sans changer le temps simulé. Des exécutions simultanées avaient également interféré avec les traces et leur serveur ; les résultats finaux proviennent de suites exécutées séparément.

Fichiers, formules, limites et trois comparaisons orales : [ARENA.md](ARENA.md). Mesures réelles reproductibles : `artifacts/arena-benchmarks.json`, obtenues par `node scripts/arena-benchmark.mjs`. Aucun gain injecté ni victoire garantie. L’estimation d’énergie reste statique et ne prédit pas la congestion ; les résultats observés peuvent donc contredire l’objectif nominal d’une stratégie.
## Contrôles avant publication GitHub — 9 octobre 2026

Nouvelle exécution complète avant publication, sans changement fonctionnel :

- `npm run typecheck` : réussi.
- `npm run lint` : réussi.
- `npm run build` : réussi, 1 613 modules ; JS 425,10 kB / gzip 129,16 kB ; CSS 51,45 kB / gzip 12,02 kB.
- `npm test` : 113 tests unitaires et d’intégration réussis, 9 suites.
- `npm run test:e2e -- --workers=3` : 30 parcours Chromium réussis.
- `npm ls --depth=0` : dépendances installées cohérentes.
- README français complet : 13 liens relatifs vérifiés, aucune ressource manquante ; fichiers essentiels présents.
- `.gitignore` vérifié : dépendances, builds, traces, `.env`, clés privées, configurations locales et fichiers temporaires exclus. Les sources, configurations, tests et captures utiles sont conservés.
- Audit local `scripts/audit-release.py` : aucun secret détecté par les signatures et affectations contrôlées dans les fichiers à publier et l’ensemble des objets Git historiques, y compris les chemins de fichiers sensibles. Aucun contenu détecté n’est imprimé. Ce contrôle par motifs ne garantit pas la détection de tout secret inconnu.

Le remote demandé est `https://github.com/ThileepanEdvin/SWARM-Warehouse-Intelligence.git`. Il était sans référence Git au contrôle initial. L’authentification et le droit d’écrire sur `main` ont été vérifiés par un push à blanc. L’historique local et la branche `master` sont conservés ; la publication utilise une nouvelle branche `main`, sans push forcé. Aucune application n’est déployée.
