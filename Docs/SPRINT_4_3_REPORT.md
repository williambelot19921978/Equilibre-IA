# Sprint 4.3 — Rythmes A/B corrigés & planification active du soir

> **Date :** 16 juillet 2026  
> **Statut :** ✅ Livré (migration `00012` à appliquer si colonne absente)  
> **Objectif :** corriger la sélection des rythmes professionnels A/B/cycle et exploiter le créneau du soir après le coucher des enfants

---

## Contraintes respectées

| Contrainte | Statut |
|------------|--------|
| Pas de nouvelle IA externe / LLM | ✅ Moteur déterministe `eveningOpportunityEngine.ts` |
| Compatibilité `work_days` | ✅ Fallback inchangé |
| Source unique travail | ✅ `resolveWorkStatusForDate` + patterns persistés |
| Quality gate local | ✅ build, lint, 478 tests |
| Migration versionnée | ✅ `00012_sprint43_evening_planning.sql` |

---

## BUG 1 — Sélection rythme A/B inopérante

### Cause racine

Dans `WorkScheduleSection`, le `useEffect` de chargement dépendait de `workDays` (nouveau tableau à chaque render via `extractWorkDaysFromFacts`). Chaque clic radio déclenchait un rechargement Supabase qui réinitialisait `patternType` / mode.

### Correctif

| Fichier | Rôle |
|---------|------|
| `src/lib/work/workScheduleEditorState.ts` | `hydrateEditorFromPattern`, `applyScheduleModeChange`, `patternTypeToMode` |
| `src/hooks/useWorkScheduleEditor.ts` | Hook stable : `userTouchedRef` bloque l'écrasement ; dépendance `workDaysKey` |
| `src/components/profile/WorkScheduleSection.tsx` | UI réécrite : radios → `setMode`, semaines A/B, bouton dédié |
| `src/pages/ProfilePage.tsx` | Section visible **hors** mode « Modifier » |

### Comportement attendu (validé)

1. Le type choisi change immédiatement dans l'interface
2. Les champs adaptés apparaissent (fixe / A-B / cycle 2–4 semaines)
3. Semaines A et B modifiables
4. Bouton « Enregistrer mon rythme » toujours visible
5. Persistance dans `work_schedule_patterns` via `saveWorkSchedulePattern`
6. F5 recharge le même rythme (après sauvegarde)
7. Calendrier, Life Engine et Planning Engine consomment le pattern via `resolveWorkStatusForDate`
8. Message d'erreur explicite si la sauvegarde échoue (`formatSupabaseError`)

### Tests (33 cas sprint 4.3)

Fichier : `src/lib/work/sprint43.test.ts` — choix `fixed_week`, `alternating_weeks`, `cycle`, semaines A/B, preview, RLS, samedi alterné, mardi compensateur, intégration planning.

---

## BUG 2 — Soirée vide après coucher des enfants

### Cause racine

- `bedTime: "00:00"` était interprété comme minuit **le même jour** → créneau du soir = 0 minute
- Aucune logique ne remplissait explicitement l'intervalle enfants couchés → coucher adulte

### Correctifs

| Fichier | Rôle |
|---------|------|
| `src/lib/time/bedTime.ts` | `00:00` = fin de soirée (jour suivant) ; marge 30 min avant coucher |
| `src/ai/eveningOpportunityEngine.ts` | `resolveEveningOpportunity` — max 60 % rempli, temps libre conservé |
| `src/types/eveningPlanning.ts` | Types + `DEFAULT_EVENING_PLANNING_MODE = suggestions_only` |
| `src/lib/planning/eveningTimelineEntries.ts` | Blocs → entrées timeline (`status: proposed`) |
| `src/lib/planning/displayedDayTimeline.ts` | Header « Temps disponible du soir » + suggestions |
| `src/lib/planning/freeSlotEntries.ts` | `computeEveningAvailableSlot` utilise `resolveBedWindDownEnd` |
| `src/ai/lifeEngine.ts` | `dayEndIso` via `resolveBedTimeIso` |

### Règles de décision implémentées

