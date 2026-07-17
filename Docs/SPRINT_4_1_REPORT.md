# Sprint 4.1 — Accueil épuré & assistant conversationnel fiable

> **Date :** 15 juillet 2026  
> **Statut :** ✅ Livré (avec limites documentées ci-dessous)  
> **Objectif :** simplifier radicalement l'accueil, personnaliser les widgets, rendre le NLP français réellement utilisable

---

## Contraintes respectées

| Contrainte | Statut |
|------------|--------|
| Pas de nouvelle grosse fonctionnalité | ✅ Refactor accueil + fiabilisation NLP uniquement |
| Accueil épuré par défaut | ✅ 4 widgets visibles |
| Personnalisation persistante | ✅ Migration + service (à appliquer en prod) |
| NLP phrases annoncées | ✅ 12/12 reconnues en tests automatisés |
| Quality gate | ✅ build, lint, 397 tests, preview OK |

---

## PARTIE A — Accueil épuré

### 1. Widgets visibles par défaut

```typescript
visibleWidgets: ["motivation", "calendar", "today_timeline", "next_activity"]
```

| Widget | Composant | Rôle |
|--------|-----------|------|
| Motivation | `MotivationWidget` | Phrase courte + changer / espace spirituel |
| Calendrier | `CompactCalendarWidget` | Mois lisible, pleine largeur, non compressé |
| Planning du jour | `TodayTimelineWidget` | Timeline avec repli automatique des moments passés |
| Prochaine activité | `NextActivityWidget` | Bloc en cours / prochain |

**Masqués par défaut :** analyses mémoire, progression découverte, contexte familial complet, suggestions multiples, résumé semaine, cartes secondaires, hero stats.

### 2. Architecture modulaire

```
src/components/home/widgets/
├── MotivationWidget.tsx
├── CompactCalendarWidget.tsx
├── TodayTimelineWidget.tsx
├── NextActivityWidget.tsx
├── FamilyContextWidget.tsx
├── MemoryInsightsWidget.tsx
├── HomeWidgetRenderer.tsx
└── types.ts
```

`HomePage.tsx` orchestre uniquement : préférences → `HomeWidgetRenderer` → contexte partagé (`HomeWidgetContext`).

### 3. Personnalisation

**Modal :** `HomeCustomizationModal` (bouton « Modifier les éléments de mon accueil »)

- Cases à cocher par widget (13 blocs configurables)
- Boutons Monter / Descendre pour l'ordre
- Bouton « Restaurer la disposition par défaut »

Widgets configurables : motivation, calendrier, planning, prochaine activité, tâches, contexte familial, vacances, suggestions IA, espace spirituel, progression profil, analyses mémoire, météo, résumé semaine.

### 4. Persistance

**Migration :** `supabase/migrations/00010_user_home_preferences.sql`

| Colonne | Type | Rôle |
|---------|------|------|
| user_id | uuid | Propriétaire |
| household_id | uuid | Foyer (optionnel) |
| visible_widgets | jsonb | IDs visibles |
| widget_order | jsonb | Ordre d'affichage |
| compact_mode | boolean | Mode compact |
| updated_at | timestamptz | Dernière MAJ |

**RLS :** SELECT / INSERT / UPDATE sur ses propres lignes.

**Service :** `homePreferencesService.ts` + hook `useHomePreferences`  
Fallback local si table absente → défauts en mémoire jusqu'à migration appliquée.

> ⚠️ **Action requise :** la migration `00010` n'est pas encore appliquée sur le projet Supabase distant (`verify:schema` → table absente). Exécuter la migration pour persistance F5 / multi-appareils.

### 5. Planning qui s'allège

`DayTimeline` — prop `collapsePastByDefault` activée sur l'accueil quand `isLiveToday` :

- Blocs entièrement passés masqués
- Ligne compacte : « N moments déjà passés » + bouton « Afficher les moments passés »
- Bloc en cours et futurs restent visibles
- Date passée → mode historique complet
- Date future → tout affiché

### 6. Calendrier non compressé

- Layout colonne unique (`home-widgets-stack`) — pas de grille 2 colonnes étroite
- `home-calendar-shell` : `min-width: 320px` (360px desktop)
- Pleine largeur mobile, cellules tactiles

**Styles :** `src/styles/sprint41.css`

---

## PARTIE B — Assistant conversationnel fiable

### 7. Diagnostic — causes des échecs Sprint 3.1

| Problème | Cause racine |
|----------|--------------|
| Seule la fatigue fonctionnait | Patterns intent trop restrictifs ; pas de normalisation accents/variantes |
| Vacances avec dates | `dateRange` partiel ; pas d'expansion sur toute la période pour RebuildDay |
| Travail + horaires | Regex `de 9h à 17h` incompatible après normalisation `9 h` → `9 heure` |
| « Je travaille plus tard » | Pattern trop large créait des faux positifs ; maintenant clarification |
| Sport / prière / RDV | Intents manquants ou noyés (calendar vs sport) |
| Suppression sport | Pas de filtre par date dans DeleteSportTasks |
| Réponses « C'est fait » sans action | `formatAssistantReply` ne vérifiait pas le retour service |

