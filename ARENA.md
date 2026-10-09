# SWARM ARENA — six stratégies réelles

Extension ciblée du 9 octobre 2026. Point de restauration avant modification : `579a1e9`, tag `restore/swarm-1.4-before-arena`. Les interfaces et règles des autres modules sont conservées.

## Utilisation

1. Ouvrir SWARM ARENA dans le menu.
2. Choisir les conditions, 10/25/50/100 commandes ou un entier personnalisé de 1 à 200, et une durée de 1/2/5/10 minutes.
3. Choisir indépendamment la stratégie de l’équipe A et celle de B dans les en-têtes des cartes. Deux fois la même stratégie est autorisé.
4. Lancer le duel ; ×10 accélère uniquement le temps réel, jamais les pas simulés. Espace met en pause/reprend hors champ de saisie. Les paramètres sont verrouillés même en pause ; Réinitialiser permet de les changer.
5. Lire les métriques et le rapport final. Rejouer exactement le même duel réutilise l’instantané et les stratégies, jamais la partie principale ou une nouvelle graine.

Les cartes restent côte à côte sur ordinateur et l’une sous l’autre sur mobile. Le tableau comparatif défile horizontalement sur les petits écrans.

## Règles techniques exactes

Tous les candidats passent les mêmes contraintes : robot disponible, non suspendu et non en panne, permissions produit/rayonnage, stock non réservé, source et robot imposés, dépôt accessible, batterie > 25 et garde-fou historique de trajet. La mission complète doit conserver au moins cinq points de batterie estimés. Les routes sont calculées par A*. Préférences admissibles de rayonnage/robot conservées. En égalité : score, distance de prélèvement, batterie, identifiants du robot et du rayonnage. Les règles de circulation, collisions, consommation, prélèvement, recharge et livraison sont les règles existantes.

| Stratégie | Commandes | Sélection réelle |
| --- | --- | --- |
| Sprint | Arrivée puis identifiant | Distance A* jusqu’au prélèvement |
| Smart Balance | Arrivée puis identifiant | Distance + (100 − batterie) × 0,12, formule historique |
| Eco Drive | Arrivée puis identifiant | Énergie estimée : prélèvement à vide × 0,12 + trajet chargé au dépôt × 0,18 ; compare les rayonnages compatibles, pas seulement les batteries |
| Priority First | Urgente, normale, basse ; puis arrivée/identifiant | Robot compatible le plus proche |
| Battery Guardian | Arrivée puis identifiant | Mission + retour accessible à une borne ; réserve de 15 points. Score = énergie aller/retour divisée par batterie après retour + pénalité 1 si aucune borne accessible n’est libre. Recharge anticipée en l’absence de choix assez sûr |
| Fleet Fairness | Arrivée puis identifiant | Affectations depuis le départ × 100 + secondes en mission × 0,1 + distance cumulée × 0,1 + prélèvement ; agit sur chaque affectation |

Dans l’Arena, seule Priority First réordonne les demandes par urgence. Le moteur principal conserve son ordonnanceur historique par priorité et ses deux stratégies. Les nouveaux ordonnanceurs sont activés explicitement par `configureArenaStrategy`, sur les copies du duel. Les compteurs de travail sont locaux à chaque moteur du duel ; ils ne modifient pas les sauvegardes de la partie principale.

## Équité et mesures

Un seul instantané validé initialise les deux moteurs. Produits, stocks, commandes, quantités, priorités, permissions, équipements, positions, batteries, graine et missions déjà en cours sont identiques. Seule la stratégie choisie diffère. Chaque appel du duel avance exactement un pas de 0,5 seconde pour les deux équipes. Aucun tableau, objet ou compteur mutable n’est partagé.

Les résultats sont mesurés depuis cet instantané : commandes complètes/total, colis livrés, urgences terminées, durée moyenne générale et urgente, distance, énergie consommée réellement, attente, robots en mission/recharge/panne, batteries critiques et blocages. Les commandes achevées avant le duel sont exclues ; les commandes anciennes sont chronométrées à partir du départ. Une commande encore ouverte ne vaut pas une livraison complète.

Répartition : affectations nouvelles, colis réellement livrés et secondes avec mission par robot. Indice de Jain = somme des livraisons au carré / (nombre de robots × somme des carrés), exprimé en %. Tous les robots du scénario comptent ; 100 % représente une répartition uniforme, 0 % indique aucune livraison. Le détail explique la différence entre une affectation et une livraison.

Classement général inchangé dans son principe : davantage de commandes complètes, puis préparation moyenne plus courte, puis énergie totale plus faible ; égalité à 10⁻⁸ près. Les gagnants par critère sont calculés séparément. Une moyenne sans commande achevée est non comparable. Une énergie inférieure peut correspondre à moins de travail ; le rapport l’explique. Aucun gagnant prédéfini et aucune conclusion déduite du seul nom de la stratégie.

