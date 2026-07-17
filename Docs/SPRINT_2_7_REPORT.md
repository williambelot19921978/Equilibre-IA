# Sprint 2.7 — Stabilisation calendrier et menu latéral gauche

> **Date :** 15 juillet 2026  
> **Statut :** ✅ Code livré — tests navigateur manuels requis avant prod  
> **Objectif :** corriger boucles de rechargement, bonds de mise en page, flicker RDV, menu entièrement à gauche

---

## 1. Résumé

| Problème | Correction |
|----------|------------|
| Sections calendrier / périodes en boucle | Hook unifié `useCalendarViewData`, rupture dépendance `periods` → reload |
| Bonds verticaux | Sections stables + skeleton / badge « Mise à jour… » |
| RDV disparaît puis réapparaît | Upsert optimiste + `requestId` + pas de `setCalendarItems([])` au refresh |
| Bouton ☰ à droite, tiroir à gauche | `AppShell` + CSS drawer `left: 0`, animation depuis la gauche |

**170 tests** automatisés (build/lint/verify OK). Voir section 8 pour les tests navigateur.

---

## 2. Cause exacte de la boucle

### Chaîne principale (confirmée dans l’ancien `CalendarPage.tsx`)

```
reloadPeriods()
  → setPeriods(nouveau tableau)
  → reloadMonthOverview recréé (deps: [user, periods])
  → reloadDateData recréé (deps: [reloadMonthOverview])
  → useEffect principal relancé (deps: [user, reloadDateData, reloadPeriods])
  → reloadPeriods() à nouveau → boucle infinie
```

**Dépendance instable responsable :** le tableau `periods` dans les dépendances de `reloadMonthOverview`, combiné à des callbacks non mémorisés ou recréés à chaque cycle.

### Contributions secondaires

| Source | Effet |
|--------|-------|
| `MonthCalendar` — `useEffect` appelant `onVisibleMonthChange` | Rechargement mois à chaque changement de callback parent |
| Affichage `loading \|\| loadingCalendarItems` | Remplacement total du contenu → bonds |
| `setCalendarItems([])` en cas d’erreur / refresh | Flicker des rendez-vous |
| Requêtes concurrentes sans garde | Réponse ancienne écrase une réponse récente |

---

## 3. Stratégie de chargement adoptée

### Source de vérité date

- Type `LocalDateString` (`YYYY-MM-DD`) dans `src/lib/time/localDate.ts`
- URL via `useUrlDate` — garde `if (date === selectedDate) return` pour éviter réécritures inutiles
- Conversion `Date` uniquement dans helpers purs (`parseLocalDateParts`, affichage)

### Hook `useCalendarViewData`

Charge de façon coordonnée :

- bootstrap foyer + périodes actives/futures (`loadActiveAndFuturePeriods`)
- éléments du jour (`loadCalendarItemsForDate`)
- vue mensuelle (`loadMonthDisplayData`)

**Règles :**

- `periodsRef` + `periodsRevision` — les périodes ne sont **pas** dans les deps des callbacks de reload mois
- `isRefreshingDay` / `isRefreshingMonth` — skeleton uniquement si liste vide ; sinon badge discret
- Données précédentes conservées pendant refresh
- `shouldApplyRequest(requestId, latestRef)` — ignore les réponses obsolètes
- `cancelled` flag au démontage de chaque effet
- Un effet par dimension : `userId` (bootstrap), `selectedDate` (jour), `visibleYear/Month + periodsRevision` (mois)

### Ajout / modification RDV

1. INSERT/UPDATE Supabase → retour complet
2. `upsertCalendarItem(record)` — fusion par id immédiate
3. `refresh("month")` une seule fois — pas de double reload jour + mois concurrent

Helpers purs : `src/lib/calendar/calendarViewStability.ts`

---

## 4. Bonds de mise en page

**Cause :** remplacement brutal de sections entières par « Chargement… » à chaque micro-refresh.

**Correction :**

- `CalendarDayItemsSection` / `CalendarPeriodsSection` — classe `calendar-stable-section`, `min-height` CSS
- `CalendarSectionSkeleton` — hauteur proche du contenu
- Badge `Mise à jour…` au lieu de vider la liste
- Calendrier mensuel : overlay badge si `monthOverview` déjà peuplé

