# EPIC 4B — Rapport de certification Human Model

**Date :** 2026-07-20  
**Run ID Guardian :** `2026-07-20T10-38-06-760Z`  
**Statut :** Certification fonctionnelle **OK** — verdict global **conditionnel** (Guardian historique 14/15)

---

## Verdict

| Critère | Résultat |
|---------|----------|
| Matrice 11 règles couverte | ✅ |
| Profils Human Model A–I | ✅ |
| Garde anti-recalcul | ✅ |
| E2E EPIC 4B (flags ON) | ✅ **6/6** |
| Build | ✅ |
| Tests unitaires complets | ✅ **1152/1152** |
| Guardian historique | ⚠️ **14/15** (snapshot Foyer) |

### Verdict final : **EPIC 4B FUNCTIONALLY CERTIFIED — GUARDIAN SNAPSHOT PENDING**

Le Human Model Engine est certifié fonctionnellement (règles, contrat, anti-recalcul, E2E feature).  
Le verdict **EPIC 4B CERTIFIED** complet attend la remise à vert du Guardian historique (1 snapshot visuel Foyer).

---

## 1 — Matrice des 11 règles

Fichier : `src/ai/humanModelFoundation/rules/ruleMatrix.test.ts`

| Règle | Données suffisantes | Données absentes | Bas | Intermédiaire | Élevé | Explication | Confiance | Déterministe |
|-------|---------------------|------------------|-----|---------------|-------|-------------|-----------|--------------|
| FatigueRule | ✅ | ✅ | ✅ great | ✅ okay+3 blocs | ✅ exhausted+charge | ✅ | ✅ | ✅ |
| StressRule | ✅ | ✅ | ✅ low | ✅ medium | ✅ high+stressé | ✅ | ✅ | ✅ |
| MentalLoadRule | ✅ | ✅ (défaut léger) | ✅ | ✅ normale | ✅ forte | ✅ | ✅ | ✅ |
| AvailabilityRule | ✅ | ✅ | ✅ bonne | ✅ | ✅ faible | ✅ | ✅ | ✅ |
| FocusRule | ✅ | ✅ null | — | — | ✅ bon / faible | ✅ | ✅ | ✅ |
| SleepRule | ✅ | ✅ null | ✅ bon | ✅ correct | ✅ insuffisant | ✅ | ✅ | ✅ |
| MotivationRule | ✅ | ✅ null | ✅ faible | — | ✅ bonne | ✅ | ✅ | ✅ |
| FamilyPressureRule | ✅ | ✅ solo | ✅ faible | ✅ modérée | ✅ élevée | ✅ | ✅ | ✅ |
| GoalRule | ✅ | ✅ désactivé/vide | — | — | ✅ dominant | ✅ | ✅ | ✅ |
| ConcernRule | ✅ | ✅ null | — | ✅ tâches | ✅ brief | ✅ | ✅ | ✅ |
| CurrentStateRule | ✅ | — | — | ✅ agrégation | — | ✅ | ✅ | ✅ |

Utilitaires : `src/ai/humanModelFoundation/testing/ruleTestUtils.ts`  
Tests legacy conservés : `rules/rules.test.ts`

---

## 2 — Profils Human Model global (A–I)

Fichier : `src/ai/humanModelFoundation/engine/humanModelProfiles.test.ts`

| Profil | Description | Validé |
|--------|-------------|--------|
| A | Contexte riche, journée légère | ✅ |
| B | Contexte riche, journée très chargée | ✅ |
| C | Très peu de données | ✅ |
| D | Aucune donnée exploitable | ✅ |
| E | Données contradictoires | ✅ |
| F | Utilisateur avec enfants | ✅ |
| G | Utilisateur sans enfant | ✅ |
| H | Aucun objectif actif | ✅ |
| I | Plusieurs objectifs actifs | ✅ |

Vérifications transverses :
- Contrat `HumanModel` toujours valide
- Champs inconnus à `null` (jamais inventés)
- `missingData`, `confidence` ∈ [0,1], `lastUpdated` ISO
- Explications rattachées aux indicateurs
- **Aucune mutation** du contexte source (`structuredClone`)

---

## 3 — Garde anti-recalcul

Fichier : `src/ai/conversationFoundation/conversation/antiRecalcGuard.test.ts`

HumanModel **injecté volontairement opposé** au contexte brut (check-in `exhausted`, 10 blocs, 20 tâches, 4 enfants) :

| Dimension | Contexte brut | HumanModel injecté | Réponse respecte injecté |
|-----------|---------------|--------------------|-------------------------|
| Énergie | Très fatigué | Très reposé | ✅ |
| Motivation | Faible | Bonne | ✅ |
| Charge mentale | Forte | Légère | ✅ |
| Disponibilité | Faible | Bonne | ✅ |
| Pression familiale | Élevée | Faible | ✅ |
| Objectif dominant | Objectif brut | Objectif injecté | ✅ |
| État global | — | Label injecté | ✅ |

