# Sprint 4.8.3 — Planning sans calendrier, Annuler fiable, clarification mémorisée

**Date :** 17 juillet 2026  
**Type :** correctif ciblé (pas de nouvelle fonctionnalité hors périmètre)

## Résumé

| Bug | Cause | Correctif |
|-----|-------|-----------|
| Calendrier encore trop imposant sur `/planning` | Variant compact Sprint 4.8.2 insuffisant | Suppression totale de `MonthCalendar` ; navigation jour + lien discret vers `/calendar` |
| Bouton Annuler sans effet | `action === "cancel"` non géré dans `blockActionService` | `cancelTimelineEntry()` central + anti double-clic |
| « De 8 h à midi » ignoré après clarification | Pas de contexte pending ; chaque phrase traitée isolément | `PendingConversationAction` dans `ConversationState` ; complétion prioritaire des entités manquantes |

## Quality gate

| Commande | Résultat |
|----------|----------|
| `npm test` | ✅ 718 tests |
| `npm run build` | ✅ |
| `npm run lint` | ✅ |
| `npm run verify:schema` | ✅ |
| `npm run verify:supabase` | ✅ |

---

## 1 — Retrait calendrier Planning

### Fichiers

| Fichier | Changement |
|---------|------------|
| `src/pages/PlanningPage.tsx` | Suppression `MonthCalendar`, mobile accordion, chargement marqueurs |
| `src/styles/sprint483.css` | Header simplifié + lien « Ouvrir le calendrier » |

### Comportement

- Navigation : Jour précédent / Aujourd'hui / Jour suivant (`DayNavigationBar`)
- Date dans l'URL inchangée
- Lien discret « Ouvrir le calendrier » → `/calendar`
- Timeline immédiatement sous titre + actions
- Calendrier complet : `/calendar` et drawer uniquement

---

## 2 — Bouton Annuler fiable

### Cause

Le handler `onCancelEntry` appelait `handleBlockAction({ action: "cancel" })`, mais `applyBlockAction` ne traitait pas cette action → exception « Action non reconnue » silencieuse côté UI.

### Fichiers

| Fichier | Rôle |
|---------|------|
| `src/services/cancelTimelineEntry.ts` | Action centrale : vérifie annulable, DELETE `calendar_item`, event `cancelled`, replan, feedback |
| `src/lib/planning/isTimelineEntryCancellable.ts` | Garde métier |
| `src/lib/planning/isCancelledCalendarItem.ts` | Filtre items annulés de la timeline |
| `src/services/blockActionService.ts` | Branche `action === "cancel"` |
| `src/components/planning/BlockActionsMenu.tsx` | Loading « Annulation… », anti double-clic |
| `src/hooks/useDayPlan.ts` | `cancellingEntryId` |

### Feedback

- Succès : « Activité annulée pour aujourd'hui. »
- Échec : message d'erreur via `PlanningGenerationError`
- Log dev : `[CANCEL ACTIVITY CLICK]`

La tâche d'origine n'est **pas** supprimée — seul `skip_count` est incrémenté.

---

## 3 — Contexte conversationnel pending

### Structure

```typescript
PendingConversationAction {
  id, intent, originalText,
  missingEntities, collectedEntities,
  targetDate, createdAt, expiresAt,
  confirmationRequired
}
```

Stocké dans `ConversationState.pending` avec `kind: "clarification"`.

### Fichiers

| Fichier | Rôle |
|---------|------|
| `src/lib/nlp/pendingConversationAction.ts` | Types, TTL 30 min, merge entités, annulation |
| `src/lib/nlp/parseClarificationTimeResponse.ts` | Parse « De 8 h à midi », « 8h-12h », « de huit heures à midi », réponses partielles |
| `src/ai/nlp/resolvePendingClarificationResponse.ts` | Complète entités depuis réponse utilisateur |
| `src/ai/nlp/conversationEngine.ts` | Priorité pending avant NLP général ; exécution après complétion |

### Flux

1. « Je travaille demain matin » → pending + question horaires
2. « De 8 h à midi » → merge `startTime=08:00`, `endTime=12:00`, `targetDate=demain`
3. Exécution `MarkWorkDay` + vérification persistance/replan
4. « Finalement non » → abandon + « D'accord, je n'applique pas cette modification. »

---

## Tests Sprint 4.8.3

`src/lib/work/sprint483.test.ts` — 18 scénarios (A–R).

Mise à jour : `sprint482.test.ts` (plus de calendrier sur Planning).

---

## Validation manuelle recommandée

1. `/planning` — aucun calendrier mensuel, timeline visible immédiatement
2. Ouvrir activité → Annuler → feedback + bloc disparu → F5
3. « Je travaille demain matin » → « De 8 h à midi » → blocs travail demain
4. « Finalement non » pendant une clarification → abandon propre
