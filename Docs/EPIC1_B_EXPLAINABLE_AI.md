# EPIC1-B — IA explicable

> **Date :** 19 juillet 2026  
> **Statut :** ✅ Terminé — en attente validation humaine  
> **Prérequis :** Daily Brief (EPIC1-A) validé

---

## 1. Objectif

Permettre à l'utilisateur de comprendre **pourquoi** une recommandation du Daily Brief lui est proposée, sans modifier les moteurs ni ajouter de décision supplémentaire.

---

## 2. Parcours utilisateur

```
Daily Brief — carte recommandation
    │
    ▼ (flag VITE_EXPLAINABLE_AI=true)
Bouton « Pourquoi ? »
    │
    ▼
Panneau simple (max 4 raisons)
    ✓ Tu disposes d'un créneau libre.
    ✓ La durée disponible convient à cette activité.
    ✓ Aucun autre engagement n'entre en conflit.
    ✓ Cette tâche est actuellement prioritaire.
    │
    ▼
[Masquer] — fermeture du panneau
```

**Interdit à l'écran :** score, poids, probabilité, JSON, identifiants, chaîne de décision interne.

---

## 3. Architecture

```
buildDailyBriefRecommendations (orchestrateur existant)
    └── explainabilityReasonCodes[]  ← moteurs existants
            ├── DecisionEngine (decisionApproved → NO_CONFLICT)
            ├── Availability (FREE_SLOT, DURATION_COMPATIBLE)
            ├── RecommendationEngine (priority → HIGH_PRIORITY)
            └── ReasoningEngine (DecisionFactor.id → codes sémantiques)

presentDailyBrief (couche présentation)
    └── translateExplainabilityReasons (FR, max 4)

useDailyBrief
    └── presentedBrief (textes prêts pour l'UI)

DailyBriefCard + RecommendationWhyPanel (affichage seul)
```

**Principe ADR-0006 :** le ReasoningEngine reste propriétaire des raisons ; l'UI ne traduit ni n'invente — elle affiche des lignes déjà préparées par `presentDailyBrief`.

---

## 4. Couche de traduction

| Code sémantique | Texte affiché |
|-----------------|---------------|
| `FREE_SLOT` | Tu disposes d'un créneau libre. |
| `DURATION_COMPATIBLE` | La durée disponible convient à cette activité. |
| `NO_CONFLICT` | Aucun autre engagement n'entre en conflit. |
| `HIGH_PRIORITY` | Cette tâche est actuellement prioritaire. |
| `SPORT_ALREADY_PLANNED` | Ta séance est déjà inscrite au planning. |
| `SPORT_ALREADY_DONE` | Tu as déjà bougé aujourd'hui. |
| `NO_CHANGE_NEEDED` | Aucun changement n'est nécessaire. |
| `AFTERNOON_DENSE` | Ton après-midi compte plusieurs engagements. |
| `AVOID_HEAVY_TASKS` | Mieux vaut éviter d'ajouter de nouvelles tâches importantes. |

**Mapping ReasoningEngine → codes :**

| `DecisionFactor.id` | Code |
|---------------------|------|
| `slot-fit` | `SLOT_FITS_ACTIVITY` |
| `study-goal` | `STUDY_GOAL_PENDING` |
| `calm-slot` | `CALM_MOMENT` |
| `energy-ok` | `SUFFICIENT_ENERGY` |

---

## 5. Feature flag

| Variable | Défaut | Effet |
|----------|--------|-------|
| `VITE_EXPLAINABLE_AI` | `false` | OFF → pas de bouton « Pourquoi ? » |
| `VITE_DAILY_BRIEF` | requis | Brief doit être actif pour voir les cartes |

Helper : `isExplainableAiEnabled()`.

---

## 6. Fichiers créés

| Fichier | Rôle |
|---------|------|
| `src/lib/explainability/explainabilityReasonCodes.ts` | Codes sémantiques + priorité |
| `src/lib/explainability/translateExplainabilityReasons.ts` | Traduction FR + filtre technique |
| `src/lib/explainability/buildExplainabilityReasonCodes.ts` | Construction depuis moteurs |
| `src/lib/explainability/presentExplainabilityReasons.ts` | Présentation lignes UI |
| `src/lib/explainability/presentDailyBrief.ts` | Brief enrichi pour l'UI |
| `src/lib/explainability/explainability.test.ts` | 14 tests |
| `src/components/explainability/RecommendationWhyPanel.tsx` | Panneau ✓ raisons |

