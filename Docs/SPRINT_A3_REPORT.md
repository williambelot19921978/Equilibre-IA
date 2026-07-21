# Sprint A3 — Premier adaptateur de migration

> **Date :** 18 juillet 2026  
> **Statut :** ✅ Terminé  
> **Périmètre :** DecisionEngine (#12) — cohabitation legacy + contrat

---

## 1. Moteur choisi

**DecisionEngine** (`decision-engine`, pipeline #12)

---

## 2. Justification — classement des candidats

| Rang | Moteur | Isolation | Risque | Représentativité | Verdict |
|:----:|--------|:---------:|:------:|:----------------:|---------|
| **1** | **DecisionEngine** | ★★★★★ (1 seul importeur : `planningEngine`) | ★★★★★ (~210 LOC, pur, sans DB) | ★★★★★ (frontière Scheduler→Decision, ADR-0006) | **Retenu** |
| 2 | OutcomeObservationEngine | ★★★★☆ (4 importeurs) | ★★★★☆ | ★★★☆☆ (pipeline outcomes pas encore câblé) | Second pilote |
| 3 | HouseholdEngine | ★★★☆☆ (~9 importeurs) | ★★★★☆ | ★★★☆☆ | Contexte foyer plus large |
| 4 | IntentEngine | ★★★☆☆ (NLP mesh) | ★★★☆☆ | ★★★★☆ | Trop couplé à conversationEngine |
| 5 | PlanningContextEngine | ★☆☆☆☆ (~30 importeurs via memoryEngine) | ★☆☆☆☆ | ★★★★★ | Trop risqué pour un premier pilote |

**Critères retenus :**

1. **Isolation** — `validatePlannedBlock` n'est appelé que depuis `planningEngine.ts`.
2. **Risque minimal** — validation déterministe, pas d'état session, pas de Supabase.
3. **Représentativité** — démontre le pattern complet : contrat → impl → adaptateur → port → feature flag → shadow compare → tests parity.
4. **Alignement doc** — pilot explicitement recommandé dans SPRINT_A2_REPORT §15 et ADR-0006.

---

## 3. Architecture implémentée

```
planningEngine
      │
      ▼
decisionEnginePort.validatePlannedBlockViaPort()
      │
      ├── legacyValidatePlannedBlock()     ← autorité si flag OFF
      ├── validatePlannedBlockCore()        ← candidat contract-compliant
      └── shadowCompare()                   ← journalise les écarts (DEV)
```

**Feature flag :** `VITE_USE_NEW_DECISION_ENGINE` (défaut : `false`)

| Flag | Comportement |
|------|--------------|
| `false` | Legacy = autorité de référence |
| `true` | Core contract = autorité |

Shadow comparison **toujours** exécutée — écarts journalisés sans casser l'app.

---

## 4. Fichiers créés

| Fichier | Rôle |
|---------|------|
| `src/ai/engines/decision/decisionEngineCore.ts` | Logique validation (alignée legacy) |
| `src/ai/engines/decision/contractDecisionEngine.ts` | `IDecisionEngine` conforme |
| `src/ai/engines/decision/index.ts` | Barrel export |
| `src/ai/engines/decision/decisionEngine.test.ts` | Tests parity + contrat |
| `src/ai/adapters/decision/types.ts` | Types shadow compare |
| `src/ai/adapters/decision/shadowCompare.ts` | Comparaison + journalisation |
| `src/ai/adapters/decision/legacyDecisionEngineAdapter.ts` | Legacy → `IDecisionEngine` |
| `src/ai/adapters/decision/decisionEnginePort.ts` | Port unique pour planningEngine |
| `src/ai/adapters/decision/decisionEnginePort.test.ts` | Tests port + flag |
| `src/ai/adapters/decision/index.ts` | Barrel export |

---

## 5. Fichiers modifiés

| Fichier | Modification |
|---------|--------------|
| `src/ai/planningEngine.ts` | `validatePlannedBlock` → `validatePlannedBlockViaPort` |
| `src/config/featureFlags.ts` | `isNewDecisionEngineEnabled()` |
| `.env.example` | `VITE_USE_NEW_DECISION_ENGINE=false` |
| `src/ai/contracts/legacy/migration-map.ts` | `DECISION_ENGINE_ADAPTER` status `wired` |

**Non modifiés (volontairement) :**

- `src/ai/decisionEngine.ts` — legacy intact, référence comportementale
- Contrats TypeScript (`src/ai/contracts/`)
- ADR
- UX

---

## 6. Tests

| Suite | Tests | Résultat |
|-------|:-----:|:--------:|
| `decisionEngine.test.ts` | 13 | ✅ |
| `decisionEnginePort.test.ts` | 3 | ✅ |
| **Suite globale** | **904** (+16) | ✅ |

**Scénarios couverts :**

- Parity `validatePlannedBlockCore` vs legacy (valide, réveil, chevauchement, spiritualité, fill ratio)
- Parity `validateDayPlanCore` vs legacy
- `IDecisionEngine.validateProposal` / `requiresConfirmation` / `validateDayPlan`
- Port : flag off = legacy, flag on = candidat, shadow log vide si match
- Boundary : engines layer n'importe pas planningEngine/lifeEngine

---

## 7. Couverture

| Commande | Résultat |
|----------|:--------:|
| `npm test` | ✅ 904 tests |
| `npm run build` | ✅ |
| `npm run lint` | ✅ (warnings préexistants) |
| `npm run verify:contracts` | ✅ |

---

## 8. Résultats de comparaison legacy vs nouveau

| Opération | Écarts observés | Explication |
|-----------|:---------------:|-------------|
| `validatePlannedBlock` | **0** | Core = copie alignée du legacy |
| `validateDayPlan` | **0** | Même algorithme cumulatif |

**Shadow log :** vide en conditions nominales (tests + exécution standard).

En cas d'écart futur : `console.warn("[DecisionEngine shadow]", …)` en DEV + entrée dans `getShadowComparisonLog()`.

---

## 9. Architecture Guardian — revue

| Critère | Verdict | Détail |
|---------|:-------:|--------|
| Respect des contrats | ✅ | `ContractDecisionEngine implements IDecisionEngine` ; contrats non modifiés |
| Absence de dépendance circulaire | ✅ | DAG : port → core/legacy ; core n'importe pas planningEngine |
| Migration progressive | ✅ | Legacy coexiste ; flag bascule sans toucher le reste |
| Qualité adaptateur | ✅ | Port unique, shadow compare, legacy adapter typé |
| Suppression legacy future | ✅ | Une fois validé : `decisionEngine.ts` → delete ; port simplifié |

**Réserve documentée :** `IDecisionEngine.validateDayPlan(plan, constraints)` au niveau contrat opère sur `DayPlan` minimal (sans `PlanningContext` legacy). La validation bloc production passe par le port + core. Gap connu — sera comblé quand PlanningContextEngine migrera.

---

## 10. Dette supprimée

| Dette | Action |
|-------|--------|
| Aucun adaptateur wired (A2) | Premier adaptateur `wired` dans migration-map |
| Validation directe sans port | `planningEngine` passe par port feature-flaggé |
| Pas de shadow compare | Infrastructure shadow en place, réutilisable A4+ |

---

## 11. Dette restante

| Dette | Priorité | Sprint cible |
|-------|:--------:|:------------:|
| `decisionEngine.ts` legacy encore présent | Basse | Après validation prod flag ON |
| Validation inline dispersée dans `planningEngine` | Moyenne | ConstraintEngine / scission planning |
| `validateDayPlan` contrat vs legacy context gap | Moyenne | PlanningContextEngine (A4+) |
| 19 autres moteurs non migrés | — | A4–A20 |

---

## 12. Prochaines migrations recommandées

| Ordre | Moteur | Justification |
|:-----:|--------|---------------|
| **A4** | OutcomeObservationEngine | Isolé, I/O simple, complète la boucle Observer |
| **A5** | HouseholdEngine | `familyContextEngine.ts` déjà testé, cycleRisk low |
| **A6** | IntentEngine | NLP entry point, prépare ConversationEngine |
| **A7+** | PlanningContext → Constraint → Availability → Scheduler | Scission monolithe `planningEngine` (replacementOrder 1) |

---

## 13. Activation manuelle

```env
VITE_USE_NEW_DECISION_ENGINE=true
```

Redémarrer Vite (`http://localhost:5173`). Comportement attendu identique — le flag bascule l'autorité vers le core contract-compliant.

---

*Sprint A3 — Premier adaptateur de migration — Équilibre IA*
