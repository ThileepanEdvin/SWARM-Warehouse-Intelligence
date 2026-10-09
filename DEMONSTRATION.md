# Parcours de vérification 1.4

Suivre le parcours stock/livraison du README dans une nouvelle partie vide : Paramètres → Nouvelle partie · zéro commande, confirmer. Une sauvegarde existante n’est jamais vidée automatiquement. Créer COCA sans stock, ajouter 100 automatiquement puis 50 manuellement dans A-1, livrer 10 en automatique puis 5 avec R001. Activer le Sandbox pour ajouter 1 000 puis 10 000 sans épuiser le budget fictif. Sauvegarder, recharger et vérifier quantités, permissions, recettes et commandes terminées.

Tester une quantité négative ou décimale, une commande supérieure au stock et un robot interdit : raison visible, validation refusée et absence de mouvement. Le raccourci Approvisionner ce produit ouvre le formulaire. Le simple enregistrement du rayonnage ne change pas ses marchandises.

Pour conserver les scénarios précédents, utiliser les démonstrations explicites ci-dessous. Le stock y est maintenant ajouté par son bouton dédié après enregistrement des paramètres.

# Présenter SWARM 1.3 — parcours exact en six étapes

Ouvrir http://127.0.0.1:5173/. Si nécessaire, lancer `npm run dev` depuis le projet. Pour préserver durablement votre progression, cliquez **Sauvegarder** avant la démonstration.

**Préparation : Paramètres → Préparer la démonstration UX.** Ce bouton conserve votre partie en mémoire, ouvre Stocks & Commandes en pause, crée Coca-Cola (COCA, 12 €) et Fanta (FANTA, 10 €), prépare A-1, A-2 et A-4 vides et ne lance aucune commande. Les marchandises préparées appartiennent à ce scénario temporaire. **Quitter la démo**, en haut, restaure exactement votre partie d’origine. La préparation ne remplace pas la sauvegarde manuelle.

## 1. Gérer le stock sur la carte

Dans **Stocks & Commandes → Entrepôt**, cliquez **A-1**. Dans le panneau droit : choisissez **Coca-Cola**, choisissez **R001** dans **Robot prioritaire**, puis **Enregistrer les modifications**. Saisissez ensuite **10** dans **Quantité à ajouter ou retirer** et cliquez **Ajouter les marchandises**. Le stock réel devient 10 ; le budget baisse de 80 €. Survolez A-1 pour vérifier produit, total, disponible, réservations, capacité et priorité. Les mouvements sont consultables dans le panneau.

## 2. Ajouter du stock automatiquement

Ouvrez **SWARM Copilot — Stock**, saisissez **Ajoute 20 Fanta dans un emplacement libre.**, puis **Analyser** et **Confirmer l’opération**. Fanta est ajouté dans **A-2**, premier emplacement vide compatible par référence ; A-1 contient déjà Coca-Cola et est préservé. La réponse annonce A-2 et son stock de 20, la carte le souligne et le panneau l’affiche. Coût réel : 160 €.

## 3. Retrouver une marchandise

Dans ce même Copilot, saisissez **Dans quelle case se trouve le Coca-Cola ?**, puis **Analyser**. Il répond **A-1 (10 disponibles)**, met cet emplacement en évidence et ouvre sa fiche. Aucun stock ni commande n’est modifié. Fermez Copilot avec **×** avant la sélection suivante.

## 4. Configurer les robots

Ouvrez **Flotte de robots**. Cliquez **R001**, sur la carte ou dans la liste compacte. Dans **Que peut récupérer ce robot ?**, choisissez **Produits sélectionnés**, cochez **Coca-Cola**, puis **Enregistrer les autorisations**. R001 ne prélèvera plus Fanta. Les permissions des emplacements continuent à s’appliquer.

Ouvrez **SWARM Copilot — Robots** et saisissez **R003 travaille seulement sur A-1 et A-2.** → **Analyser** → **Confirmer l’opération**. Les deux rayonnages sont mis en évidence et la règle réelle est enregistrée. Pour vérifier les données communes, demandez **Quels robots peuvent récupérer le Coca-Cola de A-1 ?**. Fermez le Copilot.

Alternative manuelle : mode **Rayonnages sélectionnés** → **Sélectionner sur la carte** → cliquez les emplacements → **Confirmer la sélection**. **Annuler la sélection** ne modifie aucune règle métier.

## 5. Livrer cinq unités réellement

Revenez dans **Stocks & Commandes**, ouvrez Copilot Stock et demandez **Crée une commande urgente de 5 Coca-Cola depuis A-1.** → **Analyser** → **Confirmer l’opération**. Fermez Copilot. Choisissez **×10**, puis **Reprendre la simulation**.

Dans l’onglet **Commandes**, observez la progression jusqu’à **Terminée, 5/5**. R001 est prioritaire et compatible. Chaque unité est prélevée, transportée et déchargée ; il effectue plusieurs trajets. La fiche A-1 indique ensuite **5 unités restantes** et la commande a généré **60 €**. Mettez la simulation en pause.

