> **Snapshot historique** — revue pré-OutcomeObservationEngine (#20). Gel final : ADR-0005.

# Revue Architecture Guardian — Pré-implémentation (Revue CTO)

> Date : 2026-07-18  
> Feature : Complétude architecture cerveau — 19 moteurs + boucle rétroaction  
> Statut : **APPROVED WITH RECOMMENDATIONS** — validation humaine 2026-07-18

---

## 1. Objet de la revue

Dernière revue d'architecture **avant Sprint A2** (interfaces TypeScript). Aucun code. Question centrale :

> *L'architecture du cerveau d'Équilibre IA est-elle réellement complète ?*

---

## 2. Verdict Architecture Guardian

### **APPROVED WITH RECOMMENDATIONS**

| Critère | Résultat |
|---------|----------|
| Pipeline forward (compréhension → action) | ✅ Complet et cohérent |
| Dual Memory (Personal / Universal) | ✅ Bien défini (ADR-0003) |
| Boucle rétroaction (observation → apprentissage) | ❌ **Incomplète** — moteur #20 requis |
| Viabilité 10 ans | ⚠️ Conditionnelle à #20 + 3 clarifications |
| Sprint A2 | ✅ **GO avec réserves** |

### Justification du verdict (non APPROVED pur)

L'architecture forward est **excellente** (score 94 Sprint A1). Toutefois, une **capacité fondamentale** manque pour une plateforme qui doit « devenir plus intelligente avec le temps » : **l'observation des résultats et la rétroaction structurée**.

Sans **OutcomeObservationEngine** (#20) :
- UniversalLearningEngine reste **write-dead** ;
- HumanModelEngine a des entrées `behaviorSignals[]` **orphelines** ;
- Aucune mesure d'efficacité des recommandations ;
- L'IA ne peut pas apprendre de **ses propres décisions** via leurs outcomes.

Ce n'est **pas** une fonctionnalité produit — c'est une **capacité cognitive** aussi fondamentale que Reasoning ou Memory.

### Justification (non NOT APPROVED)

- Les 19 moteurs existants sont **correctement découpés** pour le forward path ;
- Aucune refonte majeure requise — **un** moteur additionnel suffit ;
- Les chevauchements identifiés sont **documentés** avec plans de résolution ;
- La dette legacy est **connue** et adressable par migration progressive (ADR-0001).

---

## 3. Questions obligatoires (Q1–Q11)

| # | Question | Statut | Commentaire |
|---|----------|--------|-------------|
| Q1 | Constitution | ✅ | Aligné mission, Lois 1–8, Dual Memory ch. 22 |
| Q2 | Utilité réelle | ✅ | Complétude cerveau — prérequis 10 ans |
| Q3 | Moteur existant ? | ❌→✅ | Gap identifié ; OutcomeObservationEngine proposé (#20) |
| Q4 | Dette technique | ⚠️ | Legacy mesh ; #20 **réduit** dette future feedback |
| Q5 | Generalisable | ✅ | Outcomes routés Q11 ; pas de cas fondateur |
| Q6 | Temps → vie | ✅ | Feedback améliore pertinence sans surcharger |
| Q7 | Lois fondamentales | ✅ | Loi 5 confidence alimentée par outcomes |
| Q8 | Human Model | ✅ | behaviorSignals[] enfin producteur identifié |
| Q9 | Foyer | ✅ | Scope HouseholdEngine respecté |
| Q10 | Planning First | ✅ | Outcomes planning distincts de recommandations |
| Q11 | Personal / Universal | ✅ | Routage explicite OO ; gate obligatoire vers ULE |

---

## 4. Architecture Score (revue CTO)

| Dimension | Score | Commentaire |
|-----------|-------|-------------|
| Vision | 97 | Forward path + Dual Memory clairs |
| Complétude | **82** | Boucle rétroaction absente (-18) |
| Architecture | 93 | DAG forward ; feedback à ajouter |
| Interfaces | 95 | 19 contrats solides ; #20 proposé |
| Découplage | 88 | 3 clusters overlap legacy |
| Évolutivité 10 ans | **85** | Conditionnel à #20 + event bus |
| Sécurité / Privacy | 96 | Q11 + gate ; OO renforce |
| **Global pondéré** | **89** | APPROVED WITH RECOMMENDATIONS |

*Score post-#20 estimé : **94–95** (aligné Sprint A1 + boucle fermée)*

---

## 5. Recommandations obligatoires avant gel architecture

| # | Recommandation | Priorité | Sprint |
|---|----------------|----------|--------|
| R1 | Adopter **OutcomeObservationEngine** (#20) + ADR-0004 | **Critique** | Avant / parallèle A2 |
| R2 | Contracter **AnonymizationGate** (infra, pas moteur #21) | **Critique** | UL-2 |
| R3 | Standardiser **proposalTrace** sur ActionProposal / Reasoning / Recommendation | Haute | A2 |
| R4 | ADR **Scheduler ↔ DecisionEngine** ordering canonique | Haute | A2 |
| R5 | Règles d'arbitrage **PLM vs IntentEngine** | Moyenne | A2 |
| R6 | Règles leadership **Reasoning vs Recommendation vs Scheduler** | Moyenne | A2 |
| R7 | Schéma **event bus** global (idempotence, ordering) | Moyenne | A2 |
| R8 | Contract **ActionExecutionLayer** (hors cerveau, événements standard) | Haute | A2 |

---

## 6. Gel architecture — recommandation Guardian

| Question | Réponse |
|----------|---------|
| Figer définitivement à 19 moteurs ? | **NON** |
| Figer à 20 moteurs après validation ADR-0004 ? | **OUI** — avec R2–R8 documentées |
| Lancer Sprint A2 ? | **OUI** — interfaces forward path en parallèle de R1/R3 |

---

## 7. Validation humaine requise

- [ ] Acceptation **OutcomeObservationEngine** (#20)
- [ ] Acceptation ADR-0004 (statut `proposed` → `accepted`)
- [ ] Priorisation R1–R8 dans ROADMAP

---

*Architecture Guardian — Revue pré-implémentation v1.0 — 18 juillet 2026*