---

## 5. Menu entièrement à gauche

| Élément | Avant | Après |
|---------|-------|-------|
| Bouton ☰ | Après le titre (visuellement à droite) | Premier élément du header (`AppShell`) |
| Tiroir | `left: 0` mais bouton incohérent | Panel `left: 0`, `translateX(-100%)` → `0` |
| Bord arrondi | — | `border-radius: 0 16px 16px 0` |
| Actions header | — | `margin-left: auto` sur `.app-shell-actions` uniquement |

Fichiers : `AppShell.tsx`, `AppDrawer.tsx` (inchangé côté logique), `src/index.css`

---

## 6. États d’erreur indépendants

- `calendarItemsError`, `periodsError`, `monthError`, `householdError` séparés
- Erreur sur périodes n’efface pas `calendarItems`
- Erreur jour n’efface pas `monthOverview`
- `mergeCalendarItemsById` conserve l’existant si incoming vide

---

## 7. Tests automatisés (A–M)

Fichier : `src/lib/calendar/sprint27.test.ts`

| ID | Couverture |
|----|------------|
| A | Absence chaîne `reloadMonthOverview` / `reloadDateData` ; `periodsRef` |
| B | Clé chargement distincte par date |
| C | Clé chargement distincte par mois |
| D | Même date → même clé |
| E | Upsert RDV sans doublon |
| F | `shouldApplyRequest` ignore stale |
| G | Merge conserve données précédentes |
| H | Skeleton uniquement bootstrap + badge refresh |
| I | Erreurs indépendantes (merge) |
| J | Bouton menu avant titre dans AppShell |
| K | CSS drawer gauche |
| L | `resolveSelectedDate` conserve URL |
| M | Garde URL identique dans `useUrlDate` |

---

## 8. Tests navigateur (§10 spec)

**Non exécutés automatiquement par l’agent** — checklist manuelle requise :

1. Ouvrir `/calendar`, attendre 30 s — pas de clignotement
2. Ajouter RDV — reste visible
3. Modifier / supprimer RDV
4. Changer de mois et revenir
5. Ajouter période vacances
6. F5 — date et données stables
7. Menu ☰ — bouton et tiroir à gauche (mobile + desktop)

---

## 9. Quality gate

| Commande | Résultat |
|----------|----------|
| `npm run build` | ✅ |
| `npm run lint` | ✅ |
| `npm test` | ✅ |
| `npm run verify:schema` | ✅ |
| `npm run verify:supabase` | ✅ |
| `npm run preview` | ✅ |

---

## 10. Fichiers modifiés / créés

| Fichier | Action |
|---------|--------|
| `src/hooks/useCalendarViewData.ts` | Créé — chargement coordonné |
| `src/lib/calendar/calendarViewStability.ts` | Créé — helpers purs + tests |
| `src/lib/time/localDate.ts` | Créé — `LocalDateString` |
| `src/pages/CalendarPage.tsx` | Refactor — hook unifié, upsert optimiste |
| `src/pages/calendar/CalendarSections.tsx` | Créé — sections stables |
| `src/components/calendar/CalendarSectionSkeleton.tsx` | Créé |
| `src/components/calendar/MonthCalendar.tsx` | Mois contrôlé, sans useEffect spam |
| `src/hooks/useUrlDate.ts` | Garde anti-réécriture URL |
| `src/components/navigation/AppShell.tsx` | Bouton menu en premier |
| `src/index.css` | Drawer gauche, sections stables |
| `src/lib/calendar/sprint27.test.ts` | Tests A–M |

---

## 11. Limites restantes

- Tests navigateur §10 non automatisés (pas de Playwright dans le projet)
- `CalendarPeriodsSection` reçoit `isRefreshing={false}` — les périodes ne montrent pas le badge refresh (données déjà stables via bootstrap)
- StrictMode double-mount React 19 : effets idempotents via `requestId`, mais pas de test d’intégration render complet
- Google Calendar reste désactivé par feature flag (Sprint 2.6)

---

## 12. Références

- `docs/PROJECT_BIBLE.md` — section Calendrier mise à jour Sprint 2.7
- `docs/AI_RULEBOOK.md` — règles chargement calendrier
- `docs/ROADMAP.md` — Sprint 2.7 marqué livré
