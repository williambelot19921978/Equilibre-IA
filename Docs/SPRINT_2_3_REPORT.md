# Sprint 2.3 — Rapport « Journées navigables, vacances et suggestions de temps libre »

> **Date :** 13 juillet 2026  
> **Statut :** ✅ Code livré — ⚠️ tests navigateur manuels non exécutés par l’agent  
> **Objectif :** rendre l’application plus naturelle au quotidien — navigation par date, vacances visibles, temps libre actionnable

---

## 1. Résumé produit

| Capacité | Livraison |
|----------|-----------|
| Mini-calendrier mensuel réutilisable | ✅ `MonthCalendar` sur Accueil, Planning, Calendrier |
| Date sélectionnée via URL (`?date=YYYY-MM-DD`) | ✅ persistance après F5 |
| Temps disponible après coucher enfants | ✅ `computeEveningAvailableSlot` |
| Bouton « Me proposer une activité » sur chaque temps libre | ✅ `DayTimeline` + modal |
| Moteur de suggestions déterministe | ✅ `freeTimeSuggestionEngine.ts` |
| Sport généré (15 min structuré) | ✅ `sportSessionGenerator.ts` + persistance |
| Révision courte (soir limité) | ✅ règles moteur |
| Temps calme + Spotify volontaire | ✅ bouton « Ouvrir Spotify », pas d’auto-launch |
| Espace spirituel facultatif | ✅ `SpiritualSpaceSection` selon `faith_importance` |
| Vacances évidentes | ✅ `VacationQuickForm` sur Accueil + Calendrier |
| Adaptations vacances (travail / école) | ✅ via `family_context_periods` existant |

**Hors périmètre respecté :** chat IA payant, notifications push, mode couple complet.

---

## 2. Navigation par date

### Helper partagé

| Fichier | Rôle |
|---------|------|
| `src/lib/navigation/urlDate.ts` | Validation `YYYY-MM-DD`, libellés, bornes mois |
| `src/hooks/useUrlDate.ts` | Sync `?date=` avec React Router |

### URLs

| Page | Exemple |
|------|---------|
| Accueil | `/home?date=2026-07-20` |
| Planning | `/planning?date=2026-07-20` |
| Calendrier | `/calendar?date=2026-07-20` |

Si la date est aujourd’hui, le paramètre est retiré de l’URL (URL plus propre).

### Composant `MonthCalendar`

- Mois courant, flèches précédent / suivant
- Sélection date, surbrillance aujourd’hui + date active
- Points discrets sur jours avec événements / contraintes (`calendarMarkersService`)
- Mobile-first, navigation clavier (`aria-pressed`, `role="grid"`)

**Correctif fuseau :** `datesInMonth` utilise désormais la date locale (plus `toISOString` UTC).

---

## 3. Temps disponible du soir

Après la routine soir (fin coucher enfants) jusqu’au coucher adulte **moins 30 min** de marge :

```
20:30–21:30
Temps disponible — 1 h
[ Me proposer une activité ]
```

- `freeSlotKind: "evening_available"` pour adapter les suggestions
- Aucun remplissage automatique du créneau

---

## 4. Moteur de suggestions

**Fichier :** `src/ai/freeTimeSuggestionEngine.ts`

### Entrées

Créneau libre, date, `PlanningContext`, tâches, préférences foi/repos/sport, contexte vacances.

### Sorties

`FreeTimeSuggestion[]` — max **5**, toujours **« Garder ce temps libre »**.

### Règles implémentées

| Règle | Comportement |
|-------|--------------|
| Étude après 21 h | Micro-session ≤ 20 min |
| Sport intense tard | Bloqué (`isIntenseSportBlocked`) |
| Spiritualité `disabled` | Aucune proposition |
| Spiritualité `important` / `discreet` / `when_needed` | Fréquence adaptée |
| Vacances | Intro dédiée, remplissage ≤ 60 % du créneau |
| Parent indisponible | Pas de sortie famille |
| Chaque suggestion | `reason` explicite |

### Modal `FreeTimeSuggestionModal`

Catégories : Sport, Révision, Temps calme, Famille, Spiritualité, Tâche personnelle, Ne rien prévoir.

- **Sport :** durée (5–20 min ou perso), type, intensité → séance structurée
- **Temps calme :** préférence stockée + lien Spotify explicite
- **Spiritualité :** bibliothèque locale (`spiritualContentLibrary.ts`) avec références exactes

---

## 5. Persistance des suggestions acceptées

**Service :** `src/services/suggestionAcceptanceService.ts`

1. INSERT `calendar_item` `source=user`, `locked=true`
2. `details` : `suggestionType`, `generatedContent`, `sourceReason`, `originalFreeSlot`
3. `deleteAutoProposalsForDate` + replanification
4. **« Ne rien prévoir »** → aucun INSERT (retour immédiat)

---

## 6. Vacances

**Formulaire :** `VacationQuickForm` — moi / enfants / famille, dates, description, rythme.

Types `family_context_periods` :

