# Sprint 2.4 — Rapport « Navigation mobile, temps réel, profil et calendrier visuel »

> **Date :** 14 juillet 2026  
> **Statut :** ✅ Code livré — ⚠️ tests navigateur manuels non exécutés par l’agent  
> **Objectif :** ergonomie mobile, calendrier visuel, heure locale, historique et profil complet

---

## 1. Résumé produit

| Capacité | Livraison |
|----------|-----------|
| Calendrier compact (~50 % plus petit) | ✅ `MonthCalendar variant="compact"` |
| Calendrier mensuel full avec événements | ✅ `variant="full"` + `calendarMonthOverview` |
| Heure locale appareil | ✅ `deviceClock.ts` |
| Repère « Maintenant » + refresh 60 s | ✅ `DayNowStatus`, `useNowClock`, marqueur timeline |
| Blocs passés repliés (aujourd’hui) | ✅ `DayTimeline` mode live |
| Historique sans recalcul | ✅ `displayMode: historical` |
| Menu latéral ☰ | ✅ `AppDrawer` + `AppShell` |
| Page Mon profil `/profile` | ✅ sections repliables + édition |
| Code couleur centralisé | ✅ `calendarColors.ts` |
| Vacances visibles sur le mois | ✅ bande verte + libellé |
| Navigation jour préc/suiv/aujourd’hui | ✅ `DayNavigationBar` |
| URL date synchronisée | ✅ conservé Sprint 2.3 |

---

## 2. Calendrier compact et full

### Variantes

```tsx
<MonthCalendar variant="compact" />  // HomePage, PlanningPage
<MonthCalendar variant="full" monthOverview={...} />  // CalendarPage
```

- **Compact :** max-width 360px, cellules 34px, points colorés
- **Full :** cellules hautes, libellés courts (`10:00 Médecin`), overflow `+2`, vacances en fond vert

### Service mensuel

| Fichier | Rôle |
|---------|------|
| `calendarMonthOverview.ts` | Construction pure de l’aperçu mensuel |
| `calendarMonthDataService.ts` | Chargement Supabase + overview |

---

## 3. Heure locale

**Fichier :** `src/lib/time/deviceClock.ts`

- `getDeviceTimeZone()` via `Intl.DateTimeFormat().resolvedOptions().timeZone`
- `getCurrentDeviceDate()` — date locale (plus UTC pour « aujourd’hui »)
- `formatDeviceTime()` — affichage ISO en fuseau local
- `urlDate.getTodayDateString()` délègue à `deviceClock`

---

## 4. Temps réel dans la journée

- `useNowClock()` — tick toutes les 60 secondes
- `DayNowStatus` — activité en cours + prochaine + minutes restantes
- `DayTimeline` — marqueur « Maintenant », section « Déjà passé » repliée
- `computeDayNowState()` — logique testable

---

## 5. Modes d’affichage

**Fichier :** `dayDisplayMode.ts`

| Mode | Règle | Comportement |
|------|-------|--------------|
| `live` | date = aujourd’hui | replanification OK, passé replié |
| `historical` | date passée | archive `calendar_items` uniquement |
| `future` | date future | prévisualisation + génération |

`buildHistoricalDayView` — aucun appel à `generateDayPlan` pour le passé.

---

## 6. Menu latéral

**Composants :** `AppDrawer.tsx`, `AppShell.tsx`

- Ouverture ☰ Menu, fermeture backdrop / Échap
- Sections Principal, Organisation, Personnalisation, Compte
- Route active mise en évidence
- Accès rapides HomePage supprimés (remplacés par le drawer)

---

## 7. Page Mon profil

**Route :** `/profile` (`AppRoutes.USER_PROFILE`)

- Sections : Identité, Travail, Sommeil, Études, Sport, Repos, Spiritualité, Priorités
- Édition par section (pas de formulaire unique)
- Service unifié : `profileManagementService.ts`
- Mêmes clés `profile_facts` que la découverte

---

## 8. Code couleur

**Fichier :** `src/config/calendarColors.ts`

12 catégories : travail, RDV, enfants, vacances, sport, études, repos, spiritualité, famille, déplacement, personnel, temps libre.

Utilisé dans : vue mensuelle, timeline, légende (`CalendarLegend`).

---

## 9. Tests automatisés

**131/131 tests passent**

| ID | Scénario | Fichier |
|----|----------|---------|
| A | Calendrier compact | `sprint24.test.ts` |
| B | Heure locale | `sprint24.test.ts` |
| C–E | Maintenant / activités | `sprint24.test.ts` |
| F–I | Modes live/historical/future | `sprint24.test.ts` |
| L | Sections profil | `sprint24.test.ts` |
| N–P | Couleurs travail/vacances/RDV | `sprint24.test.ts` |
| Q–R | Vacances + RDV dans le mois | `sprint24.test.ts` |
| S–U | Navigation jours + URL | `sprint24.test.ts` |

### Qualité

| Commande | Résultat |
|----------|----------|
| `npm run build` | ✅ |
| `npm run lint` | ✅ |
| `npm test` | ✅ 131/131 |
| `npm run verify:schema` | ✅ |
| `npm run verify:supabase` | ✅ |

---

## 10. Tests manuels

**Non exécutés par l’agent** — scénario §17 du cahier des charges documenté pour validation navigateur.

---

## 11. Limites restantes

| Limite | Détail |
|--------|--------|
| OAuth Spotify / push / couple | Hors périmètre |
| Photo profil | Prévu plus tard |
| Panneau latéral desktop CalendarPage | Liste sous le mois pour l’instant |
| Tests drawer J/K | Logique UI, pas E2E React Testing Library |

---

## 12. Critères de fin

| Critère | Statut |
|---------|--------|
| Calendrier compact ~2× plus petit | ✅ |
| Heure locale appareil | ✅ |
| Repère Maintenant | ✅ |
| Passé replié sans suppression | ✅ |
| Historique consultable | ✅ |
| Menu latéral | ✅ |
| Mon profil modifiable | ✅ |
| Vue mensuelle colorée | ✅ |
