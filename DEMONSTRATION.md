# Présenter SWARM 1.2

## Préparer une présentation reproductible

Lancer `npm run dev`, puis ouvrir l’adresse locale indiquée. Sauvegarder sa partie avant les expériences. Pour repartir du scénario connu, Paramètres → Entrepôt de démonstration #42, puis mettre en pause immédiatement. Les références A, B, C sont conservées. Les robots disposent désormais de codes lisibles R001 à R006 et les emplacements A-1 à E-8 ; leurs identifiants internes historiques sont conservés.

## Démonstration 1 — Stock et livraison, environ deux minutes

1. Ouvrir **Stocks & Commandes**, onglet **Catalogue produits**. Créer **Coca-Cola**, SKU **COCA**, valeur unitaire **12 €**, encombrement **1**, couleur rouge.
2. Aller à **Inventaire**, puis **Gérer A-1**. Le scénario initial contient 12 unités d’un ancien produit : choisir 12 et **Retirer les marchandises**, puis confirmer le retrait sans remboursement. Une réservation éventuelle empêche ce retrait ; terminer la mission ou annuler une commande encore non prélevée avant de recommencer.
3. Choisir Coca-Cola comme produit de l’emplacement et **Configurer l’emplacement**. Ajouter **10 marchandises** : le budget baisse de 80 €, aucun ordre de livraison n’est créé.
4. Choisir **R001** comme robot prioritaire et appliquer les permissions. Pour tester une exclusivité, cocher le mode réservé et R001, puis appliquer. Les zones propres au robot restent également prises en compte.
5. Cliquer **Commander depuis cet emplacement**, quantité **5**, priorité urgente, source **A-1**, robot **R001**. Créer la commande. Stock, commande et réservations sont trois notions distinctes.
6. Ouvrir Simulation, sélectionner R001, reprendre à ×10. Il transporte une unité à la fois, donc effectue plusieurs trajets. À la fin : stock A-1 = **5**, commande livrée = **5/5**, recette de cette commande = **60 €**. Les autres commandes du scénario peuvent aussi générer des recettes.

Ce parcours est exécuté dans `tests/management.spec.ts`, avec vérification du stock, de la source, du robot, des cinq livraisons et du revenu réel.

## Démonstration 2 — Incident, réservation et réparation

1. Ouvrir **SWARM LAB**, **Expérimentation libre**. L’état au premier accès au Lab est conservé en mémoire, même lorsqu’on passe dans l’éditeur pour résoudre un incident.
2. Reprendre brièvement jusqu’à une affectation, puis mettre en pause. Choisir **Robot en panne** et le robot visé, puis **Déclencher l’incident**.
3. Lire le diagnostic : robot concerné, mission, batterie, colis et raison. Avant prélèvement, la réservation est libérée et une commande automatique peut être reprise. Une commande imposant ce robot attend sa réparation. Après prélèvement, le colis reste à bord et ne sera pas livré deux fois.
4. Cliquer **Réparer · 90 €**, puis reprendre. La réparation débite le budget une seule fois. Un budget insuffisant laisse le robot en panne. Une panne ne peut pas être effacée gratuitement via la mise hors service administrative.
5. Pour un détournement automatique prêt à présenter, choisir **Visite guidée · Démo intelligente** : Voir les livraisons → Comprendre une mission → Fermer son passage → Provoquer une panne → Observer la recharge → Comparer les stratégies.
6. **Restaurer l’état initial du Lab** restaure l’instantané de l’expérimentation après confirmation. **Retour à ma partie conservée** quitte la visite guidée. Ces copies en mémoire ne remplacent pas la sauvegarde manuelle.

Les dix incidents modifient réellement le moteur : panne, batterie critique, obstacle sur trajet, commandes massives, rupture locale de stock, borne unique avec plusieurs demandes, fermeture des accès aux dépôts, immobilisation, pannes simultanées et interdiction d’un emplacement. Les réservations et cases occupées sont protégées : un incident peut rester partiel et son diagnostic le précise. Les solutions du Lab réparent, réapprovisionnent, réouvrent les permissions, achètent un robot ou ouvrent l’éditeur pour ajouter une borne, un dépôt ou retirer un obstacle.

## Démonstration 3 — Arena, 50 commandes et 2 minutes

1. Ouvrir **SWARM ARENA**. Choisir **Batteries variées · graine 2026**, **50 commandes**, **2 minutes**.
2. Lire les stratégies : **SPRINT / Nearest** minimise le trajet de prélèvement ; **SMART BALANCE / Balanced** utilise `distance + (100 − batterie) × 0,12`. Priorités et permissions sont communes.
3. Lancer à ×10. Les copies indépendantes ont exactement les mêmes commandes, stocks, robots, batteries, positions, permissions et infrastructures. La partie principale reste en pause. Les caméras partagent cadrage et zoom.
4. Comparer les commandes livrées, attentes, robots occupés, distance et énergie. Le rapport distingue les commandes en file d’attente des missions réellement bloquées. Une limite de stock est annoncée avant le départ.
5. Lire le classement : davantage de commandes livrées, puis préparation moyenne plus courte, puis énergie plus faible. Si les trois critères sont identiques, égalité. À durée fixe, des missions peuvent rester inachevées sans être échouées.
6. Cliquer **Rejouer exactement le même duel** : le rapport doit être identique. Aucun gagnant n’est prédéfini.

Le scénario à 50 commandes est vérifié deux fois dans Playwright. Avec 22 commandes initiales et 2 minutes, les scénarios de référence 2026 et 77 produisent respectivement une victoire de Smart Balance et de Sprint, vérifiée par les tests métier. Les chiffres dépendent du scénario et de la charge choisis ; ils ne sont jamais injectés dans l’interface.

## Copilot local

Ouvrir **SWARM Copilot**. Exemples : « Crée un produit Fanta. », « Ajoute 20 Fanta dans A-2. », « Seul R002 peut travailler sur A-2. », « Mets R001 prioritaire sur A-1. », « Combien de Coca-Cola reste-t-il ? », « Crée une commande urgente de 5 Coca-Cola avec R001. », « Montre les emplacements presque vides. »

Ce parseur local reconnaît des intentions prédéfinies et n’est pas une IA générative. Chaque modification présente un aperçu et attend **Confirmer l’opération** ; les contraintes sont revérifiées. Un emplacement contenant un autre produit doit être vidé avant changement. « Mets 10… » ajoute 10 unités, comme « Ajoute 10… ». Une demande inconnue ou ambiguë n’exécute rien.

## Limites à annoncer

Grille 24 × 16, 24 robots, 200 commandes ouvertes, 100 produits, 50 unités par commande et un colis par trajet. Les permissions concernent les emplacements de prélèvement, pas l’interdiction de circuler dans un couloir. Les mouvements sont conservés sur les 100 dernières opérations par emplacement et le journal sur 160 événements. Des couloirs définitivement fermés demandent une intervention.

Sauvegarde locale manuelle unique, reprise en pause. Les instantanés temporaires du Lab et de la visite guidée, les intentions Copilot non confirmées et la progression des duels disparaissent au rechargement. Enregistrer explicitement une expérimentation remplace la même sauvegarde manuelle. Aucun compte, service payant, API LLM ou déploiement public.
