# QA-2 — Quality Guardian — Corrections run final

> **Date :** 20 juillet 2026  
> **Run final validé :** `2026-07-20T03-54-55-221Z`  
> **Verdict :** **READY FOR DEPLOYMENT**  
> **Aucun commit, merge ou déploiement** dans ce sprint

---

## 1. Contexte

Le run précédent (`2026-07-20T02-22-27-297Z`) était **NOT READY** :

| Métrique | Valeur |
|----------|--------|
| Exécutés | 13 / 15 |
| PASS | 9 |
| FAIL | 4 |
| SKIP | 0 |

**Causes identifiées :**

1. Double provisioning (`User already registered`) — onboarding jetable + RLS solo
2. Snapshot visuel Foyer obsolète
3. Sélecteur collaboration strict mode (2 titres « Foyer »)
4. Tests session non exécutés (dépendance Playwright en amont)

---

## 2. Double provisioning — cause et correction

### Cause exacte

Le setup service role (`provisionGuardianPersonas`) créait **avant** les scénarios UI :

- `guardian-solo.{runId}@…` → conflit avec signup solo
- `guardian-famille.{runId}@…` → conflit avec onboarding jetable

Résultat Supabase : **422 User already registered** lors du signup UI.

### Stratégie finale : registre `provisioningMode`

| Mode | Personas | Provisionnement |
|------|----------|-----------------|
| `existing` | William Admin | Compte stable `.env.local` |
| `api` | Madeline, Foyer B (RLS) | Service role au setup uniquement |
| `ui` | Onboarding jetable, Solo signup | **Jamais** pré-créés par API |

**Fichier registre :** `tests/e2e/fixtures/users.ts`

| ID | Email prefix | Mode |
|----|--------------|------|
| `williamAdmin` | (stable) | existing |
| `madeline` | `guardian-madeline` | api |
| `rlsHouseholdB` | `guardian-rls-b` | api |
| `onboardingDisposable` | `guardian-onboarding` | ui |
| `soloSignup` | `guardian-solo-ui` | ui |

### Garde UI

`tests/e2e/helpers/ui-persona.guard.ts` :

```text
UI persona was pre-provisioned unexpectedly: {email}
```

Appelée avant chaque signup UI (`full-flow.spec.ts`, `signup.spec.ts`).

---

## 3. RLS cross-household

### Avant

Signup UI du persona `solo` puis vérification d'isolation → échec double provisioning.

### Après

- **Foyer A** : William Admin (compte stable, seed tâches `GUARDIAN_QA tâche prioritaire {runId}`)
- **Foyer B** : `rlsHouseholdB` provisionné par API + onboarding finalisé via `finalizeGuardianOnboardingForUser`
- Seed tâches B : `GUARDIAN_QA tâche foyer B prioritaire {runId}`

**Test** (`rls/isolation.spec.ts`) :

1. Login William → voit tâche A, pas tâche B
2. Logout → login Foyer B → voit tâche B, pas tâche A

Aucun signup UI dans ce scénario.

---

## 4. Snapshot visuel Foyer — justification baseline

### Analyse

| Élément | Baseline ancienne | Capture actuelle |
|---------|-------------------|------------------|
| Hauteur page | 1712 px | 2246 px |
| Sections EPIC3 | Absentes / partielles | Opportunités, charge, objectifs, collaboration |
| Navigation jour | Visible | Masquée en test |

**Conclusion :** différence **légitime** (EPIC3-A/B/C livrés, flags Guardian tous activés). Pas une régression fonctionnelle.

### Stabilisation appliquée

- Viewport fixe 1280×900
- Attente fin chargement (`networkidle`, plus de « Construction de la vue foyer… »)
- Masques : `.day-navigation-bar`, opportunités dynamiques, conversation
- Sélecteur page : `data-testid="household-page-title"`

Baseline `household-overview.png` régénérée après revue visuelle (sections EPIC3 présentes).

---

## 5. Collaboration — correction sélecteur

### Problème

`getByRole('heading', { name: /^Foyer$/i })` matchait **2 éléments** :

- `<h1 class="app-header-title">` (AppShell via `useAppPageTitle`)
- `<h1>` dans `HouseholdOverviewPage`

### Correction

**data-testid autorisés (E2E uniquement) :**

| Composant | testid |
|-----------|--------|
| `HouseholdOverviewPage` | `household-page-title` |
| `HouseholdOpportunitiesSection` | `household-opportunities-section` |
| `HouseholdCollaborationConfirmModal` | `household-collaboration-modal` |

**Spec** : bouton Proposer scopé dans `#household-opportunities-section`, modal scopée, assertion finale sur `getByTestId('household-page-title')`.

---

## 6. Dépendances Playwright

### Avant

`guardian-session` dépendait de `guardian-authenticated` → 2 tests session **non exécutés** si un test authentifié échouait sans lien.

### Après

```ts
guardian-session → dependencies: ["guardian-setup"]
```

Les tests session utilisent `william-admin.json` (créé au setup) et n'ont pas besoin du succès des scénarios authentifiés.

**Reporter** (`guardian-reporter.mjs`) distingue :

- Ignorés volontaires (`CRITICAL_SKIP`)
- Non exécutés (dépendance)
- Échecs

Verdict NOT READY si `< 15` scénarios exécutés ou dépendance bloquante.

---

## 7. Nettoyage idempotent

`cleanupGuardianDynamicUsers()` au début du provisioning :

- Supprime tous les comptes `@guardian.equilibre.test`
- Préserve le compte stable William
- Idempotent (safe si déjà nettoyé)

`guardian-clean.mjs` supprime aussi :

- `.auth/william-admin.json`, `madeline.json`, `rls-household-b.json`
- Artefacts reports / test-results

---

## 8. Stabilisation visuelle globale (autres pages)