---

## 4 — E2E EPIC 4B (flags activés)

**Config :** `playwright.epic4b.config.ts`  
**Flags (serveur certification uniquement) :** `VITE_ASSISTANT_IA=true`, `VITE_HUMAN_MODEL=true`  
**Commande :** `npm run test:e2e:epic4b`

| # | Scénario | Desktop | Mobile | Résultat |
|---|----------|---------|--------|----------|
| A | Mon Profil IA — cartes, Pourquoi ?, missing | ✅ | ✅ (grille) | PASS |
| B | Assistant + fatigue HumanModel | ✅ | — | PASS |
| C | Données insuffisantes (Foyer B) | ✅ | — | PASS |
| D | Isolation William / Foyer B | ✅ | — | PASS |
| — | Setup personas | ✅ | — | PASS |

**Total EPIC 4B E2E : 6/6 PASS** (Run manuel `2026-07-20T10:30` avec serveur guardian + flags EPIC4B via `epic4bWebEnv`)

### Stabilité technique E2E
- Console Guardian : **0 erreur bloquante** sur scénarios EPIC4B
- Network Guardian : **0 réponse inattendue**
- Pas de `undefined`, `NaN`, `[object Object]` (regex avec bornes `\b` — faux positif « dominante » corrigé)
- Snapshots pleine page évités ; ciblage `data-testid="ai-profile-grid"`

---

## 5 — Guardian historique

**Commande :** `npm run quality-guardian`  
**Run :** `2026-07-20T10-38-06-760Z`

| Métrique | Valeur |
|----------|--------|
| PASS | **14** |
| FAIL | **1** |
| SKIP critique | **0** |

### Échec

- `household/overview.spec.ts` — snapshot `household-overview.png`  
  Hauteur attendue 2246px → reçue 2467px (Δ ~221px, ratio diff ~7 %)  
  **Non lié au Human Model** — régression visuelle page Foyer (contenu dynamique / layout).

### Console (allowlistées / non bloquantes)
- Duplicate React keys (Daily Brief recommandations) — allowlist existante
- `Failed to fetch` au logout — allowlist logout

---

## 6 — Tests unitaires & build

| Étape | Résultat |
|-------|----------|
| `npm run test:human-model` | **60/60 PASS** |
| `npm test` | **1152/1152 PASS** |
| `npm run build` | **OK** |

---

## 7 — Fichiers ajoutés / modifiés (certification)

| Fichier | Rôle |
|---------|------|
| `src/ai/humanModelFoundation/rules/ruleMatrix.test.ts` | Matrice 11 règles |
| `src/ai/humanModelFoundation/engine/humanModelProfiles.test.ts` | Profils A–I |
| `src/ai/humanModelFoundation/testing/ruleTestUtils.ts` | Helpers certification |
| `src/ai/conversationFoundation/conversation/antiRecalcGuard.test.ts` | Anti-recalcul |
| `tests/e2e/humanModel/certification.spec.ts` | E2E A–D |
| `playwright.epic4b.config.ts` | Config Playwright dédiée |
| `scripts/load-epic4b-env.mjs`, `scripts/dev-epic4b.mjs` | Env certification |
| `package.json` | `test:human-model`, `test:e2e:epic4b` |

**Production :** defaults inchangés (`VITE_HUMAN_MODEL=false`, `VITE_ASSISTANT_IA=false` dans le code).

---

## 8 — Limites connues

1. **Guardian snapshot Foyer** — à stabiliser (scope `.household-overview-layout` ou baseline régénérée).
2. **WebServer Playwright EPIC4B** — sur Windows, démarrage auto parfois lent ; utiliser `PLAYWRIGHT_SKIP_WEBSERVER=1` + `node scripts/dev-guardian.mjs` avec `epic4bWebEnv` si besoin.
3. Règles heuristiques — pas de persistance snapshot HumanModel.
4. Scenario C dépend du persona API `rlsHouseholdB` (service role).

---

## 9 — Actions recommandées avant EPIC 4C

1. Régénérer le baseline `household-overview.png` (scope stable) → Guardian **15/15**.
2. Intégrer `npm run test:e2e:epic4b` dans CI certification (job séparé du Guardian historique).
3. Valider manuellement Mon Profil IA avec check-in du jour pour enrichir les cartes stress/sommeil.

---

## Synthèse exécutive

Le **Human Model Engine** remplit les critères de certification **fonnelle** :
- seule source d'interprétation (preuve anti-recalcul),
- contrat robuste avec données partielles,
- transparence UI validée en E2E,
- isolation multi-utilisateur confirmée.

**Prochaine gate :** remettre le Guardian historique à **15/15** pour le sceau **EPIC 4B CERTIFIED** complet.