| Choix UI | `context_type` |
|----------|----------------|
| Moi | `user_vacation` |
| Les enfants | `children_vacation` |
| Toute la famille | `user_vacation` + `children_vacation` |

Effets moteur (déjà en place Sprint 1.9+) :

- Vacances utilisateur → travail / trajets supprimés
- Vacances enfants → départ école supprimé
- Temps libres conservés, suggestions facultatives uniquement

---

## 7. Accueil réorganisé

Ordre `HomePage` :

1. Mini-calendrier  
2. Date sélectionnée + timeline  
3. Prochaine activité  
4. Actions rapides  
5. Contexte vacances / familial  
6. Espace spirituel (si activé)  
7. Analyses repliées  

---

## 8. Fichiers principaux créés / modifiés

| Fichier | Action |
|---------|--------|
| `src/components/calendar/MonthCalendar.tsx` | Créé |
| `src/lib/navigation/urlDate.ts` | Créé |
| `src/hooks/useUrlDate.ts` | Créé |
| `src/ai/freeTimeSuggestionEngine.ts` | Créé |
| `src/ai/sportSessionGenerator.ts` | Créé |
| `src/data/spiritualContentLibrary.ts` | Créé |
| `src/types/freeTimeSuggestion.ts` | Créé |
| `src/services/suggestionAcceptanceService.ts` | Créé |
| `src/services/calendarMarkersService.ts` | Créé |
| `src/components/planning/FreeTimeSuggestionModal.tsx` | Créé |
| `src/components/family/VacationQuickForm.tsx` | Créé |
| `src/components/spiritual/SpiritualSpaceSection.tsx` | Créé |
| `src/lib/planning/freeSlotEntries.ts` | Soir + `evening_available` |
| `src/pages/HomePage.tsx` | Réorganisé |
| `src/pages/PlanningPage.tsx` | Calendrier + suggestions |
| `src/pages/CalendarPage.tsx` | Calendrier + vacances |
| `src/hooks/useDayPlan.ts` | Date URL |
| `src/index.css` | Styles calendrier, suggestions, spiritualité |

---

## 9. Tests automatisés

**122/122 tests passent** (`npm test`)

| ID | Scénario | Fichier |
|----|----------|---------|
| A | Temps libre soir visible | `sprint23.test.ts` |
| B | Aucun créneau après buffer coucher adulte | `sprint23.test.ts` |
| C | Sport 15 min généré | `sprint23.test.ts` |
| D | Étude courte tard le soir | `sprint23.test.ts` |
| E | Temps calme + lien Spotify volontaire | `sprint23.test.ts` |
| F | Spiritualité disabled | `sprint23.test.ts` |
| G | Spiritualité important | `sprint23.test.ts` |
| H | Vacances utilisateur supprime travail | `sprint23.test.ts` |
| I | Vacances enfants supprime école | `sprint23.test.ts` |
| J | Vacances conserve temps libre (cap 60 %) | `sprint23.test.ts` |
| K | Navigation mois (datesInMonth) | `sprint23.test.ts` |
| L/M | Validation / résolution date URL | `sprint23.test.ts` |
| N/O | Garder temps libre → pas d’insert | `sprint23.test.ts` |
| P | Vacances sans surcharge | `sprint23.test.ts` |
| Q | RDV chevauche date sélectionnée | `sprint23.test.ts` |

### Qualité

| Commande | Résultat |
|----------|----------|
| `npm run build` | ✅ |
| `npm run lint` | ✅ |
| `npm run verify:schema` | ✅ |
| `npm run verify:supabase` | ✅ |

---

## 10. Tests manuels navigateur

**Non exécutés par l’agent.**

Scénario recommandé (cf. cahier des charges §15) :

1. Ajouter vacances lundi–vendredi  
2. Vérifier disparition du travail  
3. Sélectionner mercredi dans le mini-calendrier  
4. Vérifier timeline mercredi  
5. Cliquer temps libre → sport 15 min → enregistrer  
6. Vérifier replanification  
7. Temps calme → bouton Spotify  
8. Espace spirituel si activé  
9. F5 → date + activités persistées  

---

## 11. Limites restantes

| Limite | Détail |
|--------|--------|
| OAuth Spotify | Lien volontaire uniquement — pas d’intégration OAuth |
| Persistance suggestion (test N) | Logique INSERT non testée E2E (dépend Supabase) |
| Création rapide tâche d’étude | Proposée dans spec ; flux minimal si aucune tâche |
| Tests navigateur | Non exécutés par l’agent |

---

## 12. Critères de fin de sprint

| Critère | Statut |
|---------|--------|
| Navigation jour par jour via mini-calendrier | ✅ |
| Vacances faciles à ajouter | ✅ |
| Travail disparaît pendant vacances utilisateur | ✅ |
| Chaque temps libre → suggestions | ✅ |
| Sport, révision, repos, famille, spiritualité cohérents | ✅ |
| Toujours « Ne rien prévoir » | ✅ |
| Rapport + docs mis à jour | ✅ |
