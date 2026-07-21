# Revue Architecture Guardian — Sprint A2 Contrats TypeScript

> Date : 2026-07-18  
> Feature : Sprint A2 — `src/ai/contracts/` (20 moteurs figés)  
> Statut : **APPROVED WITH RECOMMENDATIONS**

---

## 1. Objet

Validation de la couche **interfaces TypeScript** correspondant aux 20 contrats moteurs figés (ADR-0005), sans logique métier, sans migration legacy, sans modification UX.

---

## 2. Verdict

### **APPROVED WITH RECOMMENDATIONS**

| Critère | Résultat |
|---------|----------|
| 20 interfaces moteurs | ✅ |
| Gel architecture ADR-0005 | ✅ |
| ADR-0004 accepted | ✅ |
| ADR-0006 frontières | ✅ |
| Dual Memory typage | ✅ |
| proposalTrace | ✅ |
| Outcome events | ✅ |
| AnonymizationGate (infra) | ✅ |
| Tests structurels | ✅ 888 tests pass |
| Aucune logique métier | ✅ |
| Legacy connecté | ✅ Non (volontaire) |

---

## 3. Architecture Score — Sprint A2

| Dimension | Score | Commentaire |
|-----------|-------|-------------|
| Complétude contrats | 98 | 20/20 moteurs + registry |
| Frontières Dual Memory | 97 | Personal ≠ Universal typé |
| proposalTrace | 95 | Minimal refs — bon |
| Typage | 96 | Branded IDs, Result, errors |
| Testabilité | 95 | contracts.test + boundaries |
| Migration readiness | 90 | migration-map documenté |
| Dette évitée | 94 | Pas de connexion legacy |
| **Global pondéré** | **96** | |

---

## 4. Q1–Q11 (synthèse)

| # | Statut |
|---|--------|
| Q1 Constitution | ✅ |
| Q2 Utilité | ✅ Fondation migration |
| Q3 Moteur existant | ✅ 20 contrats — pas de 21ᵉ |
| Q4 Dette | ✅ Dette évitée |
| Q5 Generalisable | ✅ |
| Q6 Temps → vie | ✅ |
| Q7 Lois | ✅ |
| Q8 Human Model | ✅ behaviorSignals typés |
| Q9 Foyer | ✅ HouseholdId branded |
| Q10 Planning First | ✅ ADR-0006 |
| Q11 Dual Memory | ✅ Gate + routes typées |

---

## 5. Recommandations A3

| # | Recommandation | Priorité |
|---|----------------|----------|
| R1 | Stubs adaptateurs legacy (1 moteur pilote : DecisionEngine) | Haute |
| R2 | Implémenter AnonymizationGate (infra) | Critique avant ULE write |
| R3 | proposalTrace store minimal (in-memory dev) | Haute |
| R4 | Event bus spec + envelope runtime | Moyenne |
| R5 | Scission planningEngine → Constraint/Availability/Scheduler | Haute |
| R6 | ESLint/oxlint plugin import boundaries CI | Moyenne |

---

## 6. Recommandation gel

**Architecture 20 moteurs : FIGÉE** (ADR-0005).  
**Contrats TypeScript v1.0.0 : FIGÉS** — patches mineurs autorisés, breaking changes → ADR.

**GO Sprint A3** — adaptateurs legacy pilote, sous validation humaine.

---

*Architecture Guardian — Sprint A2 — 18 juillet 2026*