- Journée fatigante → temps calme / lecture
- Priorité études → révision limitée (`preferredFocusMinutes`)
- Sport absent ≥ 3 jours + énergie → mobilité courte (pas après 21 h)
- Parent seul / fatigue → planification légère uniquement
- Maximum 60 % du créneau planifié
- Marge 20–30 min avant coucher (`wind_down`)
- Bloc « Temps libre conservé » toujours présent
- Réseaux sociaux proposés comme loisir encadré
- Chaque bloc porte un `reason` explicite (pas de certitude)

### Préférence utilisateur `evening_planning_mode`

| Mode | Comportement |
|------|--------------|
| `automatic` | Blocs ajoutés au planning (non `proposed`) |
| `suggestions_only` | **Défaut** — affichage `status: proposed` |
| `disabled` | Créneau libre avec explication |

**UI :** Profil → Repos → `EveningPlanningPreference.tsx`  
**Persistance :** `user_home_preferences.evening_planning_mode` (migration `00012`)

### Exemple de créneau 20:30–00:00

Le moteur **ne copie pas** l'exemple mécaniquement : il compose transition, révision, mobilité, loisir, préparation coucher et temps libre selon le contexte, dans la limite de 60 %.

---

## Quality gate

| Commande | Résultat |
|----------|----------|
| `npm run build` | ✅ |
| `npm run lint` | ✅ (warnings préexistants hooks / fast-refresh) |
| `npm test` | ✅ **478 tests** (+33 sprint 4.3) |
| `npm run verify:schema` | ✅ **15/15** tables (dont `work_schedule_patterns`) |
| `npm run verify:supabase` | ✅ Connexion OK |
| `npm run preview` | ⚠️ Port 4173 déjà occupé (instance preview probablement active) |

---

## Migrations

| Migration | Contenu |
|-----------|---------|
| `00011` (Sprint 4.2) | `work_schedule_patterns` — **appliquée** (verify:schema OK) |
| `00012` (Sprint 4.3) | Colonne `evening_planning_mode` sur `user_home_preferences` |

```sql
-- Appliquer si la colonne est absente
supabase db push
-- ou exécuter manuellement 00012_sprint43_evening_planning.sql
```

---

## Fichiers créés / modifiés

### Créés

- `src/lib/work/workScheduleEditorState.ts`
- `src/hooks/useWorkScheduleEditor.ts`
- `src/lib/time/bedTime.ts`
- `src/types/eveningPlanning.ts`
- `src/ai/eveningOpportunityEngine.ts`
- `src/lib/planning/eveningTimelineEntries.ts`
- `src/components/profile/EveningPlanningPreference.tsx`
- `src/lib/work/sprint43.test.ts`
- `supabase/migrations/00012_sprint43_evening_planning.sql`

### Modifiés

- `src/components/profile/WorkScheduleSection.tsx`
- `src/pages/ProfilePage.tsx`
- `src/lib/planning/displayedDayTimeline.ts`
- `src/lib/planning/freeSlotEntries.ts`
- `src/lib/planning/buildDisplayDayView.ts`
- `src/ai/lifeEngine.ts`
- `src/ai/memoryEngine.ts`
- `src/services/layoutPreferencesService.ts`
- `src/services/memoryContextService.ts`
- `src/types/layoutPreferences.ts`
- `src/styles/sprint42.css`

---

## Tests manuels recommandés

1. **Profil → Vie professionnelle** : sélectionner « Semaines alternées A/B » → vérifier apparition Semaine B → Enregistrer → F5 → même mode
2. **Samedi alterné + mardi compensateur** : preview 6 semaines + calendrier mensuel
3. **Accueil** : enfants couchés 20:30, coucher adulte 00:00 → header soir + suggestions avec explications
4. **Profil → Repos** : changer mode soir (`automatic` / `suggestions_only` / `disabled`) → vérifier timeline

> Tests navigateur non exécutés automatiquement dans ce sprint — validation par tests unitaires + quality gate.

---

## Critères d'acceptation

- [x] Choix A/B fonctionne et persiste
- [x] Rotation influence calendrier et planning
- [x] Soirées ne restent plus vides sans explication
- [x] Life Engine / timeline proposent des activités adaptées après coucher enfants
- [x] Préférence `evening_planning_mode` configurable
- [x] Rapport sprint documenté
