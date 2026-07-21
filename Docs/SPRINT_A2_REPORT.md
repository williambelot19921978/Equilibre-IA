# Rapport Sprint A2 — Contrats TypeScript cerveau IA

> **Sprint A2** — Interfaces officielles · Aucune logique métier  
> Date : 18 juillet 2026  
> Verdict Guardian : **APPROVED WITH RECOMMENDATIONS** (score **96/100**)

---

## 1. Synthèse

Sprint A2 livre la **couche de contrats TypeScript** pour les **20 moteurs figés** du cerveau Équilibre IA, permettant une migration progressive (ADR-0001) sans modifier le comportement utilisateur ni connecter le legacy.

Boucle officielle documentée :

```
comprendre → décider → proposer → observer → mesurer → apprendre
```

---

## 2. Décisions humaines appliquées

| Décision | Statut |
|----------|--------|
| OutcomeObservationEngine #20 APPROVED | ✅ |
| ADR-0004 → `accepted` | ✅ |
| Gel 20 moteurs (ADR-0005) | ✅ |
| AnonymizationGate = infrastructure (pas #21) | ✅ |
| Politique moteur exceptionnel | ✅ ADR-0005 § procédure |
| ADR-0006 clarifications frontières | ✅ |

---

## 3. Fichiers créés

### Documentation

| Fichier | Rôle |
|---------|------|
| `architecture/adr/0005-freeze-brain-architecture-20-engines.md` | Gel architecture |
| `architecture/adr/0006-engine-boundary-clarifications.md` | 3 ambiguïtés tranchées |
| `architecture/decisions/2026-07-18-sprint-a2-typescript-contracts.md` | Revue Guardian |

### TypeScript — `src/ai/contracts/`

| Dossier / fichier | Rôle |
|-------------------|------|
| `common/` | IDs branded, confidence, consent, errors, EngineId |
| `events/` | Outcome events (16 types), EngineEvent envelope |
| `traces/` | proposalTrace, IProposalTraceStore |
| `privacy/` | PersonalSignal, UniversalSignal, AnonymizationGate |
| `engines/*.contract.ts` | **20 interfaces moteurs** |
| `engines/registry.ts` | Registre figé FROZEN_ENGINE_COUNT=20 |
| `engines/shared-domain.ts` | Types domaine partagés |
| `engines/outcome-types.ts` | Correlation, metrics |
| `legacy/migration-map.ts` | Cartographie legacy → contrat |
| `index.ts` | Export public |
| `contracts.test.ts` | Tests structurels + QA-MEM-015/016, QA-PRV-015 |
| `boundaries.test.ts` | Tests import boundaries |

### Scripts / QA

| Fichier | Rôle |
|---------|------|
| `scripts/verify-contract-boundaries.mjs` | Vérification imports |
| `qa/scenarios/domains/ia-memory.yaml` | QA-MEM-015, QA-MEM-016 |
| `qa/scenarios/domains/permissions-privacy.yaml` | QA-PRV-015 |

---

## 4. Fichiers modifiés

| Fichier | Modification |
|---------|--------------|
| `architecture/adr/0004-outcome-observation-engine.md` | `accepted` |
| `architecture/adr/README.md` | ADR 0004–0006 |
| `architecture/contracts/00-index.md` | Banner FROZEN 20 moteurs |
| `architecture/contracts/human-model-engine.md` | Source behaviorSignals → OO #20 |
| `architecture/contracts/diagram-pipeline-global.md` | Boucle rétroaction |
| `architecture/decisions/2026-07-18-pre-implementation-review.md` | Validé humainement |
| `package.json` | Script `verify:contracts` |

---

## 5. Liste exacte des 20 interfaces

| # | Interface | Fichier |
|---|-----------|---------|
| 1 | `IConversationEngine` | `conversation-engine.contract.ts` |
| 2 | `IIntentEngine` | `intent-engine.contract.ts` |
| 3 | `IPLMEngine` | `personal-language-memory-engine.contract.ts` |
| 4 | `IHumanModelEngine` | `human-model-engine.contract.ts` |
| 5 | `IHouseholdEngine` | `household-engine.contract.ts` |
| 6 | `IPlanningContextEngine` | `planning-context-engine.contract.ts` |
| 7 | `IConstraintEngine` | `constraint-engine.contract.ts` |
| 8 | `IAvailabilityEngine` | `availability-engine.contract.ts` |
| 9 | `IGoalEngine` | `goal-engine.contract.ts` |
| 10 | `ILifeEventEngine` | `life-event-engine.contract.ts` |
| 11 | `IReasoningEngine` | `reasoning-engine.contract.ts` |
| 12 | `IDecisionEngine` | `decision-engine.contract.ts` |
| 13 | `IActionProposalEngine` | `action-proposal-engine.contract.ts` |
| 14 | `ISchedulerEngine` | `scheduler-engine.contract.ts` |
| 15 | `IRecommendationEngine` | `recommendation-engine.contract.ts` |
| 16 | `IKnowledgeEngine` | `knowledge-engine.contract.ts` |
| 17 | `INaturalResponseEngine` | `natural-response-engine.contract.ts` |
| 18 | `INotificationEngine` | `notification-engine.contract.ts` |
| 19 | `IUniversalLearningEngine` | `universal-learning-engine.contract.ts` |
| 20 | `IOutcomeObservationEngine` | `outcome-observation-engine.contract.ts` |

**Infrastructure (non moteur) :** `IAnonymizationGate`, `IProposalTraceStore`

---

## 6. Types transverses

- **IDs branded** : UserId, MemberId, HouseholdId, SessionId, ConversationId, TurnId, ProposalId, DecisionId, OutcomeId, TraceId, CorrelationId, …
- **ContractVersion** : `1.0.0` sur tous les moteurs
- **Confidence** (0..1), **AutonomyLevel** (1–4)
- **ConsentScope**, **SensitivityLevel**, **SignalProvenance**, **MemoryRoute**
- **Result<T, ContractError>**, **ContractErrorCode**
- **EngineContractMeta**, **ENGINE_REGISTRY**, **FROZEN_ENGINE_COUNT=20**

---

## 7. Événements

- **16+ outcome events** versionnés (`OUTCOME_EVENT_SCHEMA_VERSION`)
- **EngineEvent** envelope par moteur
- Chaque contrat exporte `*_ENGINE_EVENTS.emitted` et `.consumed`

---

## 8. proposalTrace

- `ProposalTrace` — refs minimales (turnId, intentRef, decisionId, …)
- `ProposalTraceLink` — corrélation proposalId ↔ traceId ↔ correlationId
- `IProposalTraceStore` — open / append / attachOutcome / resolve
- Rétention TTL configurable — **pas de dump conversation**

---

## 9. Clarification des 3 ambiguïtés (ADR-0006)

| Ambiguïté | Décision |
|-----------|----------|
| Scheduler vs Decision | Scheduler **construit** → Decision **valide** |
| Reasoning vs Recommendation vs Scheduler | Reasoning **arbitre** → Recommendation **détaille** → Scheduler **place** |
| PLM vs Intent | PLM **upstream hints** → Intent **arbitre final** → utilisateur **confirme** apprentissage PLM |

---

## 10. Dual Memory & AnonymizationGate

- `PersonalSignal` (`__memoryTier: 'personal'`) — memberId requis
- `AnonymizedCandidate` → `IAnonymizationGate.processCandidate()` → `GatePassedUniversalSignal`
- `IUniversalLearningEngine.submitAnonymizedSignal(signal: UniversalLearningInput)` — **gate-passed only**
- `RejectPersonalForUniversal<T>` — garde type-level

---

## 11. Tests ajoutés

| Fichier | Tests |
|---------|-------|
| `contracts.test.ts` | Registry 20, events, Dual Memory, QA scenarios |
| `boundaries.test.ts` | Pas d'import legacy depuis contracts |

**Total projet après sprint : 888 tests pass**

---

## 12. Commandes exécutées

```bash
npm run build      # ✅ tsc + vite
npm run lint       # ✅ oxlint (warnings préexistants unrelated)
npm test           # ✅ 888 passed
npm run verify:contracts  # ✅ OK
```

---

## 13. Risques restants

| Risque | Mitigation A3 |
|--------|---------------|
| Legacy non connecté | Adaptateur pilote DecisionEngine |
| AnonymizationGate non implémentée | Sprint UL-2 |
| proposalTrace runtime absent | Store in-memory A3 |
| Event bus runtime absent | Spec + envelope déjà typé |

---

## 14. Dette

| | |
|-|-|
| **Créée** | Aucune dette runtime — couche types only |
| **Évitée** | Pas de connexion legacy, pas de big bang, pas de feature UX |

---

## 15. Recommandations A3

1. Adaptateur legacy pilote (DecisionEngine ou PlanningContextEngine)
2. Runtime proposalTrace minimal
3. Implémenter AnonymizationGate (infra)
4. CI : `verify:contracts` dans pipeline
5. Scission `planningEngine` selon migration-map order

---

## 16. Confirmation

- ✅ Aucune logique métier implémentée
- ✅ Aucune migration Supabase
- ✅ Aucune table Universal Learning
- ✅ Aucun commit / merge / déploiement (arrêt pour validation humaine)

---

*Sprint A2 Report — Équilibre IA — 18 juillet 2026*
