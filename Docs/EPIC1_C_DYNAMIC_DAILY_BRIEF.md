# EPIC1-C — Daily Brief adaptatif

> **Date :** 19 juillet 2026  
> **Statut :** ✅ Terminé — en attente validation humaine  
> **Prérequis :** EPIC1-A (Daily Brief) + EPIC1-B (IA explicable) validés

---

## 1. Objectif

Faire évoluer automatiquement le Daily Brief lorsque la journée change, sans le traiter comme une photographie figée.

---

## 2. Flux de mise à jour

```
Timeline modifiée (useDayPlan)
    │
    ▼
buildDailyBriefTimelineSignature(timeline)
    │  compare avec signature précédente
    ▼
buildDailyBrief() — moteurs existants (EPIC1-A)
    │
    ▼
refreshAdaptiveDailyBrief()
    │
    ├── Signature identique → état inchangé
    ├── Recommandations équivalentes → état inchangé (pas de hint)
    ├── Recommandations obsolètes → nouveau brief + hint discret
    └── Aucune recommandation → synthèse « sous contrôle »
    │
    ▼
presentDailyBrief() — raisons EPIC1-B recalculées sur le brief courant
    │
    ▼
DailyBriefSection / Modal (+ « Mis à jour il y a quelques instants. »)
```

---

## 3. Événements déclencheurs (réutilisés — aucun nouvel événement)

Les mutations planning existantes mettent à jour `timeline` via `useDayPlan` :

| Action utilisateur | Service / chemin existant | Effet sur signature |
|-------------------|---------------------------|---------------------|
| Ajout tâche | `acceptFreeTimeSuggestion`, génération plan | Entrée ajoutée |
| Suppression | `blockActionService` cancel | Entrée retirée |
| Déplacement | `blockActionService` reschedule | `startsAt` / `endsAt` changent |
| Validation | `blockActionService` complete | `completed: true` |
| Annulation | `blockActionService` cancel / no_time | Entrée modifiée ou retirée |

**Aucun nouvel événement métier créé.** Le hook observe la timeline affichée — reflet des services existants.

---

## 4. Stratégie de rafraîchissement

### Signature timeline
`buildDailyBriefTimelineSignature` — empreinte des blocs non structurels (id, horaires, complétion, type).

### Équivalence recommandations
`areDailyBriefRecommendationsEquivalent` compare pour chaque carte :
- `kind`
- `entryId`
- `explainabilityReasonCodes`
- `decisionApproved`

### Règles

| Situation | Comportement |
|-----------|--------------|
| Timeline inchangée | Brief affiché inchangé |
| Timeline changée, reco équivalentes | **Aucune modification** (pas de hint) |
| Timeline changée, reco différentes | Nouveau brief + hint « Mis à jour il y a quelques instants. » |
| Plus aucune reco pertinente | Synthèse : « Ta journée semble sous contrôle pour le moment. » |

### Explicabilité (EPIC1-B)
À chaque brief affiché, `presentDailyBrief` recalcule les raisons depuis `explainabilityReasonCodes` du brief **courant** — jamais de raisons obsolètes.

---

## 5. Moteurs sollicités (existants — aucun #21)

| Moteur | Rôle |
|--------|------|
| **PlanningContextEngine** | Contexte jour (inchangé EPIC1-A) |
| **AvailabilityEngine** | Analyse densité / créneaux |
| **DecisionEngine** | Validation études |
| **ReasoningEngine** | Facteurs explicabilité |
| **RecommendationEngine** | Suggestions études |
| **OutcomeObservationEngine** | *Non sollicité* (pas de nouvel événement) |

---

## 6. UX

- Hint discret italique sous le titre Daily Brief
- Texte fixe : **« Mis à jour il y a quelques instants. »**
- Pas de notification push, toast ou modal intrusif
- Visible dans la section Accueil et le modal (si ouvert)

---

## 7. Feature flag

| Variable | Défaut | Effet |
|----------|--------|-------|
| `VITE_DYNAMIC_DAILY_BRIEF` | `false` | OFF → comportement EPIC1-A statique (rebuild à chaque render sans merge intelligent) |
| `VITE_DAILY_BRIEF` | requis | Brief actif |

Helper : `isDynamicDailyBriefEnabled()`.

---

## 8. Fichiers créés

