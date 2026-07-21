# Sprint A4 — Première boucle d'observation réelle

> **Date :** 18 juillet 2026  
> **Statut :** ✅ Terminé — en attente validation humaine  
> **Moteur :** OutcomeObservationEngine (#20) — première implémentation (non migration legacy)

---

## 1. Cartographie runtime existante (audit pré-implémentation)

| Étape | Fichier | IDs disponibles | Manques corrélation |
|-------|---------|-----------------|---------------------|
| Proposition créée | `freeTimeSuggestionEngine.ts` | `suggestion.id` | `traceId`, `correlationId`, `memberId` |
| Proposition présentée | `FreeTimeSuggestionModal.tsx` | `suggestion.id`, `userId` | trace, household au mount |
| Acceptation | `suggestionAcceptanceService.ts` | `userId`, `householdId`, `taskId`, `calendarItemId` | lien proposal → task |
| Rejet explicite | *(non implémenté UI)* | — | — |
| Dismiss | `FreeTimeSuggestionModal` onClose | `suggestion.id` | trace session |
| Tâche complétée | `blockActionService.ts` → `completeTimelineEntry` | `taskId`, `calendarItemId` | lien proposal |
| Tâche sautée | `blockActionService.ts` cancel / no_time | idem | lien proposal |
| Tâche replanifiée | `blockActionService.ts` reschedule | idem | lien proposal |
| Legacy partiel | `aggregateBehaviorSignals.ts` | compteurs activité | pas de ProposalTrace |

**Constat :** aucun `traceId` / `correlationId` runtime avant A4. `userId` utilisé partout — mappé vers `memberId` via `asMemberId(userId)`.

---

## 2. Flux pilote choisi

**Proposition de temps libre → acceptation/dismiss → complétion/replanification/skip sur timeline**

```
FreeTimeSuggestionModal (presented)
        ↓
PlanningPage.handleAcceptSuggestion (accepted)
        ↓
suggestionAcceptanceService (correlation task/calendar)
        ↓
blockActionService (task.completed | skipped | rescheduled)
        ↓
OutcomeObservationEngine → PersonalSignal (personal_only)
```

**Pourquoi ce flux :** proposition ID stable (`FreeTimeSuggestion.id`), `householdId` disponible à l'acceptation, outcomes mesurables via actions timeline, périmètre UI limité (PlanningPage).

**Non instrumenté (volontairement) :** conversation NLP, sport inline, tâches TasksPage, feedback helpful/unhelpful UI (supporté par moteur, pas branché UI).

---

## 3. Architecture de l'implémentation

```
Integration (fail-open)
  outcomeObservationBridge.ts
        ↓
  ContractOutcomeObservationEngine (IOutcomeObservationEngine)
        ├── InMemoryProposalTraceStore (IProposalTraceRepository)
        ├── CorrelationRegistry
        ├── InMemoryPersonalSignalSink (IPersonalSignalSink)
        └── OutcomeObservability (métriques DEV)
```

**Principe :** tracer la décision et son devenir — pas recopier la vie de l'utilisateur.

---

## 4. Format minimal ProposalTrace (runtime)

| Champ | Source A4 |
|-------|-----------|
| `traceId` | UUID généré à `proposal.presented` |
| `correlationId` | UUID généré à `proposal.presented` |
| `proposalId` | `FreeTimeSuggestion.id` |
| `decisionId` | — (non disponible pilote) |
| `memberId` | `asMemberId(userId)` |
| `proposalType` | `recommendation` |
| `status` | presented → accepted/rejected/closed/outcome_observed |
| `createdAt` / `updatedAt` | ISO timestamps |
| `engines[]` | recommendation-engine + outcome-observation-engine refs |
| `consentScopes` | `['personal_memory']` |
| `retention` | `{ ttlDays: 30, purgeContentAfterClose: true }` |
| `memoryRoute` | `personal_only` |

**Non enregistré :** conversation, raisonnements, prompts, contenu privé, données santé/famille.

---

## 5. Repository choisi

| Couche | Implémentation | Réversibilité |
|--------|----------------|---------------|
| `IProposalTraceRepository` | `InMemoryProposalTraceStore` | ✅ reset runtime |
| `IPersonalSignalSink` | `InMemoryPersonalSignalSink` | ✅ clear() |
| `CorrelationRegistry` | In-memory Map | ✅ clear() |

**Aucune migration Supabase.** Port abstrait prêt pour persistance A5+.

**Suppression :** `deleteByTraceId()`, `deleteByMemberId()` implémentés.

---

## 6. Événements réellement supportés (métier A4)

| Événement | Traitement | Branché UI pilote |
|-----------|:----------:|:-----------------:|
| `proposal.presented` | ✅ trace + signal | ✅ |
| `proposal.accepted` | ✅ corrélation + signal | ✅ |
| `proposal.rejected` | ✅ sémantique | ❌ (API prête) |
| `proposal.dismissed` | ✅ distinct reject | ✅ |
| `task.completed` | ✅ sans causalité | ✅ |
| `task.skipped` | ✅ sans échec | ✅ |
| `task.rescheduled` | ✅ sans jugement | ✅ |
| `user.reported_helpful` | ✅ signal explicite | ❌ (API prête) |
| `user.reported_unhelpful` | ✅ signal explicite | ❌ (API prête) |

Autres événements contractuels : validés schéma, pas de traitement métier A4.

---

## 7. Sémantique des outcomes

Définie dans `outcomeSemantics.ts` — chaque type inclut :

- `meaning` / `notMeaning`
- `evidenceType` (explicit_user_action | implicit_ui_action | system_record | user_feedback)
- `interpretationLimits` (ex. `acceptance_not_success`, `no_causality`, `dismiss_not_reject`)
- `correlationStatus` encodé dans `signalType` : `outcome:{event}:{evidence}:{correlation}`

**Exemples :**

| Événement | Signifie | Ne signifie pas |
|-----------|----------|-----------------|
| `proposal.accepted` | L'utilisateur a accepté | La proposition était bonne |
| `task.completed` | Tâche déclarée terminée | Recommandation efficace |
| `proposal.dismissed` | Fermeture sans acceptation | Rejet explicite |
| `task.rescheduled` | Replanification | Échec |

---

## 8. PersonalSignals produits

- Type : `BehaviorSignal` (`__memoryTier: 'personal'`)
- Route : **`personal_only`** — jamais `universal_candidate`
- `emitAnonymizedCandidates()` : **toujours `[]`**
- Aucun appel UniversalLearningEngine
- Aucun contournement AnonymizationGate

---

## 9. Feature flag

```env
VITE_ENABLE_OUTCOME_OBSERVATION=false   # défaut
```

| État | Comportement |
|------|--------------|
| `false` | Aucun traitement, aucune erreur UX |
| `true` | Observation flux pilote, fail-open garanti |

Helper : `isOutcomeObservationEnabled()` dans `featureFlags.ts`.

---

## 10. Fichiers créés

| Fichier | Rôle |
|---------|------|
| `src/ai/traces/proposalTraceRepository.ts` | Port repository |
| `src/ai/traces/inMemoryProposalTraceStore.ts` | Store in-memory |
| `src/ai/traces/index.ts` | Exports |
| `src/ai/outcome/personalSignalSink.ts` | `IPersonalSignalSink` |
| `src/ai/outcome/correlationRegistry.ts` | Liens proposal ↔ task/calendar |
| `src/ai/outcome/outcomeObservationRuntime.ts` | Singleton runtime |
| `src/ai/outcome/outcomeObservationBridge.ts` | Bridge fail-open + pilot API |
| `src/ai/outcome/index.ts` | Exports |
| `src/ai/engines/outcome/outcomeSemantics.ts` | Sémantique prudente |
| `src/ai/engines/outcome/outcomeObservability.ts` | Métriques |
| `src/ai/engines/outcome/outcomeObservationEngine.ts` | `IOutcomeObservationEngine` |
| `src/ai/engines/outcome/index.ts` | Exports |
| `src/ai/engines/outcome/outcomeObservationEngine.test.ts` | Tests moteur |
| `src/ai/outcome/outcomeObservationBridge.test.ts` | Tests bridge + non-régression |

---

## 11. Fichiers modifiés

| Fichier | Modification |
|---------|--------------|
| `src/config/featureFlags.ts` | `isOutcomeObservationEnabled()` |
| `.env.example` | `VITE_ENABLE_OUTCOME_OBSERVATION=false` |
| `package.json` | `verify:outcome` |
| `src/ai/contracts/legacy/migration-map.ts` | `OUTCOME_OBSERVATION_ENGINE_ADAPTER` wired |
| `FreeTimeSuggestionModal.tsx` | presented + dismissed |
| `PlanningPage.tsx` | accepted |
| `suggestionAcceptanceService.ts` | correlation registry |
| `blockActionService.ts` | task outcomes (fail-open) |

**Non modifiés :** contrats TypeScript, ADR, UX visible, HumanModelEngine, ULE.

---

## 12. Tests ajoutés

| Suite | Tests |
|-------|:-----:|
| `outcomeObservationEngine.test.ts` | 17 |
| `outcomeObservationBridge.test.ts` | 6 |
| **Total projet** | **927** (+23) |

**Couverture explicite (checklist sprint) :**

1. ✅ proposal.presented → trace  
2. ✅ proposal.accepted corrélé  
3. ✅ proposal.rejected corrélé  
4. ✅ proposal.dismissed ≠ reject  
5. ✅ task.completed sans causalité  
6. ✅ task.skipped ≠ échec  
7. ✅ task.rescheduled sans jugement  
8. ✅ user.reported_helpful  
9. ✅ user.reported_unhelpful  
10. ✅ corrélation manquante contrôlée  
11. ✅ événement invalide rejeté  
12. ✅ flag off = aucun effet  
13. ✅ erreur observation ≠ crash UX  
14. ✅ aucun UniversalSignal  
15. ✅ aucune entrée ULE  
16. ✅ pas de PII dans logs/signals  
17. ✅ PersonalSignal Dual Memory  
18. ✅ rétention + consentement trace  

---

## 13. Résultats des commandes

| Commande | Résultat |
|----------|:--------:|
| `npm run build` | ✅ |
| `npm run lint` | ✅ (warnings préexistants) |
| `npm test` | ✅ 927 tests |
| `npm run verify:contracts` | ✅ |
| `npm run verify:outcome` | ✅ 23 tests |

---

## 14. Métriques d'observabilité (DEV)

Via `OutcomeObservability.snapshot()` :

- `eventsReceived`, `eventsValid`, `eventsRejected`
- `correlationsSucceeded`, `correlationsMissing`, `tracesNotFound`
- `personalSignalsProduced`, `internalErrors`

Journalisation : IDs, statuts, catégories — **jamais contenu privé complet**.

---

## 15. Garanties de confidentialité

| Garantie | Statut |
|----------|:------:|
| Minimisation traces | ✅ |
| Séparation tiers mémoire (personal_only) | ✅ |
| Absence envoi réseau observation | ✅ |
| Absence ULE | ✅ |
| Pas de PII dans logs | ✅ |
| Consentement propagé | ✅ |
| Rétention présente | ✅ |
| Suppression par traceId/memberId | ✅ |

---

## 16. Limites

- Store in-memory — perdu au reload
- Flux pilote unique (suggestions temps libre Planning)
- `proposal.rejected` / feedback helpful sans UI
- Pas de AnonymizationGate réelle
- Pas de connexion HumanModelEngine
- `memberId` = alias `userId` (pas de table members)

---

## 17. Dette

| Dette | Type |
|-------|------|
| Persistance Supabase traces/outcomes | Créée (volontaire, différée) |
| Instrumentation NLP / sport / TasksPage | Créée |
| UI feedback helpful/unhelpful | Créée |
| AnonymizationGate runtime | Évitée ✅ |
| ULE / apprentissage global | Évitée ✅ |
| Nouveau moteur #21 | Évitée ✅ |
| Migration Supabase | Évitée ✅ |

---

## 18. Risques restants

| Risque | Mitigation |
|--------|------------|
| Perte traces au reload | Port repository → persistance A5 |
| Corrélation incomplète hors pilote | Extension progressive par flux |
| `memberId` = `userId` | Alignement modèle household_members futur |

---

## 19. Recommandation A5

**HouseholdEngine** (adaptateur legacy `familyContextEngine`) **ou** persistance ProposalTrace Supabase — selon priorité produit :

- Si corrélation multi-flux urgente → persistance traces d'abord  
- Si contexte foyer critique → HouseholdEngine adaptateur (pattern A3)

---

## 20. Verdict Architecture Guardian

### **APPROVED WITH RECOMMENDATIONS**

| Critère | Verdict |
|---------|:-------:|
| Conformité `IOutcomeObservationEngine` | ✅ |
| Respect ProposalTrace minimal | ✅ |
| Absence décision/recommandation | ✅ |
| Distinction observation/corrélation/causalité | ✅ |
| Dual Memory (personal_only) | ✅ |
| Absence connexion ULE | ✅ |
| Fail-open UX | ✅ |
| Minimisation données | ✅ |
| Réversibilité | ✅ |
| Testabilité | ✅ |
| Pas de moteur #21 | ✅ |

**Recommandations (non bloquantes) :**

1. Persister ProposalTrace avant d'élargir les flux instrumentés  
2. Ajouter UI feedback helpful/unhelpful sur une proposition pilote  
3. Formaliser mapping `userId` → `memberId` quand household_members sera généralisé  

---

## Activation manuelle

```env
VITE_ENABLE_OUTCOME_OBSERVATION=true
```

Redémarrer Vite. Parcours test : Planning → temps libre → accepter proposition → compléter tâche sur timeline.

---

*Sprint A4 — Première boucle d'observation — Équilibre IA — Aucun commit, aucun déploiement.*
