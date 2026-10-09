# SWARM — Warehouse Management & Intelligence

**Version 1.4** : plateforme locale de gestion d’entrepôt robotisé. Le moteur existant, A*, les collisions, les batteries, les missions et les animations sont conservés. Stocks, catalogue, permissions, flotte, Arena et Lab utilisent les opérations métier réelles.

## Lancer

Dans le dossier du projet, avec Node.js 20.19+ ou 22.12+ et npm :

```powershell
npm install
npm run dev
```

Ouvrir l’adresse locale affichée par Vite, généralement http://127.0.0.1:5173. La monnaie est fictive. Aucun service externe ni paiement n’est requis.

## Stock et premières livraisons

Une nouvelle partie normale démarre sans commande, sans marchandise et sans revenu. Les six robots conservent leurs batteries initiales. Les sauvegardes existantes sont restaurées ; les charges de démonstration sont explicites dans Paramètres.

1. Stocks & Commandes → Produits : créer Coca-Cola, SKU COCA, valeur 12. Cela ne crée aucun stock.
2. **+ Ajouter du stock** : choisir Coca-Cola, quantité 100, placement automatique ; vérifier le coût de 800 €, puis confirmer. Pour ajouter 50 au même endroit, choisir Manuel et cliquer A-1 sur la carte.
3. Commandes : Coca-Cola, quantité 10, source/robot/dépôt automatiques ; créer la commande, reprendre et choisir ×10. La recette de 120 € arrive après livraison complète ; le stock passe de 150 à 140.
4. Une commande manuelle impose le robot choisi. Les erreurs de stock, permissions, autonomie ou trajet sont affichées avant validation.
5. Le panneau de rayonnage utilise **Enregistrer les modifications** pour ses paramètres uniquement ; une quantité séparée sert à ajouter ou retirer les marchandises.

Les ajouts 1 000 et 10 000 sont exacts. Le placement automatique privilégie le même produit puis les emplacements vides accessibles, et répartit les quantités si des capacités finies le demandent. Un échec ne crée ni produit, ni mouvement, ni débit. Les nouveaux rayonnages sont sans plafond métier ; les anciennes capacités configurées sont préservées. Garde-fou numérique : 1 milliard d’unités par rayonnage/ajout, commandes jusqu’à 1 million, encombrement jusqu’à 10. Les quantités sont des entiers sûrs ; aucun objet graphique par unité.

**Sandbox : approvisionnement gratuit** est facultatif. Il dispense uniquement du coût des marchandises ; achats, réparations et fonctionnement restent payants. La somme non débitée et le mode sont visibles dans les finances et sauvegardés. Copilot utilise le même service, par exemple « Crée Eau et ajoute 1 000 unités dans un rayonnage libre ».

## Rubriques

- **Simulation** : carte interactive, routes, cartons, décisions, pause, vitesse, caméra et vue immersive.
- **Stocks & Commandes** : carte principale avec références et infobulles réelles, panneau de rayonnage ; onglets Entrepôt, Commandes, Produits et Liste secondaire ; inventaire par emplacement, stock total/réservé/disponible, capacités, mouvements, autorisations et priorité ; catalogue personnalisé ; commandes multi-unités avec source, robot et dépôt choisis.
- **Flotte de robots** : carte, liste compacte, sélection multiple des rayonnages avec confirmation/annulation, restrictions par produits ou emplacements ; tableau détaillé secondaire, diagnostics, missions et zones prioritaires, recharge, suspension administrative, réparation et suivi sur la carte.
- **Éditeur d’entrepôt** : équipements et obstacles. Les nouveaux rayonnages sont vides et identifiés. Le stock et les missions protègent les suppressions.
- **Stations de recharge** : bornes libres/occupées, batteries et demandes de recharge ; ajout de bornes via l’éditeur.
- **SWARM ARENA** : Sprint contre Smart Balance, charge de 1 à 200 commandes, durée de 1/2/5/10 minutes, même état initial, caméras communes, rapport mesuré et rejeu exact.
- **SWARM LAB** : visite guidée et expérimentation libre, dix cartes d’incident, paramètres contextuels, sélection directe sur la carte, historique de 12 incidents actifs maximum, diagnostics ciblés, solutions et restauration de l’état initial en mémoire.
- **Analytics** : mesures et historique du moteur.
- **Événements** : journal des opérations et décisions d’affectation.

**SWARM Copilot — Stock / Robots** partage les mêmes données et propose des intentions françaises prédéfinies, localement, avec aperçu et confirmation avant modification. Il ne s’agit pas d’une IA générative. Les instructions inconnues ou ambiguës ne modifient pas la partie.

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

Dans **Paramètres → Préparer la démonstration UX**, votre partie est conservée en mémoire et le scénario démarre en pause. Suivre les six étapes de [DEMONSTRATION.md](DEMONSTRATION.md) : carte, ajout automatique, recherche, autorisations, livraison et incident. **Quitter la démo** restaure votre partie. La visite guidée et Arena restent disponibles dans le Lab.

Les captures se trouvent dans `artifacts/`, dont [carte des stocks](artifacts/swarm-ux-stock-map.png), [carte de flotte](artifacts/swarm-ux-fleet-map.png), [incident Lab](artifacts/swarm-ux-lab-incident.png), [Arena 50 commandes](artifacts/swarm-arena-50.png), [mobile](artifacts/swarm-fleet-mobile.png), [vue immersive](artifacts/swarm-immersive.png) et [détour](artifacts/swarm-reroute.png).

## Persistance et limites

La sauvegarde est manuelle, locale au navigateur et unique. Le rechargement restaure la dernière sauvegarde en pause. Les anciennes sauvegardes sans catalogue, emplacements et permissions sont migrées au chargement ; les données incohérentes sont rejetées. Sauvegarder explicitement une démo ou un incident remplace ce même emplacement.

Les copies temporaires du Lab et de la visite guidée ainsi que les duels ne survivent pas au rechargement. Carte fixe 24 × 16, 24 robots, 200 commandes ouvertes, 100 produits, 1 000 000 unités par commande. Un colis par trajet ; les grandes commandes nécessitent plusieurs trajets. Les permissions concernent le prélèvement, pas la circulation dans les couloirs. La coordination locale peut nécessiter de rouvrir un passage complètement fermé. Aucun backend, cloud, multi-utilisateur ou fonctionnement hors onglet.

[Architecture](ARCHITECTURE.md) · [Historique](CHANGELOG.md) · [Validation](VALIDATION.md) · [Présentation](DEMONSTRATION.md)

Point de restauration Git créé avant cette finalisation : commit `6b05bf0`, tag `restore/swarm-1.3-before-supply`. Voir [ARCHITECTURE.md](ARCHITECTURE.md) pour les fichiers concernés.
