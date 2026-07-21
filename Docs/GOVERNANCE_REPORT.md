# Rapport de gouvernance — Équilibre IA

> **Troisième pilier : Architecture Guardian — juillet 2026**
>
> Date : 18 juillet 2026  
> Action : gouvernance uniquement — **aucun code métier, aucun sprint, aucun commit**

---

## 1. Synthèse

Le projet dispose désormais de **trois piliers de gouvernance** :

```
                    CONSTITUTION
                 (vision & lois)
                        │
        ┌───────────────┼───────────────┐
        ▼               ▼               ▼
 ARCHITECTURE      DÉVELOPPEMENT     ROBOT QA
  GUARDIAN          (humain)         (qualité)
   AVANT                              APRÈS
```

| Pilier | Document | Dossier | Statut |
|--------|----------|---------|--------|
| **1. Constitution** | `Docs/EQUILIBRE_AI_CONSTITUTION.md` v1.2.0 | — | ✅ Validé |
| **2. Architecture Guardian** | `Docs/ARCHITECTURE_GUARDIAN.md` v1.0.0 | `architecture/` | ✅ **Prêt** |
| **3. Robot QA** | `Docs/ROBOT_QA_CHARTER.md` v1.1.0 | `qa/` | ✅ Validé (orchestrateur à venir) |

**Architecture Guardian : ✅ Prêt pour utilisation** (gouvernance documentaire). Revues et scores manuels jusqu'à automatisation future.

---

## 2. Fichiers créés (18)

### Document principal

| Fichier | Rôle |
|---------|------|
| `Docs/ARCHITECTURE_GUARDIAN.md` | Charte complète — 10 questions, checklist, workflow, Architecture Score, ADR |

### Dossier `architecture/`

| Fichier | Rôle |
|---------|------|
| `architecture/README.md` | Guide du dossier gouvernance |
| `architecture/engines/README.md` | Cartographie moteurs pipeline IA |
| `architecture/contracts/README.md` | Specs contrats cibles (Sprint A1) |
| `architecture/interfaces/README.md` | Interfaces inter-composants |
| `architecture/decisions/README.md` | Index revues Architecture Guardian |
| `architecture/adr/README.md` | Index ADR |
| `architecture/adr/0000-adr-process.md` | ADR processus (accepted) |
| `architecture/adr/0001-pipeline-ia-interfaces-first.md` | ADR interfaces first (accepted) |
| `architecture/patterns/README.md` | Patterns approuvés et interdits |
| `architecture/templates/adr.template.md` | Template ADR |
| `architecture/templates/architecture-review.template.md` | Template revue + checklist |

### Rapport

| Fichier | Rôle |
|---------|------|
| `Docs/GOVERNANCE_REPORT.md` | Ce rapport |

---

## 3. Fichiers modifiés (6)

| Fichier | Modification |
|---------|--------------|
| `Docs/EQUILIBRE_AI_CONSTITUTION.md` | v1.2.0 — ch. 21 Architecture Guardian ; workflow officiel ; Architecture Score dans Health Score |
| `README.md` | Trois piliers + lien Architecture Guardian |
| `Docs/PROJECT_BIBLE.md` | Référence gouvernance 3 piliers |
| `Docs/AI_RULEBOOK.md` | Workflow Architecture Guardian avant dev |
| `Docs/ROADMAP.md` | Phase Gouvernance ✅ ; workflow officiel |
| `Docs/ROBOT_QA_CHARTER.md` | Architecture Score → Health Score |

---

## 4. Gouvernance obtenue

### Workflow officiel (figé)

```
Idée
  ↓
Architecture Guardian     ← 10 questions + checklist + Architecture Score + ADR si structurant
  ↓
Validation humaine
  ↓
Développement
  ↓
Tests
  ↓
Robot QA
  ↓
Rapport (qa/reports/)
  ↓
Validation
  ↓
Déploiement
```

### Checklist architecture (16 critères)

Vision, Constitution, Architecture, Réutilisation, Dette technique, Interfaces, Modularité, Performance, Sécurité, Testabilité, Extensibilité, Impact UX, Impact Planning, Impact Human Model, Impact Foyer, Impact Robot QA.

