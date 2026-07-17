# Sprint 4.8 — Matin réaliste, exceptions de travail et statistiques personnelles

> **Date :** 17 juillet 2026  
> **Statut :** ✅ Livré — aucune migration Supabase requise  
> **Objectif :** matin distinct, pas de sport auto matin workday, temps libre simplifié, exceptions travail NLP, page Statistiques

---

## Contraintes respectées

| Contrainte | Statut |
|------------|--------|
| Aucun modèle IA externe | ✅ Moteurs déterministes uniquement |
| Pas de régression | ✅ 668 tests (+20 sprint 4.8) |
| Quality gate local | ✅ build, lint, test, verify:schema, verify:supabase |

---

## 1. Matin réaliste — petit déjeuner distinct

| Fichier | Rôle |
|---------|------|
| `src/lib/planning/buildMorningRoutineConstraints.ts` | Fonction pure centrale — blocs sans chevauchement |
| `src/ai/planningEngine.ts` | Utilise `buildMorningRoutineConstraints` |
| `src/pages/DailyRoutinePage.tsx` | Préparation personnelle + enfants séparées |
| `src/components/profile/MealSettingsSection.tsx` | Petit déjeuner : mode familial / adulte seul |
| `src/types/mealSettings.ts` | `BreakfastSettings.mode` |
| `src/types/planning.ts` | Nouveau type `personal_prep` |

**Ordre produit :** Réveil → Petit déjeuner → Préparation personnelle → Préparation des enfants → (Trajet / Travail)

**Alertes :** si le départ est impossible, message clair + suggestions — **aucun faux créneau libre** inventé.

---

## 2. Pas de sport automatique le matin d'un jour travaillé

| Fichier | Rôle |
|---------|------|
| `src/lib/planning/resolveMorningWorkoutAutomaticallyAllowed.ts` | Règle pure + `isMorningSlotBeforeWork` |
| `src/types/lifeContext.ts` | `morningWorkoutAutomaticallyAllowed` |
| `src/ai/lifeEngine.ts` | Calcul dans `resolveLifeContext` |
| `src/lib/planning/sportProposalAttachment.ts` | Bloque `proposedWorkoutSession` matin workday |
| `src/lib/planning/slotActivitySuggestionEngine.ts` | Exclut sport auto avant heure de travail |

**Règle :** workday → `morningWorkoutAutomaticallyAllowed = false`. Ajout manuel toujours possible après validation.

---

## 3. Blocs Temps libre simplifiés

| Fichier | Rôle |
|---------|------|
| `src/components/planning/DayTimeline.tsx` | `BlockActionsMenu` masqué sur `free_slot` |
| | Pas de `SportProposalCard` sur créneaux libres non acceptés |
| | Bouton unique : « Me proposer une activité » |

Les actions (Décaler, Terminer, etc.) restent sur les **activités persistées** uniquement.

---

## 4. Exceptions de travail par langage naturel

| Fichier | Rôle |
|---------|------|
| `src/ai/nlp/entityExtractor.ts` | `workExceptionKind` : cancel, half_morning, half_afternoon, overrides |
| `src/ai/nlp/actionResolver.ts` | Demi-journées, horaires exceptionnels |
| `src/ai/nlp/nlpClarification.ts` | « À quelle heure se termine ta matinée de travail ? » |
| `src/services/nlpActionService.ts` | Persistance via `family_context_periods` (existant) |

**Phrases supportées :**
- « Finalement demain je ne travaille pas » → repos ponctuel
- « Demain j'ai mon après-midi » → travail matin, fin 12:00 (ou clarification)
- « Demain j'ai ma matinée » → reprise 13:00
- « Je travaille seulement de 8 h à 12 h demain » → override horaires
- « Je commence à 13 h demain » / « Je termine exceptionnellement à midi »

Le rythme professionnel permanent n'est **jamais** modifié pour une phrase ponctuelle.

---

## 5. Page Statistiques

| Fichier | Rôle |
|---------|------|
| `src/pages/StatisticsPage.tsx` | Route `/statistics` — semaine / mois / année |
| `src/services/statisticsService.ts` | Chargement Supabase + agrégation |
| `src/lib/statistics/getStatisticsForPeriod.ts` | Couche centrale |
| `src/lib/statistics/aggregateWorkoutStatistics.ts` | Sport, course, yoga, mobilité… |
| `src/lib/statistics/aggregateStudyStatistics.ts` | Planifié vs effectué |
| `src/lib/statistics/aggregateCompletionStatistics.ts` | Accomplissements, ressenti, spiritualité, loisirs |
| `src/lib/time/periodBounds.ts` | Bornes semaine / mois / année |
| `src/components/navigation/AppDrawer.tsx` | Entrée menu « Statistiques » |

**Cartes :** Sport, Révision, Accomplissements, Ressenti, Spiritualité, Loisirs.

**Honnêteté :** « Pas encore assez de données », distance non inventée, pas de conclusion médicale.

---

## Tests automatisés (A–T)

Fichier : `src/lib/work/sprint48.test.ts` — 20 tests

---

## Quality gate (17 juillet 2026)

| Commande | Résultat |
|----------|----------|
| `npm run build` | ✅ |
| `npm run lint` | ✅ (warnings hooks préexistants) |
| `npm test` | ✅ 668 tests |
| `npm run verify:schema` | ✅ |
| `npm run verify:supabase` | ✅ |

---

## Tests manuels recommandés

1. Mon quotidien → vérifier ordre matin (réveil → petit déjeuner → préparation → enfants)
2. Jour travaillé → aucune proposition sportive automatique avant le travail
3. Bloc Temps libre → uniquement « Me proposer une activité »
4. Assistant : « Finalement demain je ne travaille pas » → planning repos
5. Assistant : « Demain j'ai mon après-midi » → demi-journée
6. Menu ☰ → Statistiques → semaine / mois / année

---

## Fichiers clés

```
src/lib/planning/buildMorningRoutineConstraints.ts
src/lib/planning/resolveMorningWorkoutAutomaticallyAllowed.ts
src/components/planning/DayTimeline.tsx
src/ai/nlp/entityExtractor.ts
src/ai/nlp/actionResolver.ts
src/lib/statistics/
src/services/statisticsService.ts
src/pages/StatisticsPage.tsx
src/lib/work/sprint48.test.ts
```
