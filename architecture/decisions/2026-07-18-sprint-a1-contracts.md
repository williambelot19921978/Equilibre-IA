> **Snapshot historique Sprint A1** — architecture de référence actuelle : 20 moteurs (ADR-0005, Constitution v1.4).

# Revue Architecture Guardian — Sprint A1 Contrats

> Date : 2026-07-18  
> Feature : Sprint A1 — Contrats moteurs cerveau IA  
> Statut : **approved-with-reserves**

---

## 1. Description

Définition documentaire des **18 contrats moteurs** (15 pipeline Constitution + SchedulerEngine + NotificationEngine + scissions proposées) sans implémentation TypeScript ni modification de `src/`.

---

## 2. Dix questions obligatoires

| # | Question | Statut | Commentaire |
|---|----------|--------|-------------|
| 1 | Respecte la Constitution ? | ✅ | Aligné ch. 13, Planning First, Lois 1–8 |
| 2 | Réellement utile ? | ✅ | Fondation cerveau — prérequis migration |
| 3 | Moteur existant réutilisable ? | ✅ | Mapping explicite code → contrat |
| 4 | Crée de la dette technique ? | ✅ | Réduit dette — documente scissions nécessaires |
| 5 | Generalisable (universalité) ? | ✅ | HouseholdEngine, pas de hardcode |
| 6 | Optimiser temps → améliorer vie ? | ✅ | Availability avant Recommendation |
| 7 | Lois fondamentales ? | ✅ | Loi 4 explication, Loi 5 confidence, Loi 6 contrôle |
| 8 | Human Model ? | ✅ | HumanModelEngine dédié |
| 9 | Modèle Foyer ? | ✅ | HouseholdEngine centrale |
| 10 | Planning First ? | ✅ | Gate Knowledge + Recommendation |

---

## 3. Checklist architecture

| Critère | Statut | Notes |
|---------|--------|-------|
| Vision | ✅ | Cerveau = architecture, pas features |
| Constitution | ✅ | 15 composants + scissions justifiées |
| Architecture | ✅ | DAG cible sans cycles |
| Réutilisation | ✅ | Mappe moteurs existants |
| Dette technique | ⚠️ | Legacy mesh documentée — migration requise |
| Interfaces | ✅ | 18 contrats complets |
| Modularité | ✅ | Responsabilités séparées |
| Performance | ✅ | Pas d'impact (docs only) |
| Sécurité | ✅ | DecisionEngine + permissions |
| Testabilité | ✅ | Contrats testables unitairement |
| Extensibilité | ✅ | Recommendation strategies, plugins |
| Impact UX | ✅ | NaturalResponseEngine unifié |
| Impact Planning | ✅ | Scheduler/Constraint/Availability séparés |
| Impact Human Model | ✅ | Scission memoryEngine |
| Impact Foyer | ✅ | HouseholdEngine |
| Impact Robot QA | ✅ | Scénarios mappables par moteur |

---

## 4. Vérifications Architecture Guardian

| Vérification | Résultat |
|--------------|----------|
| Aucune responsabilité dupliquée (cible) | ✅ Contrats distincts ; overlaps legacy documentés |
| Aucune dépendance circulaire (cible) | ✅ DAG défini ; 3 cycles legacy identifiés |
| Interfaces cohérentes | ✅ Entrées/sorties alignées entre moteurs |
| Architecture extensible | ✅ Plugins Recommendation, events bus |
| Architecture modulaire | ✅ 18 moteurs bounded |
| Respect Constitution | ✅ |

---

## 5. Architecture Score

| Dimension | Score | Commentaire |
|-----------|-------|-------------|
| Vision | 98 | Pipeline optimiser temps → améliorer vie |
| Architecture | 94 | DAG clair ; legacy mesh à migrer |
| Interfaces | 97 | 18 contrats complets |
| Réutilisation | 92 | Mappe existant ; scissions nécessaires |
| Dette technique | 90 | Documente dette ; ne l'augmente pas |
| Maintenabilité | 96 | Contrats + ADR + diagramme |
| Extensibilité | 95 | Universalité, plugins |
| **Global pondéré** | **94** | |

**Seuil :** ≥ 90 → **GO** pour livrable Sprint A1 (documentation)

---

## 6. ADR

- [x] ADR-0001 — Pipeline interfaces first (existant)
- [x] ADR-0002 — Architecture cerveau 18 moteurs (nouveau)

---

## 7. Recommandation

- [x] **GO** — Livrable Sprint A1 (contrats documentaires)
- [ ] GO AVEC RÉSERVES — pour implémentation TypeScript (Sprint A2)
- [ ] NO GO

**Réserve :** implémentation `src/ai/contracts/` requiert Sprint A2 dédié + tests par contrat.

---

## 8. Validation humaine

| Rôle | Décision |
|------|----------|
| Architecture Guardian | ✅ APPROVED (score 94) |
| Product / Owner | ⏳ En attente validation humaine |

---

*Architecture Guardian — Sprint A1*
