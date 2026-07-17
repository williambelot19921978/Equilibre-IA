# Sprint 2.1 — Rapport « Timeline complète et édition manuelle »

> **Date :** 13 juillet 2026  
> **Statut :** ✅ Code livré — ⚠️ tests navigateur manuels non exécutés par l’agent  
> **Objectif :** journée complète lisible et modifiable sur Accueil + Planning, avec replanification après édition

---

## 1. Cause exacte — RDV manuels absents

| Élément | Détail |
|---------|--------|
| **Symptôme** | Rendez-vous créés dans `/calendar` présents en base mais absents de la timeline |
| **Cause racine** | `loadCalendarItemsForDate` filtrait avec `starts_at >= dayStart AND starts_at <= dayEnd` |
| **Conséquence** | Les RDV qui **chevauchent** la journée sans `starts_at` dans la fenêtre (ex. début la veille, fin le matin) n’étaient jamais chargés |
| **Fichiers** | `src/services/planningService.ts`, `src/services/calendarService.ts` |

### Correctif

- Requête par **chevauchement** : `starts_at <= dayEnd AND ends_at >= dayStart`
- Helper partagé : `src/lib/time/dayBounds.ts` (`getLocalDayBounds`, `overlapsLocalDay`)

---

## 2. Cause exacte — travail absent de la timeline

| Élément | Détail |
|---------|--------|
| **Symptôme** | Trou visuel ~8h–19h alors que l’utilisateur travaille |
| **Cause racine** | `mergeOverlappingConstraints` fusionnait les blocs **adjacents** (`nextStart <= currentEnd`) |
| **Conséquence** | `commute_out` + `work` + `commute_in` fusionnaient en un seul bloc de type `commute_out`, affiché comme « Trajet » au lieu de « Travail » + trajets distincts |
| **Affichage** | `buildDisplayDayView` passait les contraintes **fusionnées** (moteur) à la timeline |

### Correctif

1. Fusion stricte : chevauchement réel uniquement (`nextStart < currentEnd`) — blocs adjacents conservés
2. `buildDayConstraints` retourne désormais :
   - `constraints` → fusionnées (moteur de créneaux)
   - `displayConstraints` → non fusionnées (timeline)
3. `buildDisplayDayView` utilise `displayConstraints` pour `buildDisplayedDayTimeline`
4. Alerte travail incomplet + lien « Mon quotidien » via `DayTimeline`

---

## 3. Boutons d’action rapide

Nouveau composant : `src/components/navigation/QuickActionCard.tsx`

- Bordure, fond, hover, focus/active
- Icône + libellé + sous-texte
- Intégré sur `HomePage` : Planning, Calendrier, Tâches, Mon quotidien, Contexte familial

Styles : `src/index.css` (`.quick-action-card`, variantes primary/default)

---

## 4. Architecture édition manuelle

### Type `ManualBlockAdjustment`

Fichier : `src/types/manualBlockAdjustment.ts`

```typescript
{
  blockId, originalStartsAt, originalEndsAt,
  newStartsAt, newEndsAt, reason,
  scope: "today" | "period" | "recurring",
  createdBy, createdAt
}
```

Persistance dans `calendar_items.details` (pas de migration) :

- `modifiedByUser`, `adjustmentScope`, `originalStartsAt`, `originalEndsAt`, `adjustmentReason`, `comment`

### UI

| Composant | Rôle |
|-----------|------|
| `DayTimeline.tsx` | Icônes, statut, verrouillage, bouton **Modifier** |
| `EditBlockModal.tsx` | Formulaire : titre, heures, durée, verrouillé, commentaire |
| Scope | Choix aujourd’hui / période / habituel pour blocs issus d’habitudes |

### Confirmation

- Bloc verrouillé → case à cocher obligatoire
- Bloc terminé (`status=completed`) → confirmation explicite

### Service

`src/services/blockAdjustmentService.ts` — `applyTimelineEditAndReplan` :

1. Valide le scope (`today` seul implémenté ; `period` / `recurring` redirigent vers Contexte familial / Mon quotidien)
2. Met à jour ou insère un `calendar_item` (`source=user`, `locked` selon choix)
3. Supprime les propositions auto obsolètes (`deleteAutoProposalsForDate`)
4. Régénère le reste (`generateAndSaveDayPlan`)
5. Recharge `loadDisplayedDayPlan`
6. Produit une explication (`buildReplanExplanation`)

Helpers purs : `src/lib/planning/blockAdjustmentHelpers.ts`