### 8. Corrections NLP

| Fichier | Amélioration |
|---------|--------------|
| `textNormalizer.ts` | Accents, apostrophes, variantes FR (bosse→travaille, footing→courir, rdv→rendez-vous) |
| `entityExtractor.ts` | Plages horaires `de X heure à Y heure`, demain matin, semaine prochaine, `workTimeStart/End`, durée « une heure et demie » |
| `intentEngine.ts` | Intents séparés : delete sport (92) vs add sport ; `modify_calendar` ; musculation, marche, au travail, temps calme |
| `actionResolver.ts` | RebuildDay sur plage complète ; MarkWorkDay avec horaires ; CreateAppointment ; DeleteSportTasks scoping date |
| `nlpClarification.ts` | Demande jour/heure si phrase vague |
| `conversationEngine.ts` | Clarification avant exécution ; debug DEV ; échec service → pas de « C'est fait » |
| `nlpActionService.ts` | CreateAppointment, MarkWorkDay horaires, DeleteSportTasks filtré |
| `intentMatrix.ts` | Matrice documentée `NLP_INTENT_MATRIX` + `INTENT_EXPRESSION_MATRIX` |

### 9. Matrice d'intentions (extrait)

| Clé | Exemples reconnus |
|-----|-------------------|
| WORK_OVERRIDE | je travaille demain, je bosse, au travail mercredi, de 9h à 17h, finis plus tard |
| VACATION | en vacances, vacances du 10 au 18 août, pose mes vacances |
| SPORT | courir, footing, musculation, marche, supprime mon sport |
| SPIRITUAL | prier, temps de prière, moment spirituel, temps calme chrétien |
| APPOINTMENT | rendez-vous demain à 14h, rdv |
| STUDY | lire, réviser, déplace ma révision |

### 10. Barre de conversation

`FloatingConversationBar` :

- Placeholder : « Ex. Je suis en vacances du 10 au 18 août »
- Exemples cliquables (5 phrases)
- Panneau `[NLP DEBUG]` en DEV uniquement (intent, entités, actions, résultat service)
- `ConversationProvider.lastDebug` expose les infos au composant

### 11. Confirmation & réponses fiables

- Suppression sport, modifications récurrentes → confirmation « oui / non »
- Actions ponctuelles (RDV, lecture, sport unique) → exécution directe
- Réponse succès uniquement si service OK ; sinon message d'échec explicite

---

## Tests

### Automatisés

| Suite | Tests |
|-------|-------|
| `nlpEngine.test.ts` (Sprint 3.1) | 62 |
| `sprint41.test.ts` (Sprint 4.1) | 93 |
| **Total projet** | **397** ✅ |

Couverture Sprint 4.1 : 12 phrases obligatoires, variantes sans accents, dates relatives, heures, durées, clarification, échec service, matrice intents, 80+ scénarios FR.

### Navigateur + Supabase

| Test | Statut |
|------|--------|
| Session Supabase authentifiée | ❌ Non exécuté automatiquement (pas de E2E Playwright configuré) |
| 8 scénarios manuels demandés | ⚠️ **Non validés en navigateur réel** dans cette session |

**Raison :** absence de runner E2E ; migration `00010` non appliquée sur l'instance distante.

**Procédure manuelle recommandée :**

1. Appliquer migration `00010_user_home_preferences.sql`
2. `npm run dev` → http://localhost:5173
3. Se connecter, tester les 8 phrases, vérifier calendrier/planning/Supabase, F5

---

## Quality gate

| Commande | Résultat |
|----------|----------|
| `npm run build` | ✅ |
| `npm run lint` | ✅ (3 warnings existants non bloquants) |
| `npm test` | ✅ 397/397 |
| `npm run verify:schema` | ⚠️ `user_home_preferences` absente (migration à appliquer) |
| `npm run verify:supabase` | ✅ Connexion OK |
| `npm run preview` | ✅ http://localhost:4173 |

---

## Limites restantes

1. **Migration Supabase** — appliquer `00010` pour persistance réelle des préférences accueil
2. **Tests navigateur** — validation manuelle requise avec session authentifiée
3. **Widgets placeholder** — `important_tasks`, `spiritual_space`, `weather`, `week_summary` : configurables mais pas encore implémentés (retournent `null`)
4. **Déplacement révision** — reconnu comme `modify_study` + date demain ; pas de déplacement physique d'un bloc existant (RebuildDay / CreateReadingBlock)
5. **CancelTasksByCategory** — action déclarée mais non câblée au service
6. **Route `/settings/home`** — non créée ; modal utilisée pour V1

---

## Fichiers principaux modifiés / créés

