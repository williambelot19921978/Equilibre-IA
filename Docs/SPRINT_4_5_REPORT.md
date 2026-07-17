# Sprint 4.5 — Calendrier lisible, garde des enfants et espace Loisirs

> **Date :** 16 juillet 2026  
> **Statut :** ✅ Livré (migration `00014` à appliquer sur Supabase distant)  
> **Objectif :** retirer le calendrier du header, l'intégrer au drawer, prendre en compte le mode de garde en vacances, rendre les boutons timeline visibles, créer l'espace Loisirs

---

## Contraintes respectées

| Contrainte | Statut |
|------------|--------|
| Aucune régression | ✅ 511 tests (+14 sprint 4.5) |
| Pas d'IA externe payante | ✅ Moteurs déterministes |
| Spotify — ouverture manuelle uniquement | ✅ `window.open` explicite |
| Quality gate local | ✅ build, lint, tests |

---

## 1. Calendrier — drawer uniquement

### Changements

| Fichier | Rôle |
|---------|------|
| `src/pages/HomePage.tsx` | Suppression `HeaderCalendarWidget` du header |
| `src/components/navigation/DrawerCalendarSection.tsx` | Calendrier toujours visible dans le menu ☰ |
| `src/components/calendar/MonthCalendar.tsx` | Variant `drawer` — taille lisible, couleurs conservées |
| `src/types/homePreferences.ts` | Défaut `calendar_widget_position` = `drawer` (desktop + mobile) |

### Comportement

- Navigation mois précédent / suivant (boutons existants)
- Sélection de date → navigation vers l'accueil avec `?date=`
- Lien « Ouvrir le calendrier » → page Calendrier complète
- Plus de calendrier étiré dans le header

---

## 2. Vacances — mode de garde enfants

### Modes disponibles

| Mode | Impact planning |
|------|-----------------|
| Maison avec moi | `maxFillRatio` 35 %, micro-tâches uniquement |
| Maison avec conjoint | 50 %, tâches personnelles réduites |
| Grands-parents | ~78 % — journée quasi normale |
| Centre aéré | ~82 % — journée plus libre |
| Assistante maternelle | 65 % |
| Autre | 55 % |

### Fichiers

| Fichier | Rôle |
|---------|------|
| `src/types/childcare.ts` | Types + labels |
| `src/lib/family/childcareImpact.ts` | Impacts par mode |
| `src/ai/familyContextEngine.ts` | Fusion impact + `childcareMode` dans contexte résolu |
| `src/ai/lifeEngine.ts` | Raisonnement adapté |
| `src/components/family/ChildcareModeSelector.tsx` | UI sélection |
| `src/pages/FamilyContextPage.tsx` | Section vacances enfants |
| `src/components/family/VacationQuickForm.tsx` | Mode garde si vacances enfants |

Persistance : `family_context_periods.impact.childcareMode` (jsonb, pas de nouvelle table).

---

## 3. Boutons timeline visibles

| Fichier | Rôle |
|---------|------|
| `src/components/planning/BlockActionButton.tsx` | Bouton icône + label, contraste élevé |
| `src/components/planning/BlockActionsMenu.tsx` | Refactor complet — plus de texte nu cliquable |
| `src/styles/sprint45.css` | Styles hover, pressé, tactile mobile |

Actions : Décaler, Je n'ai pas le temps, Modifier, Terminer, Annuler (+ Voir la séance).

---

## 4. Espace Loisirs

### Navigation

Route `/leisure` — même niveau que Planning, Calendrier, Spirituel, Profil.

| Fichier | Rôle |
|---------|------|
| `src/pages/LeisureSpacePage.tsx` | Page principale |
| `src/data/leisureContentLibrary.ts` | Sport, musique, loisirs |
| `src/services/leisurePlanningService.ts` | Ajout au planning |
| `src/services/leisureFavoriteService.ts` | Favoris |

### Sections

**Sport** — mobilité, renforcement, marche, yoga, course → ajout planning + séance `WorkoutSession` si applicable.

**Musique** — playlists (calme, motivation, sport, concentration) + bouton « Ouvrir Spotify » (manuel).

**Loisirs** — lecture, jeux, promenade, cuisine, bricolage, photographie, dessin, cinéma… → favoris + planning.

---

## 5. Suggestions loisirs dans les temps libres

| Fichier | Rôle |
|---------|------|
| `src/ai/leisureSuggestionEngine.ts` | Propositions adaptées au créneau et au mode de garde |
| `src/ai/lifeEngine.ts` | Intégration dans `generateLifeProposals` |
| `src/lib/planning/lifeProposalAdapter.ts` | Mapping `leisure` → `add_leisure` |
| `src/services/suggestionAcceptanceService.ts` | Acceptation suggestion loisir |