Template : `architecture/templates/architecture-review.template.md`

### Architecture Score (concept)

Dimensions : Vision, Architecture, Interfaces, Réutilisation, Dette technique, Maintenabilité, Extensibilité.

Seuils : ≥90 GO DEV · 75–89 GO AVEC RÉSERVES · <75 NO GO

Intégration future : **Health Score** du Robot QA.

### ADR (2 acceptés + processus)

| ADR | Titre | Statut |
|-----|-------|--------|
| 0000 | Processus ADR | accepted |
| 0001 | Pipeline IA interfaces first | accepted |

---

## 5. Architecture Guardian — prêt ou non ?

| Capacité | Statut |
|----------|--------|
| Charte et rôle définis | ✅ Prêt |
| 10 questions obligatoires | ✅ Prêt |
| Checklist standard | ✅ Prêt (template) |
| Workflow officiel intégré Constitution | ✅ Prêt |
| Dossier `architecture/` structuré | ✅ Prêt |
| ADR process + premier ADR métier | ✅ Prêt |
| Architecture Score (manuel) | ✅ Prêt (concept) |
| Architecture Score (automatisé) | 📋 Futur |
| Première revue feature documentée | ⏳ À la reprise (Sprint A1) |
| Contrats TypeScript `src/ai/contracts/` | ⏳ Sprint A1 |

**Verdict : ✅ Architecture Guardian prêt pour gouverner le Sprint A1.**

---

## 6. Recommandations avant Sprint A1

### Obligatoire avant la première ligne de code A1

1. **Revue Architecture Guardian** pour Sprint A1 using template :
   - `architecture/decisions/2026-XX-XX-sprint-a1-interfaces-pipeline.md`
2. **Validation humaine** explicite (go/no-go)
3. **Specs contrats** dans `architecture/contracts/` pour chaque interface cible
4. **ADR-0002** (optionnel mais recommandé) : `household-as-central-entity` si le sprint A1 touche au modèle foyer

### Ordre suggéré Sprint A1

| Étape | Action |
|-------|--------|
| 1 | Revue Architecture Guardian (10 questions + checklist) |
| 2 | Validation humaine |
| 3 | Rédiger specs contrats dans `architecture/contracts/` |
| 4 | Implémenter `src/ai/contracts/` (première implémentation autorisée) |
| 5 | Tests unitaires par contrat |
| 6 | Robot QA + rapport |
| 7 | Validation + décision déploiement |

### Ne pas faire avant A1

- Sprint F1 (neutralité plateforme) — en attente
- Orchestrateur Robot QA (`npm run qa:robot`) — peut paralléliser mais non bloquant pour A1
- Health Score automatisé — futur

### ADR anticipés pour A1–F2

| ADR | Sujet |
|-----|-------|
| 0002 | Foyer entité centrale — migration `partner_name` |
| 0003 | Universalité — retrait hardcodes fondateur |
| 0004 | Contrats pipeline — conventions TypeScript |

---

## 7. Hiérarchie documentaire (complète)

```
EQUILIBRE_AI_CONSTITUTION.md     ← Autorité suprême (Loi 8)
         │
    ┌────┴────┐
    ▼         ▼
ARCHITECTURE  ROBOT_QA_CHARTER
 GUARDIAN         │
    │             │
    ▼             ▼
architecture/   qa/
(ADR, revues)   (scénarios, rapports)
         │
         ▼
PROJECT_BIBLE · AI_RULEBOOK · ROADMAP
         │
         ▼
Code (src/) — uniquement après revue + validation humaine
```

---

## 8. Conclusion

La **gouvernance complète** du projet est en place :

- **Constitution** — *pourquoi* et *quoi* (vision, lois)
- **Architecture Guardian** — *comment* techniquement, *avant* le code
- **Robot QA** — *est-ce que ça marche*, *après* le code

Aucun développement métier n'a été lancé. Le projet est prêt à entrer dans le **Sprint A1** dès validation humaine explicite de la première revue Architecture Guardian.

---

*Rapport de gouvernance v1.0 — 18 juillet 2026*