---

## 7. Fichiers modifiés

| Fichier | Modification |
|---------|--------------|
| `src/lib/dailyBrief/buildDailyBriefRecommendations.ts` | `explainabilityReasonCodes` par carte |
| `src/components/dailyBrief/DailyBriefCard.tsx` | Bouton « Pourquoi ? » + panneau |
| `src/components/dailyBrief/DailyBriefContent.tsx` | Reçoit `presentedRecommendations` |
| `src/components/dailyBrief/DailyBriefModal.tsx` | Idem |
| `src/components/dailyBrief/DailyBriefSection.tsx` | Idem |
| `src/hooks/useDailyBrief.ts` | `presentedBrief` via `presentDailyBrief` |
| `src/pages/HomePage.tsx` | Passe `presentedBrief` |
| `src/config/featureFlags.ts` | `isExplainableAiEnabled()` |
| `.env.example` | `VITE_EXPLAINABLE_AI=false` |
| `src/styles/sprint50.css` | Styles panneau explicabilité |
| `package.json` | `verify:explainable` |

**Non modifiés :** moteurs core, contrats, ReasoningEngine, DecisionEngine.

---

## 8. Tests

| Suite | Tests | Couverture |
|-------|:-----:|------------|
| `explainability.test.ts` | 14 | Traduction, max 4, absence raisons, flag, UI sans logique métier, non-régression Daily Brief |

Scénarios :
- Affichage des raisons traduites
- Absence de raisons → pas de bouton
- Traduction FREE_SLOT, NO_CONFLICT, HIGH_PRIORITY
- Aucun texte technique
- Composants React sans traduction ni moteurs
- Codes attachés aux recommandations Daily Brief
- Flag OFF par défaut

Commande : `npm run verify:explainable`

---

## 9. Validation manuelle suggérée

**Prérequis :** `VITE_DAILY_BRIEF=true` + `VITE_EXPLAINABLE_AI=true`, planning avec créneau libre études.

1. Ouvrir l'Accueil → Daily Brief avec carte Études
2. Cliquer « Pourquoi ? » → panneau avec 2–4 raisons en français
3. Vérifier absence de chiffres de score / JSON
4. Désactiver `VITE_EXPLAINABLE_AI` → bouton absent, brief inchangé

---

## 10. Résultats des commandes

| Commande | Résultat |
|----------|:--------:|
| `npm run build` | ✅ |
| `npm run lint` | ✅ (warnings préexistants) |
| `npm test` | ✅ **991** tests (+14) |
| `npm run verify:contracts` | ✅ |
| `npm run verify:p1` | ✅ |
| `npm run verify:p2` | ✅ |
| `npm run verify:dailybrief` | ✅ 21 tests |
| `npm run verify:explainable` | ✅ 14 tests |

---

## 11. Dette technique

| Dette | Impact |
|-------|--------|
| Explicabilité limitée au Daily Brief (pas P1/P2 cartes séparées) | Faible — scope sprint |
| Codes sémantiques intermédiaires (couche traduction) | Acceptée — évite exposition technique |
| Facteurs Reasoning négatifs non affichés | Volontaire — ton non alarmiste |

| Dette évitée | |
|--------------|--|
| Modification moteurs | ✅ |
| Nouveau contrat | ✅ |
| Logique métier dans React | ✅ |
| Exposition scores / JSON | ✅ |

---

## 12. Améliorations futures

1. Étendre « Pourquoi ? » aux cartes P1 (Planning) et P2 (reschedule).
2. Aligner codes sur un registre partagé si d'autres surfaces explicables apparaissent.
3. Tests e2e Playwright sur ouverture/fermeture du panneau.

---

## 13. Verdict Architecture Guardian

| Critère | Statut |
|---------|:------:|
| Aucun nouveau moteur | ✅ |
| Aucun nouveau contrat | ✅ |
| Aucune décision supplémentaire | ✅ |
| Raisons depuis moteurs existants | ✅ |
| UI sans logique métier | ✅ |
| Pas de texte technique affiché | ✅ |
| Feature flag OFF par défaut | ✅ |
| Non-régression Daily Brief / P1 / P2 | ✅ |

### Verdict : **APPROVED**

---

*Aucun commit, merge ou déploiement effectué — en attente validation humaine.*
