# Sprint P1 — Première fonctionnalité IA complète

> **Date :** 18 juillet 2026  
> **Statut :** ✅ Terminé — en attente validation humaine  
> **Catégorie retenue :** **Études** (révision)

---

## 1. Parcours utilisateur

```
Planning (timeline générée)
    │
    ▼
Créneau libre détecté (≥ 15 min)
    │
    ▼
Carte proactive unique (si flag P1 ON)
    │
    ├── "Tu disposes d'environ X minutes."
    ├── "Tu voulais avancer ton [cours/tâche]."
    └── "C'est probablement le meilleur moment aujourd'hui."
    │
    ├── [Commencer]  → acceptation → calendrier → proposal.accepted
    ├── [Plus tard]  → defer session (pas d'événement outcome)
    └── [Ignorer]    → proposal.dismissed
    │
    ▼ (après Commencer + complétion timeline)
task.completed → OutcomeObservationEngine → PersonalSignal
```

**Une seule notification** : une carte sur PlanningPage, premier créneau libre éligible, une fois par session (defer/dismiss mémorisés en `sessionStorage`).

---

## 2. Moteurs sollicités (existants — aucun nouveau)

| # | Moteur | Rôle P1 | Fichier réutilisé |
|---|--------|---------|-------------------|
| — | **Disponibilité / planning** | Détection créneau libre timeline | `displayedDayTimeline`, `freeSlotEntries` |
| 6 | **PlanningContext** | Contexte jour + profil études | `memoryContextService` |
| 8 | **Availability** (legacy) | Durée créneau exploitable | `resolveStudyRevisionDuration` |
| 12 | **DecisionEngine** | Validation bloc révision proposé | `validatePlannedBlockCore` (A3) |
| 11 | **ReasoningEngine** | Hint timing naturel (si lifeContext) | `reasonAboutLifeProposal` |
| 15 | **RecommendationEngine** | Sélection suggestion étude | `generateFreeTimeSuggestions` |
| 17 | **NaturalResponse** *(partiel)* | Format message P1 | `formatStudyRecommendationMessage` |
| 20 | **OutcomeObservationEngine** | presented / accepted / dismissed / task.* | `outcomeObservationBridge` (A4) |

**Non sollicités (volontairement) :** NotificationEngine (inexistant), UniversalLearningEngine, ConversationEngine.

---

## 3. Architecture

```
PlanningPage
    └── useStudySlotRecommendation (hook — orchestration UI)
            └── buildStudySlotRecommendation (orchestrateur pur)
                    ├── generateFreeTimeSuggestions
                    ├── validatePlannedBlockCore
                    ├── reasonAboutLifeProposal
                    └── formatStudyRecommendationMessage
            └── studySlotRecommendationService (actions métier)
                    ├── acceptFreeTimeSuggestion
                    └── outcomeObservationBridge
    └── StudySlotRecommendationCard (présentation seule)
```

**Principe :** aucune décision dans l'UI — la carte ne fait qu'afficher et déléguer au hook/service.

---

## 4. Fichiers créés

| Fichier | Rôle |
|---------|------|
| `src/lib/recommendations/buildStudySlotRecommendation.ts` | Orchestrateur vertical |
| `src/lib/recommendations/formatStudyRecommendationMessage.ts` | Copy naturelle |
| `src/lib/recommendations/studySlotRecommendationService.ts` | Actions + outcomes |
| `src/lib/recommendations/studySlotRecommendationStorage.ts` | Defer/dismiss session |
| `src/lib/recommendations/buildStudySlotRecommendation.test.ts` | Tests parcours complet |
| `src/hooks/useStudySlotRecommendation.ts` | Hook PlanningPage |
| `src/components/recommendations/StudySlotRecommendationCard.tsx` | UI Commencer/Plus tard/Ignorer |

---

## 5. Fichiers modifiés

| Fichier | Modification |
|---------|--------------|
| `src/pages/PlanningPage.tsx` | Intégration carte P1 |
| `src/config/featureFlags.ts` | `isStudySlotRecommendationEnabled()` |
| `.env.example` | `VITE_P1_STUDY_RECOMMENDATION=false` |
| `src/styles/sprint50.css` | Styles carte |
| `package.json` | `verify:p1` |

**Non modifiés :** contrats, ADR, moteurs core, FreeTimeSuggestionModal (coexiste).