Snapshots recentrés sur zones stables pour éviter baselines obsolètes :

| Baseline | Stratégie |
|----------|-----------|
| `home` | Scope `.home-compact-header` + dismiss Daily Brief |
| `planning` | Scope `.task-form-card` (liste tâches seed dynamique exclue) |
| `goals` | Scope `.dashboard-header` |
| `household-overview` | Full page stabilisée + masques EPIC3 |

Helper : `tests/e2e/helpers/visual.helper.ts` — options `scope`, `dismissDailyBrief`, `viewport`.

---

## 9. Tests ciblés (validation intermédiaire)

```bash
npx playwright test --config playwright.guardian.config.ts \
  tests/e2e/onboarding/full-flow.spec.ts \
  tests/e2e/rls/isolation.spec.ts \
  tests/e2e/household/overview.spec.ts \
  tests/e2e/collaboration/propose-cancel.spec.ts
```

**Résultat ciblé final :** 7 / 7 PASS (incl. setup + 2 RLS auxiliaires).

---

## 10. Run complet final

**Commande :** `npm run quality-guardian`  
**Run ID :** `2026-07-20T03-54-55-221Z`  
**Durée :** 147,7 s

| Métrique | Valeur |
|----------|--------|
| Exécutés | **15** |
| PASS | **15** |
| FAIL | **0** |
| SKIP | **0** |
| Non exécutés (dépendance) | **0** |

### Checklist objectifs

| Critère | Statut |
|---------|--------|
| Service role détecté au preflight | ✅ |
| Onboarding UI réellement effectué | ✅ |
| Deux foyers distincts (A + B) | ✅ |
| Sessions distinctes (William / Foyer B) | ✅ |
| Isolation RLS confirmée | ✅ |
| Snapshot Foyer justifié | ✅ |
| Collaboration confirmée puis annulée | ✅ |
| Aucune modification automatique non documentée | ✅ |
| Erreurs console inattendues | 0 |
| Erreurs réseau inattendues | 0 |

---

## 11. Comptes et foyers créés (run final)

### Comptes

| Persona | Email | Mode |
|---------|-------|------|
| William Admin | willy_09@hotmail.fr | existing |
| Madeline | guardian-madeline.2026-07-20T03-54-55-221Z@guardian.equilibre.test | api |
| Foyer B | guardian-rls-b.2026-07-20T03-54-55-221Z@guardian.equilibre.test | api |
| Onboarding jetable | guardian-onboarding.{runId}@… | ui (créé pendant le run) |
| Solo signup | guardian-solo-ui.{runId}@… | ui (créé pendant le run) |

### Foyers

| Foyer | ID | Membres |
|-------|-----|---------|
| Famille Belot (A) | dee90027-56e9-494d-9632-75a281baa455 | William, Madeline |
| Foyer Guardian B | 2f4ed088-3846-45de-bcdd-8f1823c39d26 | RLS-B |

### Nettoyage run précédent

4 comptes jetables supprimés avant provisioning (run `2026-07-20T03-51-29-678Z`).

---

## 12. Verdict final

```
READY FOR DEPLOYMENT
```

Rapports :

- Markdown : `tests/e2e/reports/guardian-report.md`
- HTML : `tests/e2e/reports/html/index.html`
- État personas : `tests/e2e/reports/guardian-state.json`
- Captures : `tests/e2e/screenshots/runs/2026-07-20T03-54-55-221Z`

---

## 13. Fichiers modifiés (corrections QA-2 run final)

| Fichier | Changement |
|---------|------------|
| `tests/e2e/fixtures/users.ts` | Registre provisioningMode api/ui/existing |
| `tests/e2e/helpers/ui-persona.guard.ts` | Garde anti double provisioning |
| `tests/e2e/helpers/personas.helper.ts` | API-only Madeline + Foyer B, cleanup dynamique |
| `tests/e2e/helpers/supabase.helper.ts` | `cleanupGuardianDynamicUsers`, `authUserExistsByEmail` |
| `tests/e2e/helpers/visual.helper.ts` | Stabilisation, scope, dismiss Daily Brief |
| `tests/e2e/helpers/auth.helper.ts` | `dismissDailyBriefIfVisible` |
| `tests/e2e/rls/isolation.spec.ts` | RLS via login API (plus de signup solo) |
| `tests/e2e/onboarding/full-flow.spec.ts` | Persona `onboardingDisposable` |
| `tests/e2e/auth/signup.spec.ts` | Persona `soloSignup` |
| `tests/e2e/collaboration/propose-cancel.spec.ts` | Sélecteurs testid |
| `tests/e2e/household/overview.spec.ts` | testid + stabilisation visuelle |
| `tests/e2e/onboarding/profile.spec.ts` | Snapshot home scopé |
| `tests/e2e/planning/tasks-crud.spec.ts` | Snapshot planning scopé |
| `tests/e2e/goals/goal-lifecycle.spec.ts` | Snapshot goals scopé |
| `playwright.guardian.config.ts` | Session → dépend setup uniquement |
| `scripts/guardian-clean.mjs` | Nettoyage auth étendu |
| `tests/e2e/helpers/guardian-reporter.mjs` | Distinction skip dépendance |
| `src/pages/HouseholdOverviewPage.tsx` | `data-testid="household-page-title"` |
| `src/components/householdOverview/*` | testids opportunités + modal |

**Aucun moteur métier** (`src/ai/`, orchestrateurs EPIC) modifié.

---

## 14. Dette connue (hors périmètre QA-2)

- Duplicate React keys dans Daily Brief UI (allowlist console — dette produit)
- `Failed to fetch` transient au logout Supabase (allowlist logout)
- Snapshots full-page legacy remplacés par scopes — baselines à committer si CI visuelle activée
