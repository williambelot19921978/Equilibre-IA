# Moteur proactif v1 — Score Équilibre

Document de référence pour la première version du moteur d’IA proactive d’Équilibre IA.

## Rôle

Le moteur analyse une journée planifiée **sans appeler de modèle externe**. Il produit :

- un **Score Équilibre** (0–100) ;
- une **détection de surcharge** structurée ;
- une **détection de reports répétés** ;
- jusqu’à **3 insights** priorisés pour l’interface.

Le calcul est **déterministe**, **testable** et **explicable**.

## Architecture

```
src/lib/proactiveEngine/     ← fonctions pures (aucun Supabase)
src/services/proactiveAnalysisService.ts  ← agrégation données app
src/components/home/ProactiveBalanceCard.tsx  ← intégration Home
```

Le moteur existant `proactiveCoachEngine` (Sprint 5.x) reste en place ; ce module est complémentaire et orienté score + recommandations structurées.

## Données d’entrée (`DayAnalysisInput`)

| Champ | Description |
|-------|-------------|
| `date` | Date YYYY-MM-DD analysée |
| `scheduledItems` | Blocs planifiés (titre, horaires, catégorie, priorité, reports) |
| `sleep` | Heures de sommeil prévues ou réelles |
| `personalTimeMinutes`, `sportMinutes`, etc. | Agrégats par catégorie |
| `userPreferences` | Seuils personnalisés (charge, sommeil, temps perso, sport) |

La conversion depuis le planning se fait via `buildDayAnalysisInput()` dans le service d’agrégation.

## Score Équilibre

- **Base :** 100 points
- **Plage :** 0–100 (arrondi, clampé)
- **Niveaux :**
  - 80–100 : `balanced` — Journée équilibrée
  - 55–79 : `busy` — Journée chargée
  - 0–54 : `overloaded` — Journée surchargée

### Pénalités (exemples)

| Code | Impact typique |
|------|----------------|
| Surcharge planifiée (warning / critical) | −12 / −25 |
| Sommeil insuffisant | −18 |
| Absence de temps personnel | −10 |
| Trop de priorités hautes | −8 |
| Déplacements longs | −6 |
| Reports répétés | −5 |
| Fin de journée tardive | −10 |
| Activité tardive vs sommeil | −8 |

### Bonus (modérés)

| Code | Impact |
|------|--------|
| Temps personnel suffisant | +5 |
| Sport prévu | +5 |
| Charge compatible préférences | +5 |
| Pauses réalistes | +3 |

Chaque variation apparaît dans `factors[]` avec `code`, `label`, `impact`, `explanation`.

## Détection de surcharge

`detectOverload()` retourne des **raisons structurées** :

- durée planifiée excessive ;
- chevauchements ;
- absence de pauses ;
- plus de 3 tâches prioritaires ;
- journée se terminant tard ;
- activité tardive incompatible avec le sommeil.

## Reports répétés

Seuils (`postponementCount` / `skip_count`) :

| Reports | Sévérité |
|---------|----------|
| 0–1 | aucun insight |
| 2 | info |
| 3–4 | warning |
| ≥ 5 | critical |

Messages neutres, jamais culpabilisants.

## Priorité des insights

Ordre appliqué avant la limite de 3 :

1. Risque critique (surcharge, sommeil, reports)
2. Sommeil
3. Surcharge
4. Reports répétés
5. Équilibre personnel
6. Optimisation légère (sport, pauses)

Doublons filtrés par type + raison.

## Déterminisme et fuseaux horaires

- Durées : différence de timestamps ISO (indépendante du fuseau).
- Heures de fin de journée : lecture **UTC** (`getUTCHours`) pour cohérence avec Vitest (`TZ=UTC`).
- Les tests unitaires construisent des ISO explicites (`…T09:00:00.000Z`).

## Intégration UI

Carte **Score Équilibre / Conseil du jour** sur la Home :

- score + libellé de niveau ;
- insight principal + jusqu’à 2 secondaires ;
- états neutres si données insuffisantes ;
- suggestions **informatives uniquement** (aucune modification du planning).

## Limites v1

- Pas d’appel LLM.
- Préférences utilisateur partiellement mappées (sommeil via `profile_facts`).
- Reports basés sur `skip_count` des tâches liées aux `calendar_items`.
- Pas de plafond de fréquence proactive (prévu Sprint 4 / v2).
- Heures de journée en UTC dans le moteur (normalisation locale possible en v2).

## Intégration future IA conversationnelle

Le moteur expose un contrat stable (`DayAnalysisInput` → `ProactiveAnalysisResult`) utilisable comme **contexte structuré** pour un LLM :

- `balanceScore.factors` : chaîne de raisonnement ;
- `overload.reasons` : signaux actionnables ;
- `insights` : brouillons de messages déjà priorisés.

L’IA pourra reformuler sans recalculer les règles métier.

## Stratégie d’explicabilité

Chaque score et insight inclut un `reason` / `explanation` lisible. Aucune valeur aléatoire. Les seuils sont centralisés dans `constants.ts`.

## Pistes v2 (Sprint 3)

- Unifier ou orchestrer `proactiveCoachEngine` et `proactiveEngine` ;
- Préférences charge / temps perso dans `user_home_preferences` ;
- Normalisation fuseau utilisateur explicite ;
- Actions interactives (reporter, raccourcir) branchées sur le planning ;
- Historique multi-jours et tendances ;
- Contexte LLM via Edge Function avec garde-fous.
