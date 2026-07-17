# Sprint 5.0 — Coach personnel explicable

**Date :** 17 juillet 2026  
**Type :** fondation coach (pas de multiplication de features)

## Objectif

Transformer Équilibre IA en **coach personnel** : chaque proposition passe par un raisonnement explicite, avec score de confiance, habitudes apprises et feedback utilisateur.

Pipeline cible :

```
Contexte → Analyse → Priorités → Habitudes → Fatigue → Historique → Objectifs → Décision → Explication
```

## Quality gate

| Commande | Résultat |
|----------|----------|
| `npm test` | ✅ 732 tests |
| `npm run build` | ✅ |
| `npm run lint` | ✅ |
| `npm run verify:schema` | ✅ |
| `npm run verify:supabase` | ✅ |

---

## 1 — Life Reasoner

### Fichier central

`src/ai/reasoning/lifeReasoner.ts`

Entrées : `LifeContext`, proposition, créneau, habitudes, statistiques, tâches, alternatives.

Sortie : `LifeDecision` — `reason`, `priority`, `confidence` (0–100), `factors`, `alternatives`, `explanation` (why / whyNow / whyNotOther / fullText).

### Intégration

- `slotActivitySuggestionEngine.ts` — chaque candidat passe par `reasonAboutProposals()` avant affichage
- `lifeProposalAdapter.ts` — propage `confidence`, `confidenceFactors`, `explanation` vers `FreeTimeSuggestion`
- `FreeTimeSuggestionModal.tsx` — affiche confiance + facteurs (✔/✖)

Principe : **proposer, jamais imposer** — chaque explication se termine par « Tu restes libre d'accepter, modifier ou refuser. »

---

## 2 — HabitProfile

### Fichiers

| Fichier | Rôle |
|---------|------|
| `src/types/habitProfile.ts` | `HabitInsight`, `HabitProfile` |
| `src/ai/habits/buildHabitProfile.ts` | Apprentissage depuis `calendar_items` + `task_activity_events` |
| `src/services/habitProfileService.ts` | Chargement + corrections via `profile_facts` |

Apprentissages : heures sport/révision, durée typique, calme après travail, faible activité le soir, rythme naturel.

---

## 3 — Page Mon IA (`/my-ai`)

- Menu **Mon IA** (sidebar desktop + drawer)
- Affiche « Ce que j'ai appris sur toi »
- Par insight : confiance, dernière mise à jour, boutons **Exact** / **Faux**
- Corrections persistées dans `profile_facts` (`habit_correction_*`)

---

## 4 — Bilan hebdomadaire

`src/ai/reasoning/weeklyReviewEngine.ts`

- Génère : objectifs atteints/manqués, fatigue, progression, équilibre
- **3 réussites**, **3 conseils**, **1 priorité**
- Ton encourageant, jamais culpabilisant
- Déclenché le dimanche via `ProactiveCoachBanner`

---

## 5 — Statistiques enrichies

- `computeBalanceAndTrends.ts` — `BalanceScore` (9 piliers 0–100) + tendances
- `StatisticsPage` — tableau de bord équilibre + métriques (régularité, reports, annulations, accomplissements…)
- `statisticsService` retourne `EnrichedPeriodStatistics`

---

## 6 — IA proactive

`src/ai/coach/proactiveCoachEngine.ts` + `ProactiveCoachBanner` sur l'accueil

- **Matin** : « Bonjour William. Aujourd'hui je pense que… »
- **Soir** : « Bonsoir… Bravo / Demain je te conseille… »
- **Dimanche** : bilan hebdomadaire condensé

---

## Tests Sprint 5.0

`src/ai/reasoning/sprint50.test.ts` — 14 scénarios (A–N).

Mise à jour : `sprint40.test.ts` (8 entrées nav avec Mon IA).

---

## Validation manuelle recommandée

1. Temps libre → modal : confiance % + facteurs visibles
2. `/my-ai` → insights + Exact/Faux
3. `/statistics` → score équilibre + tendances
4. Accueil matin/soir → bannière coach proactive
5. Vérifier qu'aucune régression planning / NLP / annulation
