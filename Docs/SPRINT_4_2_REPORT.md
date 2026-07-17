# Sprint 4.2 — Navigation compacte, rythmes variables & saint du jour

> **Date :** 16 juillet 2026  
> **Statut :** ✅ Livré (migration `00011` à appliquer en prod)  
> **Objectif :** sidebar repliable, rythmes professionnels cycliques, saint/fête du jour, source unique de résolution du travail

---

## Contraintes respectées

| Contrainte | Statut |
|------------|--------|
| Pas de nouvelle IA externe | ✅ Aucun LLM ajouté |
| Compatibilité `work_days` existant | ✅ Fallback conservé |
| Source unique calendrier + planning + life | ✅ `resolveWorkStatusForDate` |
| Quality gate local | ✅ build, lint, 445 tests, preview OK |
| Migration versionnée + RLS | ✅ `00011_sprint42_work_schedule_sidebar.sql` |

---

## 1. Navigation latérale compacte

### Comportement desktop (≥ 768 px)

| Mode | Largeur | Détail |
|------|---------|--------|
| Ouvert | 220 px | Libellés + pied de page visibles |
| Compact | 72 px | Icônes seules, `title` au survol |
| Toggle | Bouton « replier / déplier » | Dans la sidebar |
| Persistance | `user_home_preferences.sidebar_collapsed` | Survit F5 + reconnexion |

### Fichiers

- `AppSidebar.tsx` — toggle, classes `app-sidebar-collapsed`
- `AppShell.tsx` — wrapper `app-shell-sidebar-expanded|collapsed`
- `useSidebarPreferences.ts` + `layoutPreferencesService.ts`
- `src/styles/sprint42.css`

### Mobile

Bottom nav + drawer inchangés — pas de sidebar permanente.

---

## 2. Rythmes de travail variables

### Modèle `WorkSchedulePatternData`

| Champ | Rôle |
|-------|------|
| `patternType` | `fixed_week`, `alternating_weeks`, `cycle`, `custom_rotation` |
| `effectiveFrom` | Date d'entrée en vigueur |
| `cycleLengthWeeks` | 1 à 8 semaines |
| `referenceWeek` | Lundi de référence pour la position du cycle |
| `weeklyPatterns` | Travail / repos + horaires par jour |
| `compensatoryRules` | Samedi travaillé → mardi repos, etc. |
| `workOverrides` | Exceptions ponctuelles |

### Source de vérité

**`resolveWorkStatusForDate()`** — `src/lib/work/resolveWorkStatusForDate.ts`

Ordre de priorité :

1. Vacances (`user_vacation`, `children_vacation`)
2. Override ponctuel (`workOverrides`)
3. Repos exceptionnel (contexte familial `disableWork`)
4. Horaire / journée exceptionnelle (`exceptional_work_hours`, `forceWorkDay`)
5. Repos compensateur (lookback 14 j sur jour déclencheur)
6. Règle de cycle / semaines alternées
7. Jours fixes `work_days`
8. Repos par défaut

**Intégrations :**

- `resolveCalendarDayStatus` → couleurs cellules (dont `compensatory_rest`, `exceptional_work`)
- `lifeEngine.determineDayType` + `resolveLifeContext`
- `planningEngine.buildDayConstraints` → trajet + travail + trajet ; « Journée de repos » si compensateur

### Stockage

**Migration :** `supabase/migrations/00011_sprint42_work_schedule_sidebar.sql`

| Table / colonne | Rôle |
|-----------------|------|
| `work_schedule_patterns` | Cycles complexes (JSONB + RLS) |
| `user_home_preferences.sidebar_collapsed` | Sidebar repliée |
| `user_home_preferences.show_saint_calendar` | Saint du jour si spiritualité off |

Index unique : une seule rotation `active = true` par utilisateur.

### UI Profil

**Section « Mon rythme de travail »** — `WorkScheduleSection.tsx` dans Vie professionnelle :

- Semaine fixe / semaines A-B / cycle 2-4 semaines
- Repos compensateur configurable
- Aperçu « Sur les six prochaines semaines »

---

## 3. Saint ou fête du jour

