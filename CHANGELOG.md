# Extension SWARM ARENA — 9 octobre 2026

Six stratégies réellement branchées, sélecteurs A/B indépendants, quatre scénarios, paramètres verrouillés pendant le duel, métriques d’urgences/autonomie/équité et rapport par critère. Copies indépendantes, pas identiques et rejeu conservés ; aucune refonte des autres modules. Formules et exemples mesurés dans [ARENA.md](ARENA.md).

# Version 1.4 — stocks, commandes et approvisionnement

- Partie normale vide et démonstrations explicitement chargées ; sauvegardes existantes conservées.
- Ajout de stock automatique ou manuel, création simultanée du produit, aperçu du coût et du placement, répartition selon capacité et accès, opération atomique.
- Un seul champ de quantité dans le panneau du rayonnage ; enregistrement des paramètres sans ajout de marchandises.
- Grandes quantités exactes, livraisons progressives, validation détaillée des commandes, Sandbox gratuit limité aux stocks et comptabilité explicite.
- Copilot partage les services métier ; contrôles des quantités, anciennes sauvegardes et réservations conservés.

# Historique des fonctionnalités

## 1.3.0 — 9 octobre 2026 — Cartes interactives et Copilot contextuel

- Stocks : carte principale, identifiants stables lisibles, infobulles réelles, panneau de rayonnage et enregistrement atomique produit/stock/capacité/priorité ; liste et opérations avancées conservées.
- Flotte : carte et liste compacte, autorisations par produit ou rayonnage, sélection multiple avec confirmation et annulation, actions liées à l’état et missions avancées conservées.
- Copilot partagé Stock / Robots : français local, placement automatique déterministe, recherche et surbrillance, aliases robot 1, restrictions, missions réelles avec vérification d’accès et batterie ; aucune mutation avant confirmation.
- Lab : dix cartes d’incident, paramètres contextuels, cibles choisies sur la carte, historique en mémoire, diagnostics et solutions ciblés, résolution fondée sur le moteur, limites et restauration.
- Préparation d’une démonstration UX reproductible avec partie conservée et bouton de retour ; visite guidée et Arena préservées.
- 18 nouveaux tests métier et cinq nouveaux parcours navigateur ; 68 tests métier et 24 parcours Chromium au total. Documentation et captures actualisées.
- Point de restauration préalable : fbfda91, tag restore/swarm-1.2-before-ux.

## 1.2.0 — Gestion d’entrepôt, Arena et Lab

- Pages complètes Stocks & Commandes, Flotte, recharge, Analytics et Événements ; navigation sans doublon de démo.
- Catalogue personnalisé, capacités, codes stables, mouvements et stocks disponibles/réservés par emplacement.
- Permissions croisées robot/emplacement, priorités réelles et libération sûre des réservations lors des changements.
- Commandes avec source, robot et destination choisis ; revenus figés, prélèvements et livraisons multi-unités.
- Administration des robots, diagnostics, suspension, réactivation, réparation et suivi ; coûts centralisés.
- Copilot local à intentions prédéfinies, demandes ambiguës refusées, aperçu et confirmation avant opération.
- SWARM ARENA : nombre de commandes configurable, durée 1/2/5/10 minutes, stock annoncé, caméras communes et classement sur trois critères calculés.
- SWARM LAB : visite guidée et expérimentation, dix incidents réels, solutions et restauration après passage dans l’éditeur.
- Migration des anciennes sauvegardes et validation des nouvelles références ; nouveaux tests et trois présentations automatisées.

## 1.1.0 — 8 octobre 2026

- Refonte du rendu SVG : zones identifiables, rayonnages par produits, robots distincts, cartons visibles et informations techniques au survol.
- Prélèvement, transport, déchargement, expédition et récompenses liés aux véritables transitions ; pause et vitesse cohérentes avec le rendu.
- Affichage du score d’affectation, des motifs de recharge/attente/panne, des traces de trajet et de la réaffectation constatée.
- Écran principal simplifié, commandes rapides, vue immersive et panneau de progression de mission.
- SWARM DUEL : deux moteurs et cartes indépendants, mêmes conditions initiales, pause/vitesse/durée commune, rapport calculé et relancement reproductible.
- Scénarios de référence 2026 et 77 avec résultats favorisant des stratégies différentes.
- Démo guidée reproductible, incidents programmables et retour à la partie d’origine en mémoire.
- Recettes et achats visibles, coûts précis, messages français et conseils sur les configurations bloquées.
- Compatibilité des sauvegardes précédentes, validation des nouveaux champs et conservation des fonctions existantes.
- Nouveaux tests métier, de duel et de navigateur ; captures réelles bureau, mobile, démo et duel.

## 1.0.0 — 8 octobre 2026

- Moteur déterministe indépendant du rendu, A*, réservation de cellules et missions complètes avec colis visibles.
- Stock et réservations, priorités de commandes, trois produits et réapprovisionnement.
- Batteries, recharge graduelle, panne, réparation et préservation des colis.
- Économie locale : investissement, consommation et recettes de commandes terminées.
- Édition réelle des rayonnages, obstacles, bornes et dépôts ; recalcul des itinéraires.
- Laboratoire : lots de 10/50/100 commandes, pannes, batteries faibles et indisponibilité des équipements.
- Comparaison reproductible de deux stratégies sur des copies du même instantané.
- Contrôles pause/reprise, ×1/×2/×5/×10, caméra et itinéraires affichés.
- Analytics et journal issus des transitions réelles, sauvegarde locale manuelle et reprise en pause.
- Interface responsive, mode clair/sombre, guide intégré et raccourcis clavier.
- Tests automatisés des règles métier et parcours Playwright dans Chromium.
