# Rapport — Universal Learning Engine

> **Évolution architecture Dual Memory**  
> Date : 2026-07-18  
> Action : **documentation uniquement** — aucun code, aucune implémentation

---

## 1. Synthèse

Introduction officielle du **deuxième niveau de mémoire** : **Personal Memory** (privée, par foyer) et **Universal Learning** (globale, anonymisée). Le projet apprend des **connaissances**, jamais des **personnes**.

---

## 2. Documents créés (4)

| Fichier | Rôle |
|---------|------|
| [`Docs/UNIVERSAL_LEARNING_ENGINE.md`](./UNIVERSAL_LEARNING_ENGINE.md) | Référence officielle — principe, règles, intégration, exemples |
| [`architecture/contracts/universal-learning-engine.md`](../architecture/contracts/universal-learning-engine.md) | Contrat moteur UniversalLearningEngine |
| [`architecture/adr/0003-dual-memory-universal-learning.md`](../architecture/adr/0003-dual-memory-universal-learning.md) | ADR Dual Memory |
| [`Docs/UNIVERSAL_LEARNING_REPORT.md`](./UNIVERSAL_LEARNING_REPORT.md) | Ce rapport |

---

## 3. Documents modifiés (10)

| Fichier | Modification |
|---------|--------------|
| `Docs/EQUILIBRE_AI_CONSTITUTION.md` | v1.3.0 — ch. 14 Dual Memory ; **ch. 22 Apprentissage universel** |
| `Docs/ARCHITECTURE_GUARDIAN.md` | v1.1.0 — **Q11** Personal vs Universal ; checklist Dual Memory |
| `Docs/ROBOT_QA_CHARTER.md` | v1.3.0 — **§3.1 contrôle permanent anti-PII** |
| `architecture/contracts/00-index.md` | Moteur #19 ; section Dual Memory ; règle transverse #7 |
| `architecture/contracts/personal-language-memory-engine.md` | Note frontière Personal Memory vs Universal Learning |
| `architecture/contracts/diagram-pipeline-global.md` | Canal Dual Memory + graphe UniversalLearningEngine |
| `architecture/templates/architecture-review.template.md` | Q11 ajoutée |
| `architecture/contracts/README.md` | Référence moteur #19 |
| `architecture/adr/README.md` | ADR-0003 indexé |
| `README.md` | Lien UNIVERSAL_LEARNING_ENGINE |
| `Docs/ROADMAP.md` | Phase UL-0 ✅ |

---

## 4. Nouveaux principes ajoutés

### Principe officiel — APPRENTISSAGE UNIVERSEL (Constitution ch. 22)

> Équilibre IA s'améliore grâce à l'expérience collective. Mais les données personnelles demeurent toujours privées.
>
> Le projet apprend des connaissances. Jamais des personnes.

### Dual Memory

| Niveau | Règle clé |
|--------|-----------|
| **Personal Memory** | Ne quitte jamais le foyer |
| **Universal Learning** | Uniquement connaissances généralisables |
| **Frontière** | **Mélange interdit** |

### Pipeline validation Universal (5 + humain)

Anonymisation → Généralisation → Vérification → Non-identifiabilité → Utilité universelle → Validation humaine

---

## 5. Impacts sur l'architecture

### Nouveau moteur (#19)

**UniversalLearningEngine** — consommé par IntentEngine et ReasoningEngine ; **aucune** lecture Personal Memory.

### Intégration (sans modifier implémentation)

```
ConversationEngine
  ├─ PersonalLanguageMemoryEngine  → Personal Memory
  ├─ UniversalLearningEngine       → Universal Learning (hints)
  └─ IntentEngine ← hints des deux (flux séparés)

HumanModelEngine / HouseholdEngine → Personal Memory ONLY

ReasoningEngine ← UniversalStrategy[]

KnowledgeEngine → DISTINCT (web externe, pas apprentissage collectif)
```

### Distinction importante

| Moteur | Rôle |
|--------|------|
| PersonalLanguageMemoryEngine | Expression **personnelle** par membre |
| UniversalLearningEngine | Pattern **collectif** généralisé (« rincé » → fatigue) |
| KnowledgeEngine | Faits **externes** (météo, lieux) |

### Pipeline cible : 20 moteurs figés (ADR-0005)

---

## 6. Risques détectés

| # | Risque | Gravité | Mitigation |
|---|--------|---------|------------|
| R1 | Fuite PII via agrégation mal anonymisée | **Critique** | Gate + validation §7 + Robot QA UL-1–8 |
| R2 | Confusion PLM vs ULE | Haute | Doc §10 + Q11 |
| R3 | `colloquialPatternRegistry` hardcodé sans gate | Moyenne | Migration progressive vers ULE validé |
| R4 | Tentative « amélioration » exportant living memory | **Critique** | Q11 REJET + ADR requis |
| R5 | Ré-identification par corrélation rare | Haute | Seuil volume + validation humaine |
| R6 | Implémentation prématurée sans spec gate | Haute | UL-2 avant UL-3 (ROADMAP) |

---

## 7. Recommandations avant implémentation

1. **Validation humaine** du principe Dual Memory et ADR-0003.
2. **Sprint UL-2** (après A2) : spec `AnonymizationGate` + types TypeScript — **pas de collecte réelle**.
3. Ne **jamais** connecter `user_language_expressions` ou `profile_facts` directement à ULE.
4. Ajouter scénarios QA `QA-MEM-015`, `QA-MEM-016`, `QA-PRV-015` à la matrice.
5. Audit code futur : tout `export`/`sync`/`aggregate` → revue Q11 obligatoire.
6. Stores **physiquement séparés** en base (table/schema dédié universal_knowledge).
7. Logging : jamais de PII dans logs du pipeline Universal.

---

## 8. Architecture Guardian

| Critère | Verdict |
|---------|---------|
| Respect Constitution ch. 22 | ✅ |
| Q11 intégrée | ✅ |
| Mélange interdit documenté | ✅ |
| Intégration moteurs sans conflit | ✅ |
| **Statut** | **✅ APPROVED** (documentation) |

---

## 9. Conclusion

Le **Universal Learning Engine** est officiellement parte de l'architecture Équilibre IA — **documenté, contraté, gouverné** — sans une ligne de code métier.

**Prochaine étape recommandée :** validation humaine, puis Sprint UL-2 (spec AnonymizationGate) après Sprint A2 (interfaces TypeScript).

---

*Rapport Universal Learning — 18 juillet 2026*
