# Sprint 4.8.1 — Statistiques visibles, édition fiable, demi-journées

**Date :** 17 juillet 2026  
**Type :** correctif ciblé (pas de nouvelle fonctionnalité hors périmètre)

## Résumé

| Bug | Cause | Correctif |
|-----|-------|-----------|
| Statistiques absentes du menu | `PRIMARY_NAV_ITEMS` sans entrée `/statistics` | Source unique `appNavigationItems.ts` — sidebar desktop + drawer mobile |
| Bouton « Modifier » inopérant | `HomePage` / widget timeline sans `onEditEntry` ni `EditBlockModal` | Wiring complet + `canModify` masque le bouton si inutile |
| « Je ne travaille pas demain matin » → repos journée | `detectWorkExceptionKind` matchait `cancel` avant `matin` | Demi-journées explicites, clarification sans heure inventée, badge calendrier |

## Quality gate

| Commande | Résultat |
|----------|----------|
| `npm test` | ✅ 686 tests |
| `npm run build` | ✅ |
| `npm run lint` | ✅ (warnings préexistants) |
| `npm run verify:schema` | ✅ |
| `npm run verify:supabase` | ✅ |

---

## BUG 1 — Navigation Statistiques

### Fichiers

| Fichier | Rôle |
|---------|------|
| `src/lib/navigation/appNavigationItems.ts` | Source de vérité : id, label, icon, route, section, desktop/mobile/drawer |
| `src/components/navigation/AppSidebar.tsx` | `getDesktopSidebarItems()` — Statistiques visible desktop |
| `src/components/navigation/AppDrawer.tsx` | `getDrawerSections()` — Statistiques section Organisation |
| `src/components/navigation/BottomNav.tsx` | `getMobileBottomNavItems()` — 6 entrées (Statistiques drawer uniquement) |
| `src/design-system/spaceThemes.ts` | `PRIMARY_NAV_ITEMS` délégué à `appNavigationItems` |

### Tests A–E

- Desktop sidebar contient Statistiques
- Drawer mobile section Organisation contient Statistiques
- Route `/statistics` protégée dans `AppRouter`
- F5 conserve la route (layout global inchangé)

---

## BUG 2 — Édition timeline

### Fichiers

| Fichier | Rôle |
|---------|------|
| `src/lib/planning/isTimelineEntryEditable.ts` | `canModifyTimelineEntry` — persistance + mode live/future |
| `src/components/planning/BlockActionsMenu.tsx` | Prop `canModify` — masque Modifier si false |
| `src/components/planning/DayTimeline.tsx` | Log dev `[EDIT BLOCK CLICK]`, passe `canModify` |
| `src/pages/HomePage.tsx` | `editingEntry`, `EditBlockModal`, `editTimelineBlock` |
| `src/pages/PlanningPage.tsx` | `onEditEntry` via `canModifyTimelineEntry` (plus seulement `canRegenerate`) |
| `src/components/home/widgets/TodayTimelineWidget.tsx` | `onEditEntry` propagé |

### Comportement après sauvegarde

Inchangé Sprint 4.6 : `applyTimelineEditAndReplan` — UPDATE `calendar_item`, absorption temps libre, replanification flexible, message `lastEditExplanation`.

---

## BUG 3 — Demi-journées travail

### NLP

| Fichier | Changement |
|---------|------------|
| `src/ai/nlp/entityExtractor.ts` | `half_morning` / `half_afternoon` détectés **avant** `cancel` ; `work_morning_only` / `work_afternoon_only` |
| `src/ai/nlp/actionResolver.ts` | Pas de 13 h / 12 h par défaut — actions vides si heure absente ; proposition `proposeHalfDayFreedActivity` dans l'explication |
| `src/ai/nlp/nlpClarification.ts` | « À quelle heure reprends-tu le travail demain ? » pour matin libre |

### Types & persistance

| Fichier | Changement |
|---------|------------|
| `src/lib/work/workExceptionTypes.ts` | `no_work_morning`, `no_work_afternoon`, `work_morning_only`, etc. |
| `src/types/familyContext.ts` | `workExceptionType`, `affectedPeriod`, `workExceptionSource` dans `impact` |
| `src/services/nlpActionService.ts` | `MarkWorkDay` avec `halfDay` → `exceptional_work_hours` + overrides ; `MarkRestDay` → `no_work_full_day` |

### Calendrier & Life Engine

| Fichier | Changement |
|---------|------------|
| `src/lib/work/resolveWorkStatusForDate.ts` | `partialWorkDay` sur statut travail ; repos contexte exclut demi-journées |
| `src/lib/calendar/resolveCalendarDayStatus.ts` | Jour travaillé + badge « Matin libre » / « Après-midi libre » |
| `src/lib/family/isSchoolDayForChildren.ts` | Détection jour d'école pure |
| `src/lib/life/proposeHalfDayFreedActivity.ts` | Une proposition principale selon école / week-end / fatigue |

### Phrase de référence

« Je ne travaille pas demain matin » :

- `workExceptionKind = half_morning` (pas `cancel`)
- Clarification si pas d'heure de reprise
- Avec « je reprends à 14 h » → `MarkWorkDay` `morning_off`, travail après-midi conservé
- Calendrier : fond travail + badge « Matin libre »

---

## Tests Sprint 4.8.1

`src/lib/work/sprint481.test.ts` — 18 scénarios (navigation, édition, NLP demi-journée, calendrier, propositions).

Mises à jour : `sprint40.test.ts` (7 entrées nav), `sprint48.test.ts` (clarification demi-journée, nav via `appNavigationItems`).

---

## Validation manuelle recommandée

1. Statistiques visible sidebar + drawer → `/statistics` → F5
2. Planning / Accueil → Modifier activité persistée → durée → replanification
3. Assistant : « Je ne travaille pas demain matin. » → clarification ou demi-journée
4. Week-end : proposition familiale sur demi-journée libre