Hook : `useDayPlan.editTimelineBlock`, `lastEditExplanation`

---

## 5. Stratégie de replanification

| Règle | Implémentation |
|-------|----------------|
| Conserver le bloc modifié | UPDATE ou INSERT `calendar_items` avant replan |
| Marquer `modifiedByUser` | `details.modifiedByUser = true` |
| Verrouiller si demandé | `locked` sur l’item |
| Supprimer auto obsolète | `shouldDeleteAutoCalendarItem` (exclut `locked`, `user`, `completed`) |
| Recalculer le reste | `generateAndSaveDayPlan` |
| Ne pas déplacer RDV manuels | `source=user` + `locked` préservés |
| Expliquer | `buildReplanExplanation` — durée, déplacements de tâches |

---

## 6. Tests automatisés exécutés

**96/96 tests passent** (`npm test`)

| ID | Scénario | Fichier |
|----|----------|---------|
| A | RDV manuel du jour visible | `displayedDayTimeline.test.ts` |
| B | RDV hors jour invisible (overlap) | `displayedDayTimeline.test.ts` + `dayBounds.test.ts` |
| C | RDV traversant minuit | `displayedDayTimeline.test.ts` |
| D | RDV `source=user` conservé | `displayedDayTimeline.test.ts` |
| I | Travail visible avec trajets | `displayedDayTimeline.test.ts` |
| — | Commute + travail non fusionnés si adjacents | `mergeOverlappingConstraints.test.ts` |
| A | Métadonnées `ManualBlockAdjustment` | `blockAdjustment.test.ts` |
| D/E | Explication replanification | `replanExplanation.test.ts` |
| K | `QuickActionCard` exporté | `QuickActionCard.test.ts` |

### Qualité

| Commande | Résultat |
|----------|----------|
| `npm run build` | ✅ |
| `npm run lint` | ✅ |
| `npm run verify:schema` | ✅ |
| `npm run verify:supabase` | ✅ |

---

## 7. Tests manuels navigateur

**Non exécutés par l’agent** — scénario recommandé :

1. Journée avec réveil, enfants, trajet, travail, RDV, tâche, routine soir, coucher
2. Allonger une tâche 30 → 60 min → vérifier replanification
3. Déplacer un RDV → vérifier adaptation
4. F5 → vérifier persistance

---

## 8. Limites restantes

| Limite | Détail |
|--------|--------|
| Scope période / habituel | Modal propose le choix ; persistance `period` / `recurring` non implémentée (message + redirection) |
| Fuseau horaire | Bornes jour en heure **locale navigateur** ; pas de normalisation Europe/Paris explicite côté serveur |
| Tests E/F (F5, régénération) | Couverts indirectement par la logique overlap + persistance ; pas de test E2E navigateur |
| Chat IA, Spotify, notifications, mode couple | Hors périmètre (non développés) |

---

## 9. Fichiers modifiés / créés

| Fichier | Action |
|---------|--------|
| `src/lib/time/dayBounds.ts` | Créé |
| `src/lib/planning/blockAdjustmentHelpers.ts` | Créé |
| `src/lib/planning/replanExplanation.ts` | Créé |
| `src/types/manualBlockAdjustment.ts` | Créé |
| `src/services/blockAdjustmentService.ts` | Créé |
| `src/components/navigation/QuickActionCard.tsx` | Créé |
| `src/components/planning/EditBlockModal.tsx` | Créé |
| `src/services/planningService.ts` | Requête overlap |
| `src/services/calendarService.ts` | Requête overlap |
| `src/ai/planningEngine.ts` | `displayConstraints` |
| `src/lib/planning/mergeOverlappingConstraints.ts` | Fusion stricte |
| `src/lib/planning/buildDisplayDayView.ts` | Timeline non fusionnée |
| `src/lib/planning/displayedDayTimeline.ts` | Métadonnées édition |
| `src/components/planning/DayTimeline.tsx` | UI enrichie |
| `src/hooks/useDayPlan.ts` | `editTimelineBlock` |
| `src/pages/HomePage.tsx` | QuickActionCard |
| `src/pages/PlanningPage.tsx` | Édition + explication |
| `src/index.css` | Styles actions + modal |

---

## 10. Critères de fin de sprint

| Critère | Statut |
|---------|--------|
| Boutons d’action visuellement évidents | ✅ |
| Travail visible dans la journée | ✅ |
| RDV du jour visibles | ✅ |
| Chaque bloc modifiable (Planning) | ✅ |
| Replanification auto après modification | ✅ |
| Rapport sprint | ✅ |