Toujours : option « Garder ce temps libre » (`keep_free`).

Intro : *« Tu disposes de X libre. Je peux te proposer : »*

---

## Migration `00014`

```sql
-- Defaults calendrier drawer
ALTER calendar_widget_position SET DEFAULT 'drawer';

-- Table leisure_favorites (+ RLS)
```

---

## Tests automatisés

| Fichier | Cas |
|---------|-----|
| `src/lib/work/sprint45.test.ts` | 14 tests (A–N) |
| `src/lib/navigation/sprint40.test.ts` | Navigation 6 entrées |
| `src/lib/work/sprint44.test.ts` | Calendrier drawer (mis à jour) |

**Total : 511 tests** (37 fichiers).

---

## Quality gate

| Commande | Résultat |
|----------|----------|
| `npm run build` | ✅ |
| `npm run lint` | ✅ (warnings préexistants) |
| `npm test` | ✅ **511 tests** |
| `npm run verify:schema` | ⚠️ 15/16 — `leisure_favorites` absent (migration non appliquée) |
| `npm run verify:supabase` | ✅ |
| `npm run preview` | ⚠️ Non relancé |

---

## Critères d'acceptation

- [x] Calendrier plus dans le header
- [x] Calendrier intégré proprement au drawer
- [x] Vacances avec mode de garde → Life Engine adapté
- [x] Boutons timeline clairement visibles (`BlockActionButton`)
- [x] Espace Loisirs accessible dans la navigation principale
- [x] Loisirs proposables dans les temps libres + « Garder ce temps libre »
- [ ] Migration `00014` appliquée sur Supabase distant

---

## 6. Complément — propositions sportives automatiques ✅

> **Date complément :** 16 juillet 2026

Quand le Life Engine estime qu'une activité sportive est pertinente, le planning affiche immédiatement **« Activité sportive proposée »** avec une séance concrète déjà générée — plus de bouton générique « Me proposer une activité » sur ces créneaux.

### Moteur & types

| Fichier | Rôle |
|---------|------|
| `src/types/workoutSession.ts` | `WorkoutSession` enrichi (blocks, level, equipment, generationSeed…) |
| `src/types/sportPreferences.ts` | Préférences sport (niveau, types, matériel, durée…) |
| `src/data/workoutExerciseLibrary.ts` | Bibliothèque d'exercices originale avec variantes par niveau |
| `src/ai/workoutGenerationEngine.ts` | Génération déterministe 5–30 min, variabilité, garde-fous soir/fatigue |
| `src/lib/planning/sportProposalAttachment.ts` | Attachement automatique aux créneaux libres pertinents |

### UX timeline

| Fichier | Rôle |
|---------|------|
| `src/components/planning/SportProposalCard.tsx` | Aperçu + boutons Voir / Faire / Autre séance / Décaler / Pas le temps |
| `src/components/planning/DayTimeline.tsx` | Remplace le bouton générique quand `proposedWorkoutSession` |
| `src/hooks/useDayPlan.ts` | Overrides client, régénération sans doublon, acceptation |
| `src/services/sportProposalService.ts` | Persistance `calendar_items.details.workoutSession` |

### Profil → Sport

| Fichier | Rôle |
|---------|------|
| `src/components/profile/SportSettingsSection.tsx` | Niveau, types, matériel, durée, intensité, lieu |
| `supabase/migrations/00015_sport_settings.sql` | Colonne `sport_settings` jsonb |

### Tests complément (A–R)

| Fichier | Cas |
|---------|-----|
| `src/lib/work/sprint45-sport.test.ts` | 19 tests — proposition directe, niveaux, durées, soir, fatigue, variation, persistance |

---

## Migration `00015`

```sql
ALTER user_home_preferences ADD COLUMN sport_settings jsonb DEFAULT '{}';
```

---

## Critères d'acceptation complément

- [x] Planning propose directement une séance sportive complète
- [x] Séance respecte niveau et durée disponible
- [x] Bouton « Proposer une autre séance » avec variation
- [x] Pas de doublon `calendar_item` avant acceptation
- [x] Séance acceptée persistée et visible après F5
- [ ] Migration `00015` appliquée sur Supabase distant

1. Ouvrir le menu ☰ → mini-calendrier lisible, navigation mois, clic date
2. Accueil sans calendrier dans le header
3. Contexte familial → Vacances enfants → mode garde → vérifier adaptation planning
4. Timeline → boutons colorés visibles (desktop + mobile)
5. Menu → Loisirs → ajouter séance sport au planning
6. Temps libre → suggestions loisirs + garder libre
7. F5 → persistance