## Scénarios prêts à lancer

- **A · Batteries déséquilibrées** : graine 2026, six robots à 28/96/35/88/44/81 %, stock de référence abondant. Sprint, Smart Balance et Battery Guardian.
- **B · Commandes urgentes** : graine 77, six robots à 95 %, commandes unitaires ; premières basses, puis normales et urgentes. Sprint contre Priority First.
- **C · Forte consommation** : graine 2026, marchandises dans les deux colonnes éloignées, deux dépôts à l’ouest et un à l’est. Sprint contre Eco Drive.
- **D · Répartition de la flotte** : graine 77, six robots à 95 %, stock abondant et commandes unitaires. Sprint contre Fleet Fairness.

Ces conditions sont des jeux d’essai explicites construits sur une copie ; elles ne réapprovisionnent jamais la partie principale. Les graines historiques 2026/77 et la copie de mon entrepôt restent disponibles. Le manque de stock est annoncé ; une commande impossible reste visible. Une charge déjà en cours ne peut être tronquée sous son nombre initial.

## Trois présentations à l’oral et résultats de référence

Mesures réellement produites par `node scripts/arena-benchmark.mjs`, détail dans `artifacts/arena-benchmarks.json` :

| Comparaison | Réglages | Commandes complètes A / B | Observation |
| --- | --- | --- | --- |
| Sprint / Priority First | B, 100 commandes, 1 minute | 30 / 32 | Urgences livrées : 0 / 32. La priorité change effectivement l’ordre de traitement |
| Sprint / Battery Guardian | A, 50 commandes, 2 minutes | 26 / 25 | Énergie : 123,60 / 122,46. Comparer réserve, recharge et débit ; protection d’autonomie ne garantit pas davantage de livraisons |
| Sprint / Eco Drive | C, 50 commandes, 2 minutes | 18 / 11 | Énergie : 171,36 / 200,64. L’estimation du trajet individuel n’optimise pas la congestion globale : exemple d’un compromis réellement observé |

Le scénario D à 100 commandes/5 minutes livre 100/100, avec une équité déjà proche de 100 % pour Sprint ; Fleet Fairness ne l’améliore pas ici. Le test construit à arrivées espacées et trajets asymétriques vérifie une amélioration réelle de l’indice, sans injecter de résultat dans la simulation. Plusieurs stratégies peuvent être équivalentes sur une charge ; cette absence d’écart est elle-même un résultat à commenter.

## Fichiers concernés

- `src/arenaStrategies.ts` : registre, interface et six règles réutilisables.
- `src/engine.ts` : branche d’affectation réservée à l’Arena, estimations et compteurs de travail ; ordonnanceur principal conservé.
- `src/telemetry.ts` : type de stratégie élargi pour expliquer les affectations.
- `src/duel.ts` : stratégies indépendantes, métriques, reset/rejeu, gagnants par critère ; anciens noms d’API `nearest`/`balanced` restent les emplacements A/B pour compatibilité.
- `src/arena.ts` : quatre scénarios reproductibles, validations et avertissements.
- `src/DuelView.tsx`, `src/arenaUpgrade.css` : sélecteurs, descriptions, verrouillage, huit métriques par carte et rapport.
- `src/arenaStrategies.test.ts`, `tests/arena.spec.ts` : tests unitaires/intégration et navigateur ; `tests/premium.spec.ts` adapte le test clavier à la réinitialisation maintenant requise avant de changer la durée.
- `scripts/audit-arena-browser.mjs` : audit réel des sélecteurs, des cartes et de la console sur le serveur local.
- `scripts/arena-benchmark.mjs`, `artifacts/arena-benchmarks.json` : mesure reproductible des exemples.
- Captures `artifacts/swarm-arena-advanced-*.png` et rapports du duel ; documentation Arena et mises à jour ciblées du README, architecture, historique et validation.

## Limites

L’énergie est une estimation statique de trajet : elle ne prédit pas les bouchons, détours dynamiques ni l’occupation future des bornes. Guardian conserve une marge, mais une obstruction ultérieure peut immobiliser un robot ; il ne change pas les règles physiques. Fairness équilibre les affectations mesurées pendant le duel, pas toute la vie historique des robots ; accès différents et tâches longues peuvent limiter l’équité des livraisons. Les préférences configurées restent prioritaires parmi les candidats admissibles.

Les missions déjà en cours dans une copie de la partie gardent leur affectation initiale ; la stratégie choisie gouverne les suivantes. Choisir un scénario prédéfini pour observer la décision dès le premier pas. Carte 24 × 16, 24 robots, 200 commandes ouvertes, durée maximale 10 minutes simulées ; un colis par trajet. Les essais, compteurs et rapports du duel ne sont pas sauvegardés après rechargement. Aucun service externe, paiement ou déploiement.