```
supabase/migrations/00010_user_home_preferences.sql
src/types/homePreferences.ts
src/services/homePreferencesService.ts
src/hooks/useHomePreferences.ts
src/components/home/HomeCustomizationModal.tsx
src/components/home/widgets/*
src/pages/HomePage.tsx
src/styles/sprint41.css
src/ai/nlp/textNormalizer.ts
src/ai/nlp/intentMatrix.ts
src/ai/nlp/nlpClarification.ts
src/ai/nlp/sprint41.test.ts
src/lib/planning/expandDateRange.ts
src/components/conversation/FloatingConversationBar.tsx
src/contexts/ConversationProvider.tsx
scripts/verify-schema.mjs
Docs/SPRINT_4_1_REPORT.md
```

---

## Critères de clôture Sprint 4.1

| Critère | Statut |
|---------|--------|
| Accueil nettement plus épuré | ✅ |
| Calendrier non compressé | ✅ |
| Planning se réduit avec le temps | ✅ |
| Choix des éléments visibles | ✅ |
| Phrases principales comprises (tests auto) | ✅ 12/12 |
| Assistant ne prétend pas succès si échec | ✅ |
| Persistance après F5 (prod) | ⚠️ Après migration 00010 |
| Tests navigateur réels | ⚠️ À valider manuellement |

---

## Complément — Couleur des jours travaillés (profil)

### Symptôme (régression)

Le calendrier affichait vacances et week-ends, mais **pas** les jours travaillés du profil — même avec `work_days` renseigné dans Mon Profil.

**Causes identifiées :**

1. **CSS legacy (`index.css`)** — `.month-calendar-day { background: #f9fbfa }` et `.month-calendar-selected { background: #568d79 }` écrasaient les couleurs inline.
2. **`workDays` parfois vide** — le calendrier compact dépendait de `memoryContext.profile.workDays` (chargement indirect) au lieu de lire directement `profile_facts`.

### Logique de calcul (source unique)

```
resolveCalendarDayStatus({ date, workDays, contextPeriods, holidays, overrides })
        ↓
resolveDayCellVisual(date, { workDays, contextPeriods, … })
        ↓
MonthCalendar — classes month-calendar-day-{work|rest|vacation|…}
        ↓
CSS sprint41.css (!important) — couleur cellule entière
```

**Priorité métier :**

| # | Condition | Couleur | Token CSS |
|---|-----------|---------|-----------|
| 1 | Vacances (`user_vacation`, `children_vacation`) | Vert soutenu | `--day-vacation` |
| 2 | Déplacement (`work_travel`) | Ambre | `--day-travel` |
| 2 | Parent seul / spécial | Violet | `--day-special` |
| 3 | Jour férié (`holidays[]`) | Bleu profond | `--day-holiday` |
| 4 | Override repos (`disableWork`) | Vert clair | `--day-rest` |
| 5 | Override travail (`forceWorkDay`, `exceptional_work_hours`) | Orange | `--day-work` |
| 6 | `isWorkDay(date, workDays)` | Orange | `--day-work` |
| 7 | Jour non travaillé (semaine) | Vert clair | `--day-rest` |
| 8 | Samedi / dimanche | Bleu clair | `--day-weekend` |
| 9 | Aucune info | Neutre | — |

**Exemple profil (lun/mar/jeu/ven travail, mer repos) — semaine 13–17 juil. 2026 :**

| Date | Jour | Statut | Couleur |
|------|------|--------|---------|
| 2026-07-13 | Lundi | workday | 🟧 orange |
| 2026-07-14 | Mardi | workday | 🟧 orange |
| 2026-07-15 | Mercredi | restday | 🟩 vert clair |
| 2026-07-16 | Jeudi | workday | 🟧 orange |
| 2026-07-17 | Vendredi | workday | 🟧 orange |

Vacances sur la période → vert soutenu, même sur un lundi travaillé.

### Source des données

```typescript
// Lecture directe depuis profile_facts (prioritaire)
extractWorkDaysFromFacts(profileFacts)  // fact_key = "work_days"

// Accueil : profileFacts déjà chargés → workDays immédiat
// Calendrier complet : getProfileFacts + extractWorkDaysFromFacts
```

**Indépendant de :** `calendar_items`, planning généré, Google Calendar.

### Légende visible

Composant `CalendarDayStatusLegend` :

- Accueil (calendrier compact) — sous le mois
- Page Calendrier (full) — au-dessus de la légende événements

### Tests automatisés

| Fichier | Scénarios |
|---------|-----------|
| `resolveCalendarDayStatus.test.ts` | A–J priorités métier |
| `extractWorkDays.test.ts` | Exemple profil lun–ven / mer repos + vacances + sans planning |

### Fichiers modifiés (correctif ciblé)

```
src/lib/profile/extractWorkDays.ts
src/lib/profile/extractWorkDays.test.ts
src/lib/calendar/resolveCalendarDayStatus.ts
src/design-system/dayCellVisual.ts
src/components/calendar/MonthCalendar.tsx
src/components/calendar/CalendarDayStatusLegend.tsx
src/components/home/widgets/CompactCalendarWidget.tsx
src/styles/sprint41.css          ← couleurs cellules !important
src/pages/HomePage.tsx             ← extractWorkDaysFromFacts(profileFacts)
src/hooks/useCalendarViewData.ts
src/pages/CalendarPage.tsx
Docs/SPRINT_4_1_REPORT.md
```
