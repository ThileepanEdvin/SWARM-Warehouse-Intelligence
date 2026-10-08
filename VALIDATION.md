# Vérification de SWARM 1.3 — 9 octobre 2026

Contrôles exécutés sous Windows avec Node.js et Chromium Playwright. Le moteur de simulation et les tests existants sont conservés. Point de restauration créé avant modification : `fbfda91`, tag `restore/swarm-1.2-before-ux`.

| Contrôle | Résultat |
| --- | --- |
| TypeScript | `npm run typecheck` et compilation `tsc -b` réussies |
| ESLint | Réussi |
| Production Vite | 1 607 modules ; JS 399,55 kB / gzip 121,60 kB ; CSS 48,28 kB / gzip 11,33 kB |
| Vitest | 68 tests réussis, 7 suites ; 50 antérieurs et 18 nouveaux tests UX/métier |
| Chromium | 24 parcours : 19 antérieurs préservés, 5 nouveaux parcours UX |
| Audit des rubriques | HTTP 200, aucune erreur de console ni exception JavaScript sur le parcours audité |
| Visuel | Captures inspectées à 1920 × 1080, 1280 × 900 et 390 × 844 ; cartes visibles, panneaux accessibles et absence de débordement horizontal dans les rubriques contrôlées |
| Git | `git diff --check` réussi ; point de restauration vérifié |

## Nouveaux contrôles métier

- Enregistrement atomique du produit, stock, capacité et priorité, avec vrai mouvement et débit de budget. Aucune modification en cas de capacité insuffisante, budget insuffisant ou remplacement interdit.
- Placement automatique déterministe : même produit avec place, puis emplacement vide ; création et stockage simultanés d’Eau ; absence de mutation si aucun emplacement compatible.
- Recherche des emplacements, quantités et rayonnages presque vides ; ambiguïté refusée sans création arbitraire de mission ; revalidation d’une opération en attente après changement de budget.
- Alias « robot 1 », restriction par produit, restriction par rayonnage, intersection avec les accès du rayonnage, autorisation supplémentaire sans effacer les autres règles.
- Affectation réelle excluant R001 des missions Fanta quand il est limité au Coca-Cola ; livraison avec un autre robot compatible. Changement des permissions avant prélèvement libérant la réservation ; colis déjà transporté conservé et livré.
- Demande de mission refusée si batterie insuffisante ou dépôt inaccessible ; commande urgente réelle avec source imposée ; migration des sauvegardes sans `allowedProducts`, SKU inconnus refusés.
- Plusieurs incidents indépendants, réparation facturée une seule fois, obstacle réel sur case choisie, occupation refusée sans mutation, rupture conservant les réservations et identifiant les commandes touchées, saturation réelle d’une borne et restauration exacte.
- Paramètres invalides refusés et limite de douze incidents actifs vérifiée.

Les invariants antérieurs restent actifs : A*, absence de collision et d’échange direct, économie, batteries, pannes, recharge, livraisons uniques, saturation à 24 robots, capacités/encombrement, catalogue, priorités, source/robot/dépôt choisis, suspensions administratives et protection des réparations payantes, références stables, corruption et migration des sauvegardes. Arena et optimisation restent testées sur des copies indépendantes et reproductibles.

## Nouveaux parcours navigateur

1. **Présentation complète en six étapes**, lancée par Paramètres → Préparer la démonstration UX : Coca-Cola dans A-1 via enregistrement composé, Fanta ajouté automatiquement dans A-2, recherche de Coca-Cola, autorisations par produit et Copilot de flotte, cinq livraisons réelles (stock final cinq, recette 60 €), panne depuis la carte du Lab, réparation facturée 90 € et retour exact à la partie conservée.
2. **Sélection multiple** : choix A-1/A-2, annulation sans mutation, confirmation réelle, sauvegarde, rechargement et règles restaurées.
3. **Incidents contextuels** : seuls les paramètres utiles sont visibles ; panne et obstacle distincts ; solutions ciblées ; résolution indépendante ; historique conservé après navigation ; restauration exacte.
4. **Responsive** : Stocks, Flotte et Lab à 1280 et 390 pixels, carte visible et absence de débordement ; Copilot utilisable sur mobile.
5. **Actions de flotte** : panne réelle, recharge masquée en panne, unique réparation avec débit exact, suspension administrative, réactivation et absence de réparation gratuite.

Les 19 parcours antérieurs sont conservés ; seuls les sélecteurs des onglets, cartes d’incident et sections avancées ont été adaptés. Ils couvrent notamment les sauvegardes, achats et obstacles, commandes autonomes, catalogue, Lab, visite guidée, Arena 50 commandes et rejeu, caméras, raccourcis et pause pendant chargement.

## Captures et limites

Captures actualisées dans `artifacts/` : `swarm-ux-stock-map.png`, `swarm-ux-fleet-map.png`, `swarm-ux-lab-incident.png`, et variantes Stock/Flotte/Lab à 1280 et 390 pixels. Les captures de simulation, inventaire secondaire, visite guidée et Arena restent présentes.

La validation ne couvre pas chaque agencement possible. Firefox et Safari n’ont pas été testés. Le parseur reconnaît des intentions françaises locales et peut demander une formulation précise ; aucun LLM externe n’est utilisé. Les permissions limitent le prélèvement, pas la circulation.

Lab : 12 incidents actifs, 100 entrées par expérience. Une saturation retire réellement les autres bornes et un blocage de dépôt peut rester partiel si une case est occupée ou le budget manque ; le résultat l’indique. Les résolutions sont calculées à partir de l’état courant des éléments concernés. L’historique et les instantanés temporaires disparaissent au rechargement ; la sauvegarde locale reste manuelle et unique. Un enregistrement explicite pendant une expérience remplace cette sauvegarde.

Les workers et Chromium ont nécessité l’exécution autorisée hors des restrictions du sandbox Windows. Aucun service externe, paiement ni déploiement public.
