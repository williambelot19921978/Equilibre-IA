# Sprint 2.5 — Calendrier mensuel lisible, travail visible et Google Calendar

> **Date :** 14 juillet 2026  
> **Statut :** ✅ Code livré — ⚠️ migration `00008` à appliquer sur Supabase distant — ⚠️ tests OAuth manuels requis  
> **Objectif :** calendrier mensuel lisible, blocs travail explicites, intégration Google Calendar lecture seule

---

## 1. Résumé produit

| Capacité | Livraison |
|----------|-----------|
| Vue mensuelle par semaines + bandes multi-jours | ✅ `monthEventLayout.ts` + `MonthEventBar.tsx` |
| Fusion vacances / calendar_items / Google | ✅ `buildMonthDisplayEvents.ts` |
| Filtres calendrier + légende étendue | ✅ `CalendarFilters`, `birthday` + `google` dans `calendarColors` |
| Accueil desktop 2 colonnes | ✅ `home-desktop-grid` |
| Carte motivation / spiritualité | ✅ `MotivationCard` + `motivationLibrary.ts` |
| « À venir ce mois-ci » (3 max) | ✅ `MonthUpcomingSummary` |
| Travail + 2 trajets toujours visibles | ✅ titres exacts dans `planningEngine.ts` |
| OAuth Google Calendar (lecture seule) | ✅ Edge Functions + migration `00008` |
| Import sans doublon | ✅ upsert `external_event_id` |
| Événements Google verrouillés dans le planning | ✅ `externalEventsToPlanningItems.ts` |
| Section « Calendriers connectés » | ✅ `/profile` |

---

## 2. Calendrier mensuel

### Moteur de layout

| Fichier | Rôle |
|---------|------|
| `monthEventLayout.ts` | Découpe par semaine, lanes, overflow `+N` |
| `MonthEventBar.tsx` | Bande CSS grid avec coins arrondis début/fin |
| `buildMonthDisplayEvents.ts` | Fusion sources + filtres |
| `calendarMonthDisplayService.ts` | Chargement Supabase + overview |

### Comportement

- Vacances → bande verte continue sur plusieurs jours
- RDV horaire → puce dans la cellule
- Anniversaire → puce rose + icône 🎂 (compact)
- Événements Google → couleur `google` ou type détecté

---

## 3. Accueil desktop

```
┌─────────────────────┬─────────────────────┐
│ Mini-calendrier     │ MotivationCard      │
│ À venir ce mois-ci  │ Prochaine activité  │
└─────────────────────┴─────────────────────┘
│ Journée (timeline) — pleine largeur       │
└───────────────────────────────────────────┘
```

Mobile : empilement vertical (pas de colonnes forcées).

---

## 4. Travail et trajets

Titres **exactes** dans la timeline :

1. `Trajet aller travail`
2. `Travail`
3. `Trajet retour travail`

Règles : horaires profil, `commuteMinutes` défaut 30 min, masqués si vacances utilisateur ou jour non travaillé.

Test non-régression : `sprint25.test.ts` cas **G** et **H**.

---

## 5. Google Calendar

### Tables (migration `00008_google_calendar.sql`)

- `google_calendar_connections`
- `google_calendars`
- `external_calendar_events`

### Edge Functions

| Function | Rôle |
|----------|------|
| `google-calendar-auth` | URL OAuth |
| `google-calendar-callback` | Échange code + chiffrement refresh token |
| `google-calendar-sync` | Import événements |
| `google-calendar-disconnect` | Révocation locale |

Configuration pas à pas : **`Docs/GOOGLE_CALENDAR_SETUP.md`**.

---

## 6. Tests

**153 tests** (22 nouveaux dans `sprint25.test.ts`, cas A–V).

| Gate | Résultat |
|------|----------|
| `npm run build` | ✅ |
| `npm run lint` | ✅ |
| `npm test` | ✅ 153/153 |
| `npm run verify:supabase` | ✅ |
| `npm run verify:schema` | ⚠️ tables Google absentes tant que `00008` non appliquée |

---

## 7. Tests manuels recommandés

1. Accueil desktop → calendrier à gauche, motivation à droite  
2. Mobile → empilement vertical  
3. Vacances multi-jours → bande continue  
4. RDV → libellé dans le mois  
5. Timeline → 3 blocs travail distincts  
6. `/profile` → Connecter Google Calendar  
7. Sync → événements visibles sans doublon après F5  

---

## 8. Hors périmètre (respecté)

- Chat IA payant  
- Notifications push  
- Mode couple complet  
- Écriture vers Google Calendar  

---

## 9. Prochaines étapes

- Appliquer migration `00008` sur Supabase production  
- Déployer les 4 Edge Functions + secrets  
- Configurer Google Cloud OAuth (voir setup doc)  
- Webhook push Google (architecture prévue, non implémentée)