### Source

`src/content/catholicCalendar.ts`

- Saints fixes (calendrier traditionnel français)
- Fêtes mobiles via Computus (Pâques grégorienne)
- Référence documentée : calendrier liturgique romain général (FR), année 2026
- Distinction `saintName` vs `liturgicalCelebration`

### Affichage

`MotivationCard` — ligne discrète sous la phrase + bouton « En savoir plus ».

Préférence `showSaintCalendar` : visible même si `faith_importance = disabled`.

### Fêtes mobiles testées

Pâques, Mercredi des Cendres, Ascension, Pentecôte, Assomption, Toussaint, Noël, changement d'année.

---

## 4. Tests automatisés (A–R)

Fichier : `src/lib/work/sprint42.test.ts` — **20 scénarios**, 445 tests totaux au vert.

| ID | Scénario | Résultat |
|----|----------|----------|
| A | Semaine fixe | ✅ |
| B | Samedi sur 2 | ✅ |
| C | Samedi sur 3 | ✅ |
| D | Semaine A / B | ✅ |
| E | Mardi compensateur | ✅ |
| F | Exception ponctuelle | ✅ |
| G | Vacances écrasent travail | ✅ |
| H | Reprise cycle après vacances | ✅ |
| I | Calendrier = planning | ✅ |
| J | Trajet + travail + trajet | ✅ |
| K | Repos compensateur planning | ✅ |
| L–N | Sidebar ouverte / compacte / persistance | ✅ (structure) |
| O–R | Saint fixe / mobile / spiritualité off / année | ✅ |

---

## 5. Quality gate

| Commande | Résultat |
|----------|----------|
| `npm run build` | ✅ |
| `npm run lint` | ✅ (warnings préexistants) |
| `npm test` | ✅ 445/445 |
| `npm run verify:schema` | ⚠️ 14/15 — `work_schedule_patterns` absent (migration non poussée) |
| `npm run verify:supabase` | Non exécuté (dépend migration) |
| `npm run preview` | ✅ (build prod OK) |

### Action requise prod

```bash
# Appliquer la migration 00011 sur Supabase
supabase db push
# ou exécuter manuellement 00011_sprint42_work_schedule_sidebar.sql
```

---

## 6. Fichiers créés / modifiés (principaux)

| Fichier | Action |
|---------|--------|
| `supabase/migrations/00011_sprint42_work_schedule_sidebar.sql` | Créé |
| `src/lib/work/resolveWorkStatusForDate.ts` | Créé |
| `src/lib/work/workScheduleCycle.ts` | Créé |
| `src/lib/work/workScheduleBuilders.ts` | Créé |
| `src/lib/work/resolveWorkFromContext.ts` | Créé |
| `src/types/workSchedule.ts` | Créé |
| `src/services/workScheduleService.ts` | Créé |
| `src/services/layoutPreferencesService.ts` | Créé |
| `src/content/catholicCalendar.ts` | Créé |
| `src/components/profile/WorkScheduleSection.tsx` | Créé |
| `src/styles/sprint42.css` | Créé |
| `src/lib/work/sprint42.test.ts` | Créé |
| `AppSidebar.tsx`, `AppShell.tsx` | Modifié |
| `resolveCalendarDayStatus.ts`, `dayCellVisual.ts` | Modifié |
| `lifeEngine.ts`, `planningEngine.ts`, `memoryEngine.ts` | Modifié |
| `MotivationCard.tsx`, `ProfilePage.tsx`, `HomePage.tsx` | Modifié |
| `useCalendarViewData.ts`, `CalendarPage.tsx`, `MonthCalendar.tsx` | Modifié |

---

## 7. Tests navigateur

Non exécutés dans cette session — validation recommandée :

1. Replier / déplier la sidebar → F5 → état conservé
2. Configurer un samedi sur 2 + mardi compensateur → vérifier calendrier orange/vert
3. Vérifier planning : blocs trajet + travail un jour travaillé
4. Vérifier saint du jour dans la carte motivation

---

> **Sprint 4.2 terminé** lorsque la migration est appliquée en prod et les tests navigateur ci-dessus validés.