## 6. Provoquer et résoudre un incident

Ouvrez **SWARM LAB → Expérimentation libre**. Cliquez la carte **Robot en panne**, sélectionnez R001 sur la carte, puis **Déclencher l’incident**. Le robot s’arrête réellement ; le panneau indique son état, sa mission éventuelle et les commandes touchées. Après la livraison de l’étape précédente, il peut n’avoir aucune mission : le diagnostic dit alors zéro commande touchée.

Cliquez **Réparer · 90 €**. Le budget baisse exactement de 90 € et l’incident affiche **Résolu**. Reprenez la simulation pour observer le fonctionnement. Pour tester plusieurs incidents, choisissez **Passage bloqué**, cliquez une case libre, puis déclenchez : un véritable obstacle apparaît. Le diagnostic de cet incident propose **Retirer l’obstacle**, sans solutions de stock ou de batterie sans rapport.

**Restaurer l’état initial du Lab** revient à l’instantané du premier accès au laboratoire. **Quitter la démo**, en haut, revient à votre partie personnelle conservée. Ces retours n’écrivent pas automatiquement dans la sauvegarde manuelle.

Ce parcours complet, y compris préparation par le bouton, livraison, réparation et retour exact à la partie, est vérifié dans `tests/ux.spec.ts`.

## Visite guidée préservée

Dans SWARM LAB : **Visite guidée · Démo intelligente** → Voir les livraisons → Comprendre une mission → Fermer son passage → Provoquer une panne → Observer la recharge → Comparer les stratégies. Le moteur reste réel, les incidents peuvent attendre les conditions nécessaires et le bouton de retour préserve la partie d’origine.

## Démonstration 3 — Arena, 50 commandes et 2 minutes

1. Ouvrir **SWARM ARENA**. Choisir **Batteries variées · graine 2026**, **50 commandes**, **2 minutes**.
2. Lire les stratégies : **SPRINT / Nearest** minimise le trajet de prélèvement ; **SMART BALANCE / Balanced** utilise `distance + (100 − batterie) × 0,12`. Priorités et permissions sont communes.
3. Lancer à ×10. Les copies indépendantes ont exactement les mêmes commandes, stocks, robots, batteries, positions, permissions et infrastructures. La partie principale reste en pause. Les caméras partagent cadrage et zoom.
4. Comparer les commandes livrées, attentes, robots occupés, distance et énergie. Le rapport distingue les commandes en file d’attente des missions réellement bloquées. Une limite de stock est annoncée avant le départ.
5. Lire le classement : davantage de commandes livrées, puis préparation moyenne plus courte, puis énergie plus faible. Si les trois critères sont identiques, égalité. À durée fixe, des missions peuvent rester inachevées sans être échouées.
6. Cliquer **Rejouer exactement le même duel** : le rapport doit être identique. Aucun gagnant n’est prédéfini.

Le scénario à 50 commandes est vérifié deux fois dans Playwright. Avec 22 commandes initiales et 2 minutes, les scénarios de référence 2026 et 77 produisent respectivement une victoire de Smart Balance et de Sprint, vérifiée par les tests métier. Les chiffres dépendent du scénario et de la charge choisis ; ils ne sont jamais injectés dans l’interface.

## Exemples Copilot et limites

Assistant local à intentions prédéfinies, sans LLM externe. Les modifications passent par un aperçu et une confirmation ; les contraintes sont revérifiées. Exemples : « Crée un produit Eau. », « Crée Eau et ajoute 15 unités dans A-4. », « Ajoute-moi un stock de 10 Coca-Cola. », « Montre-moi les rayonnages presque vides. », « Le robot 1 peut chercher uniquement du Coca-Cola. », « Autorise R001 sur A-3. », « Envoie R001 se recharger. ».

Un emplacement contenant des marchandises ou réservations ne peut changer silencieusement de produit. Sans capacité ni emplacement compatible, l’opération est refusée sans mutation. Un produit encore inconnu peut être créé avec les paramètres clairement annoncés dans la confirmation.

Grille 24 × 16, 24 robots, 200 commandes ouvertes, 100 produits, 1 000 000 unités par commande et un colis par trajet. Lab : 12 incidents actifs et 100 entrées maximum par expérience. Une saturation retire réellement les autres bornes ; la restauration du Lab les récupère. Un dépôt peut rester accessible si des cases occupées empêchent un blocage complet. Les permissions concernent le prélèvement, pas les couloirs.

Sauvegarde locale unique et manuelle, reprise en pause. Les parties conservées, l’historique et l’instantané du Lab, les confirmations en attente et les duels disparaissent au rechargement. Cliquer Sauvegarder pendant une expérience remplace volontairement la même sauvegarde. Aucun backend, compte, service payant ni déploiement public.
