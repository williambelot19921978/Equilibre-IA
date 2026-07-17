# Sprint 2.2 — Rapport « Édition fiable et boutons visibles »

> **Date :** 13 juillet 2026  
> **Statut :** ✅ Code livré — ⚠️ tests navigateur manuels non exécutés par l’agent  
> **Objectif :** convertir un créneau « Temps libre » en activité persistée + rendre tous les boutons d’action visuellement évidents

---

## 1. Cause exacte — échec modification du temps libre

| Élément | Détail |
|---------|--------|
| **Symptôme** | Transformer un bloc « Temps libre » en « Travail » ne s’appliquait pas |
| **Cause racine** | Le temps libre est un **intervalle calculé** (`blockKind: free_slot`), pas un `calendar_item` |
| **Erreur Sprint 2.1** | `persistTimelineEdit` tentait un UPDATE sur un buffer marge moteur (`item_type=buffer`, `source=ai`) ou créait un item `buffer` au lieu d’un événement utilisateur |
| **Conséquence** | À la replanification, `deleteAutoProposalsForDate` supprimait le buffer modifié ; le type visuel restait « Temps libre » / « Marge » |

### Différence intervalle calculé vs calendar_item

| | Intervalle calculé | calendar_item |
|--|-------------------|---------------|
| Source | `computeFreeSlotEntries` (gaps entre blocs) | Table `calendar_items` |
| `calendarItemId` | ❌ absent | ✅ présent |
| Persistance | ❌ volatile | ✅ Supabase |
| Édition | **CREATE** nouveau `calendar_item` `source=user` | UPDATE ou CREATE override |

---

## 2. Architecture — surcharges quotidiennes

Fonction centrale : `applyTimelineEdit` (`src/services/blockAdjustmentService.ts`)

| Stratégie | Cas | Action |
|-----------|-----|--------|
| `create_manual_item` | Temps libre, marge moteur | INSERT `calendar_item` `source=user`, `locked=true` |
| `update_existing_item` | RDV, tâche, événement utilisateur | UPDATE `calendar_items` |
| `create_daily_override` | Contrainte calculée (travail, routine…) | INSERT surcharge journalière |

Résolution : `resolveTimelineEditStrategy` (`src/lib/planning/applyTimelineEdit.ts`)

Types d’activité : `src/config/activityTypes.ts`

- Mapping `activityType` → `item_type` Supabase (CHECK respecté)
- `details.activityType`, `details.visualType`, `details.constraintType` pour l’affichage

### Timeline enrichie

- `computeFreeSlotEntries` calcule les créneaux libres entre blocs occupés
- Les items marge moteur (`isMarginCalendarItem`) sont **exclus** de la timeline affichée
- Les gaps ≥ 15 min apparaissent comme blocs « Temps libre » modifiables

### Modal dédiée

`EditBlockModal` pour un créneau libre :

- Titre : **« Ajouter une activité dans ce créneau »**
- Sélecteur de type (travail, RDV, tâche, enfants, sport, repos, trajet, événement personnel, autre)
- Verrouillé par défaut
- Fermeture avec **Échap**

---

## 3. Cause CSS — boutons invisibles

| Problème | Détail |
|----------|--------|
| `.secondary-button` | Styles **uniquement** dans des parents scopés (`.empty-card`, `.planning-actions`, etc.) |
| `.modal-actions button` | Aucun style global → texte cliquable sans fond ni bordure |
| Boutons dashboard | Hors conteneurs stylés → apparence de simple texte |

### Correctif design system

Nouveau composant : `src/components/ui/Button.tsx`

| Variante | Usage |
|----------|-------|
| `primary` | Enregistrer, Générer, Créer |
| `secondary` | Annuler, Retour, actions secondaires |
| `danger` | Supprimer |
| `ghost` | Actions discrètes |
| `icon` | Boutons icônes |

- Min-height **44 px** (zone tactile mobile)
- États hover, focus-visible, disabled, loading
- Classes autonomes `.ui-button-*` (pas de dépendance au parent)

---

## 4. Composants / pages remplacés

| Fichier | Changement |
|---------|------------|
| `Button.tsx` + `buttonClasses.ts` | Design system boutons |
| `EditBlockModal.tsx` | Footer modal + Button primary/secondary |
| `DayTimeline.tsx` | Bouton Modifier via Button |
| `HomePage.tsx` | Actions principales via Button |
| `PlanningPage.tsx` | Barre d’actions + modal |
| `CalendarPage.tsx` | Boutons formulaire / navigation |
| `TasksPage.tsx` | Boutons tâches |
| `DailyRoutinePage.tsx` | Boutons enregistrement |
| `FamilyContextPage.tsx` | Boutons périodes |
| `DiscoveryPage.tsx` | Boutons validation |
| `index.css` | Styles `.ui-button-*`, footer modal |

`QuickActionCard` conserve son style carte (déjà visible depuis Sprint 2.1).

---

## 5. Replanification

Après création d’activité dans un créneau libre :

1. INSERT `calendar_item` verrouillé `source=user`
2. `deleteAutoProposalsForDate` (propositions auto obsolètes)
3. `generateAndSaveDayPlan`
4. Message : *« Le créneau 09:00–12:00 est maintenant réservé au travail. J’ai réorganisé les autres tâches… »*

---

## 6. Tests automatisés exécutés

**106/106 tests passent** (`npm test`)

| ID | Scénario | Fichier |
|----|----------|---------|
| A | Temps libre → stratégie CREATE | `sprint22.test.ts` |
| B | RDV → mapping event | `sprint22.test.ts` |
| C | Item persisté → UPDATE | `sprint22.test.ts` |
| D | Contrainte calculée → override | `sprint22.test.ts` |
| F | Explication replanification travail | `replanExplanation.test.ts` |
| G | Variantes Annuler / Enregistrer | `Button.test.ts` |
| H | Classe loading | `Button.test.ts` |
| I | Classe base ui-button | `Button.test.ts` |

### Qualité

| Commande | Résultat |
|----------|----------|
| `npm run build` | ✅ |
| `npm run lint` | ✅ |
| `npm run verify:schema` | ✅ (à confirmer ci-dessous) |
| `npm run verify:supabase` | ✅ (à confirmer ci-dessous) |

---

## 7. Tests manuels navigateur

**Non exécutés par l’agent.**

Scénario recommandé :

1. Générer une journée
2. Repérer un bloc « Temps libre »
3. Modifier → choisir « Travail » → Enregistrer
4. Vérifier bloc Travail + réorganisation
5. F5 → persistance
6. Vérifier boutons Annuler / Enregistrer visibles dans la modal
7. Parcourir Accueil, Planning, Calendrier, Tâches, Mon quotidien

---

## 8. Limites restantes

| Limite | Détail |
|--------|--------|
| Scope période / habitude | Toujours redirigé (message), pas de persistance `profile_facts` |
| Tests E (F5) / J (chevauchement) | Couverts par logique unitaire, pas E2E navigateur |
| Boutons « choice-button » | Sélecteurs discovery / jours travaillés — UI de choix, pas actions primaires |
| Fuseau horaire | Bornes jour en heure locale navigateur |

---

## 9. Critères de fin de sprint

| Critère | Statut |
|---------|--------|
| Temps libre → Travail ou autre activité | ✅ |
| Persistance après F5 (architecture) | ✅ |
| Replanification après création | ✅ |
| Annuler / Enregistrer visibles | ✅ |
| Actions majeures identifiables | ✅ |
| Rapport sprint | ✅ |
