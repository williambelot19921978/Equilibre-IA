# Sprint 4.8.2 — Travail ponctuel appliqué, Terminer fiable, calendrier Planning compact

**Date :** 17 juillet 2026  
**Type :** correctif ciblé (pas de nouvelle fonctionnalité hors périmètre)

## Résumé

| Bug | Cause | Correctif |
|-----|-------|-----------|
| « Je travaille demain matin » annoncé mais non appliqué | `work_morning_only` exigeait « seulement/uniquement » ; replan avalé silencieusement ; réponse « C'est fait » sans vérification | Détection « je travaille + matin » ; enrichissement horaires profil ; `NlpExecutionResult` + réponses honnêtes ; `verifyWorkBlocksInPlan` ; `dispatchPlanRefresh` |
| Bouton Terminer inopérant sans modification | Terminer couplé au formulaire / état dirty / garde `calendarItemId` | `completeTimelineEntry()` central ; bouton Terminer indépendant dans `EditBlockModal` ; anti double-clic |
| Calendrier trop grand sur `/planning` | `MonthCalendar` pleine largeur au-dessus de la timeline | Variant `planningCompact` (~260 px) en haut à droite ; mobile replié « Choisir une date » |

## Quality gate

| Commande | Résultat |
|----------|----------|
| `npm test` | ✅ 701 tests |
| `npm run build` | ✅ |
| `npm run lint` | ✅ (warnings préexistants) |
| `npm run verify:schema` | ✅ |
| `npm run verify:supabase` | ✅ |

---

## BUG 1 — Travail demain matin réellement appliqué

### Pipeline NLP tracé (dev)

`[NLP WORK TRACE]` dans `conversationEngine.ts` — `normalizedText`, `detectedIntent`, `extractedDate`, `workExceptionKind`, `resolvedAction`, payload, persistance, replan, blocs.

### Fichiers

| Fichier | Rôle |
|---------|------|
| `src/ai/nlp/entityExtractor.ts` | « Je travaille demain matin » → `work_morning_only` **avant** règles « seulement » |
| `src/lib/nlp/enrichWorkEntities.ts` | Horaires matin depuis profil (`defaultWorkStart` / `defaultWorkEnd`) |
| `src/ai/nlp/actionResolver.ts` | `MarkWorkDay` avec `halfDay: work_morning_only` ; `formatAssistantReply` honnête |
| `src/ai/nlp/nlpClarification.ts` | « À quelle heure commences-tu et termines-tu demain matin ? » si horaires absents |
| `src/services/nlpActionService.ts` | Persistance override, replan avec résultats, `verifyWorkBlocksInPlan`, `dispatchPlanRefresh` |
| `src/lib/work/verifyWorkBlocksInPlan.ts` | Vérifie `commute_out` + `work` + `commute_in` dans le plan |
| `src/lib/planning/planRefreshEvents.ts` | Event `equilibre:plan-refresh` pour recharger la timeline |
| `src/hooks/useDayPlan.ts` | Écoute refresh ; expose `completingEntryId` |
| `src/contexts/ConversationProvider.tsx` | Passe horaires profil au runtime NLP |
| `src/lib/work/workExceptionTypes.ts` | Badge « Matin travaillé » pour `work_morning_only` |

### Réponses assistant

| Situation | Message |
|-----------|---------|
| Succès complet (persistance + replan + blocs) | « C'est fait. J'ai ajouté ton travail demain matin et recalculé la journée. » |
| Persistance OK, replan échoué | « Le travail est enregistré, mais je n'ai pas réussi à recalculer le planning. » |
| Échec persistance | « Je n'ai pas réussi à ajouter ce travail : [cause]. » |
| Horaires absents | Clarification — **ne pas inventer** |

### Phrase de référence

« Je travaille demain matin » :

- `workExceptionKind = work_morning_only`
- `affectedPeriod = morning`
- Override `family_context_periods` avec `context_type = work_morning_only`
- Timeline : Trajet aller → Travail → Trajet retour ; après-midi libre
- Calendrier : « Matin travaillé » / demi-journée travaillée — pas Repos

---

## BUG 2 — Bouton Terminer fiable

### Fichiers

| Fichier | Rôle |
|---------|------|
| `src/services/completeTimelineEntry.ts` | Action centrale : vérifie terminable → `completeActivityWithFeedback` → refresh |
| `src/lib/planning/isTimelineEntryCompletable.ts` | Quels blocs peuvent être terminés |
| `src/lib/planning/resolveBlockCompletionAvailability.ts` | `allowEarlyCompletion` pour terminer en avance |
| `src/services/blockActionService.ts` | Action `complete` via `completeTimelineEntry` |
| `src/components/planning/EditBlockModal.tsx` | Bouton **Terminer** indépendant du submit Enregistrer |
| `src/components/planning/BlockActionsMenu.tsx` | Anti double-clic (`completing`), loading « Terminaison… » |
| `src/pages/PlanningPage.tsx` | `handleCompleteEntry`, wiring modal + timeline |
| `src/pages/HomePage.tsx` | Même wiring sur Accueil |

### Comportement

- Terminer fonctionne **sans modification** préalable
- Ne dépend pas de l'état dirty du formulaire
- Feedback : « Activité terminée. » ou erreur précise
- Garde anti double-clic pendant l'appel async

---

## BUG 3 — Calendrier Planning compact

### Fichiers

| Fichier | Rôle |
|---------|------|
| `src/components/calendar/MonthCalendar.tsx` | Variant `planningCompact` — cellules petites, libellés minimaux |
| `src/pages/PlanningPage.tsx` | Layout `planning-top-row` : titre à gauche, mini-calendrier à droite |
| `src/styles/sprint482.css` | Styles desktop aside + mobile accordéon |

### Desktop

```
[ Titre Planning + date + actions ]   [ Mini calendrier ~260 px ]
[ Timeline immédiatement en dessous ]
```

Lien « Ouvrir le calendrier complet » sous le mini-calendrier.

### Mobile

- Calendrier replié par défaut
- Bouton « Choisir une date » → panneau accordéon
- Timeline prioritaire visuellement

---

## Tests Sprint 4.8.2

`src/lib/work/sprint482.test.ts` — 14 scénarios (A–N) :

- A–F : NLP « Je travaille demain matin », clarification, enrichissement, actions, réponses honnêtes
- G : `verifyWorkBlocksInPlan`
- H–K : `completeTimelineEntry`, terminable sans modif, modal Terminer, anti double-clic
- L–N : calendrier compact, mobile replié, plan refresh event

Mises à jour : `sprint481.test.ts` (K2), `sprint41.test.ts` (mocks `NlpExecutionResult`), `nlpEngine.test.ts`.

---

## Validation manuelle recommandée

1. Assistant : « Je travaille demain matin. » → vérifier réponse, calendrier, blocs trajet/travail/trajet
2. Ouvrir activité → ne rien modifier → Terminer → statut + feedback
3. `/planning` desktop : mini-calendrier en haut à droite, timeline visible sans décalage
4. `/planning` mobile : calendrier replié, « Choisir une date »
5. F5 conserve date et planning