| Fichier | Rôle |
|---------|------|
| `src/lib/dailyBrief/dailyBriefTimelineSignature.ts` | Empreinte timeline |
| `src/lib/dailyBrief/dailyBriefRecommendationSignature.ts` | Équivalence recommandations |
| `src/lib/dailyBrief/formatDailyBriefUpdateHint.ts` | Copy hint + synthèse sous contrôle |
| `src/lib/dailyBrief/refreshAdaptiveDailyBrief.ts` | Orchestrateur refresh |
| `src/lib/dailyBrief/refreshAdaptiveDailyBrief.test.ts` | 15 tests |

---

## 9. Fichiers modifiés

| Fichier | Modification |
|---------|--------------|
| `src/hooks/useDailyBrief.ts` | État adaptatif + hint |
| `src/components/dailyBrief/DailyBriefSection.tsx` | Affichage hint |
| `src/components/dailyBrief/DailyBriefModal.tsx` | Affichage hint |
| `src/pages/HomePage.tsx` | Passe `updateHint` |
| `src/config/featureFlags.ts` | `isDynamicDailyBriefEnabled()` |
| `.env.example` | `VITE_DYNAMIC_DAILY_BRIEF=false` |
| `src/styles/sprint50.css` | Style hint |
| `package.json` | `verify:dynamic-dailybrief` |

---

## 10. Tests

| Suite | Tests | Couverture |
|-------|:-----:|------------|
| `refreshAdaptiveDailyBrief.test.ts` | 15 | Ajout, suppression, déplacement, complétion, annulation, stabilité, sous contrôle, explicabilité, non-régression A/B |

Commande : `npm run verify:dynamic-dailybrief`

---

## 11. Protocole validation manuelle

**Prérequis :** `VITE_DAILY_BRIEF=true`, `VITE_DYNAMIC_DAILY_BRIEF=true`, `VITE_EXPLAINABLE_AI=true`

| Cas | Action | Résultat attendu |
|-----|--------|------------------|
| **A — ajout** | Ajouter tâche qui occupe le créneau études | Brief mis à jour + hint |
| **B — suppression** | Supprimer une tâche bloquante | Nouvelle reco études possible + hint |
| **C — déplacement** | Décaler une séance sport | Carte sport adaptée + hint |
| **D — complétion** | Marquer sport terminé | Carte « déjà bougé » + hint |
| **E — stabilité** | Action sans impact reco (ex. commentaire) | Pas de hint si reco identiques |
| **F — sous contrôle** | Remplir la journée | Synthèse sous contrôle, 0 carte |
| **G — explicabilité** | « Pourquoi ? » après update | Raisons alignées avec carte actuelle |

---

## 12. Résultats des commandes

| Commande | Résultat |
|----------|:--------:|
| `npm run build` | ✅ |
| `npm run lint` | ✅ |
| `npm test` | ✅ **1006** tests (+15) |
| `npm run verify:contracts` | ✅ |
| `npm run verify:p1` | ✅ |
| `npm run verify:p2` | ✅ |
| `npm run verify:dailybrief` | ✅ 21 tests |
| `npm run verify:explainable` | ✅ 14 tests |
| `npm run verify:dynamic-dailybrief` | ✅ 15 tests |

---

## 13. Dette technique

| Dette | Impact |
|-------|--------|
| Refresh observé sur Accueil uniquement (timeline HomePage) | Faible |
| Équivalence par signature, pas revalidation moteur individuelle | Acceptée — suffisant MVP |
| Hint sans horodatage relatif dynamique | Volontaire — copy spec |

| Dette évitée | |
|--------------|--|
| Nouveaux événements métier | ✅ |
| Nouveau moteur | ✅ |
| Notifications intrusives | ✅ |

---

## 14. Verdict Architecture Guardian

| Critère | Statut |
|---------|:------:|
| Aucun nouveau moteur | ✅ |
| Aucun nouvel événement | ✅ |
| Réutilisation services planning existants | ✅ |
| UI sans logique refresh | ✅ |
| Raisons EPIC1-B synchronisées | ✅ |
| Non-régression EPIC1-A / B | ✅ |
| Feature flag OFF par défaut | ✅ |
| Fail-open (buildDailyBrief null → pas de crash) | ✅ |

### Verdict : **APPROVED**

---

*Aucun commit, merge ou déploiement effectué — en attente validation humaine.*
