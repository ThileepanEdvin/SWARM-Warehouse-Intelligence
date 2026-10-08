# SWARM — Warehouse Management & Intelligence

**Version 1.2** : plateforme locale de gestion d’entrepôt robotisé. Le moteur existant, A*, les collisions, les batteries, les missions et les animations sont conservés. Stocks, catalogue, permissions, flotte, Arena et Lab utilisent les opérations métier réelles.

## Lancer

Dans le dossier du projet, avec Node.js 20.19+ ou 22.12+ et npm :

```powershell
npm install
npm run dev
```

Ouvrir l’adresse locale affichée par Vite, généralement http://127.0.0.1:5173. La monnaie est fictive. Aucun service externe ni paiement n’est requis.

## Rubriques

- **Simulation** : carte interactive, routes, cartons, décisions, pause, vitesse, caméra et vue immersive.
- **Stocks & Commandes** : inventaire par emplacement, stock total/réservé/disponible, capacités, mouvements, autorisations et priorité ; catalogue personnalisé ; commandes multi-unités avec source, robot et dépôt choisis.
- **Flotte de robots** : tableau, diagnostics, missions, autorisations et zones prioritaires, recharge, suspension administrative, réparation et suivi sur la carte.
- **Éditeur d’entrepôt** : équipements et obstacles. Les nouveaux rayonnages sont vides et identifiés. Le stock et les missions protègent les suppressions.
- **Stations de recharge** : bornes libres/occupées, batteries et demandes de recharge ; ajout de bornes via l’éditeur.
- **SWARM ARENA** : Sprint contre Smart Balance, charge de 1 à 200 commandes, durée de 1/2/5/10 minutes, même état initial, caméras communes, rapport mesuré et rejeu exact.
- **SWARM LAB** : visite guidée et expérimentation libre, dix incidents, diagnostics, solutions et restauration de l’état initial en mémoire.
- **Analytics** : mesures et historique du moteur.
- **Événements** : journal des opérations et décisions d’affectation.

**SWARM Copilot** propose des intentions françaises prédéfinies, localement, avec aperçu et confirmation avant modification. Il ne s’agit pas d’une IA générative. Les instructions inconnues ou ambiguës ne modifient pas la partie.

## Vérifier

```powershell
npm run typecheck
npm run lint
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Les tests Playwright démarrent leur serveur local sur 4173. Les tests antérieurs sont conservés, avec leurs sélecteurs adaptés aux nouvelles rubriques. Voir [VALIDATION.md](VALIDATION.md) pour les résultats réellement exécutés.

## Présenter

Suivre [DEMONSTRATION.md](DEMONSTRATION.md) : Coca-Cola dans A-1 et livraison de cinq unités avec R001 ; incident et réparation ; duel à 50 commandes pendant deux minutes simulées. Ces trois parcours sont testés dans un navigateur réel.

Les captures se trouvent dans `artifacts/`, dont [inventaire](artifacts/swarm-inventory.png), [flotte](artifacts/swarm-fleet.png), [Lab](artifacts/swarm-lab.png), [Arena 50 commandes](artifacts/swarm-arena-50.png), [mobile](artifacts/swarm-fleet-mobile.png), [vue immersive](artifacts/swarm-immersive.png) et [détour](artifacts/swarm-reroute.png).

## Persistance et limites

La sauvegarde est manuelle, locale au navigateur et unique. Le rechargement restaure la dernière sauvegarde en pause. Les anciennes sauvegardes sans catalogue, emplacements et permissions sont migrées au chargement ; les données incohérentes sont rejetées. Sauvegarder explicitement une démo ou un incident remplace ce même emplacement.

Les copies temporaires du Lab et de la visite guidée ainsi que les duels ne survivent pas au rechargement. Carte fixe 24 × 16, 24 robots, 200 commandes ouvertes, 100 produits, 50 unités par commande. Un colis par trajet ; les grandes commandes nécessitent plusieurs trajets. Les permissions concernent le prélèvement, pas la circulation dans les couloirs. La coordination locale peut nécessiter de rouvrir un passage complètement fermé. Aucun backend, cloud, multi-utilisateur ou fonctionnement hors onglet.

[Architecture](ARCHITECTURE.md) · [Historique](CHANGELOG.md) · [Validation](VALIDATION.md) · [Présentation](DEMONSTRATION.md)