---

## 6. UX

Exemple de copy générée :

```
Tu disposes d'environ 60 minutes.

Tu voulais avancer ton cours de naturopathie.

C'est probablement le meilleur moment aujourd'hui.
```

Boutons : **Commencer** · **Plus tard** · **Ignorer**

---

## 7. Observation (événements existants A4)

| Action UI | Événement OutcomeObservation |
|-----------|---------------------------|
| Carte affichée | `proposal.presented` |
| Commencer | `proposal.accepted` |
| Ignorer | `proposal.dismissed` |
| Plus tard | *(aucun — defer local)* |
| Compléter tâche timeline | `task.completed` (via blockActionService A4) |

**Aucune nouvelle catégorie d'événement.**

---

## 8. Tests

| Suite | Tests | Couverture |
|-------|:-----:|------------|
| `buildStudySlotRecommendation.test.ts` | 5 | Slot → suggestion → decision → message → outcome → PersonalSignal |
| **Total projet** | **932** (+5) | ✅ |

Scénarios :
- Format copy P1
- Détection premier créneau exploitable
- Recommendation avec decision approved
- Slot trop court → null
- Boucle present → dismiss → PersonalSignal personal_only, zero Universal

Commande : `npm run verify:p1`

---

## 9. Validation technique

| Commande | Résultat |
|----------|:--------:|
| `npm run build` | ✅ |
| `npm test` | ✅ 932 |
| `npm run verify:contracts` | ✅ |
| `npm run verify:p1` | ✅ |

---

## 10. Flux capturés (texte)

### Flux nominal

```
1. timeline contient blockKind=free_slot (60 min)
2. buildStudySlotRecommendation → suggestion type=study
3. validatePlannedBlockCore → approved=true
4. presentStudyRecommendation → trace ouverte
5. acceptStudyRecommendation → calendar_item + proposal.accepted
6. (utilisateur) complete timeline → task.completed → PersonalSignal
```

### Flux Ignorer

```
present → dismiss → proposal.dismissed → trace status=closed
```

---

## 11. Dette restante

| Dette | Impact |
|-------|--------|
| P1 limité à PlanningPage (pas HomePage) | Moyen |
| Defer en sessionStorage (non persistant) | Faible |
| `Plus tard` sans événement outcome | Documenté — pas de catégorie A4 pour defer |
| NaturalResponseEngine non implémenté (formatter local) | Faible |
| NotificationEngine absent (carte = notification in-app) | Attendu |
| Modal multi-options coexiste | UX double entrée |

---

## 12. Améliorations P2

1. **HomePage** — même carte proactive sur widget temps libre  
2. **Sport ou Admin** — second vertical en réutilisant le même orchestrateur pattern  
3. **Feedback helpful/unhelpful** — bouton post-séance branché sur A4  
4. **Persistance defer** — préférence utilisateur (pas sessionStorage)  
5. **NaturalResponseEngine** — remplacer formatter local quand implémenté  

---

## 13. Activation

```env
VITE_P1_STUDY_RECOMMENDATION=true
VITE_ENABLE_OUTCOME_OBSERVATION=true   # boucle outcome complète
```

Redémarrer Vite (`http://localhost:5173`). Générer un planning avec un créneau libre ≥ 15 min et profil études actif.

---

## 14. Verdict Architecture Guardian

### **APPROVED WITH RECOMMENDATIONS**

| Critère | Verdict |
|---------|:-------:|
| Respect des contrats | ✅ Aucun contrat modifié |
| Absence logique métier UI | ✅ Carte pure, hook/service décident |
| Utilisation correcte moteurs | ✅ Composition legacy + A3 + A4 |
| Absence nouvelle abstraction | ✅ Orchestrateur lib/ (pas moteur #21) |
| Pas de duplication validation | ✅ DecisionEngine core réutilisé |
| Dual Memory respecté | ✅ personal_only via A4 |
| Fail-open | ✅ P1 flag off = comportement identique |

**Recommandations :**
1. Unifier HomePage et PlanningPage sur le même hook avant P2  
2. Documenter explicitement que « Plus tard » n'émet pas d'outcome (defer ≠ dismiss)  
3. Retirer progressivement la modal multi-options quand P1 validé produit  

---

*Sprint P1 — Première fonctionnalité IA verticale — Équilibre IA — Aucun commit, aucun déploiement.*
