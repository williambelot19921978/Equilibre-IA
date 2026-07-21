# QA-1 — Quality Guardian

> **Date :** 19 juillet 2026  
> **Statut :** ✅ QA-1 validé — QA-2 Smart Test Environment implémenté  
> **Voir aussi :** [QUALITY_GUARDIAN_QA2.md](./QUALITY_GUARDIAN_QA2.md)

---

## 1. Objectif

Construire un **système de validation automatique indépendant** de l'application :

- Simule de **vrais utilisateurs** via Playwright
- **N'accède jamais aux moteurs IA** directement
- Teste **uniquement via l'interface**
- Architecture **extensible** sur plusieurs années

---

## 2. Indépendance

| Règle | Application |
|-------|-------------|
| Pas de modification des moteurs | ✅ Aucun fichier `src/ai/` touché |
| Pas de modification des EPIC | ✅ Aucun orchestrateur produit modifié |
| Tests UI uniquement | ✅ Playwright + navigation réelle |
| Config séparée | ✅ `playwright.guardian.config.ts` (distinct de `playwright.config.ts`) |

La suite E2E historique (`e2e/`) reste intacte.

---

## 3. Architecture

```
scripts/quality-guardian.mjs          ← commande unique
playwright.guardian.config.ts         ← config Playwright dédiée
tests/e2e/
├── auth/                             ← AUTH + setup session
├── onboarding/                       ← foyer, membre, profil
├── planning/                         ← tâches (CRUD UI)
├── dailyBrief/                       ← affichage / lecture
├── goals/                            ← objectifs
├── household/                        ← vue Foyer
├── collaboration/                    ← Proposer / Annuler
├── fixtures/
│   ├── guardian.fixture.ts           ← hooks captures + erreurs
│   └── users.ts                      ← personas Guardian
├── helpers/
│   ├── auth.helper.ts
│   ├── navigation.helper.ts
│   ├── screenshots.helper.ts
│   ├── visual.helper.ts
│   ├── cleanup.helper.ts
│   ├── errors.helper.ts
│   └── guardian-reporter.mjs         ← rapport Markdown
├── screenshots/
│   ├── baselines/                    ← régression visuelle (futur)
│   └── runs/{runId}/…/               ← before / after / failure
└── reports/
    ├── guardian-report.md
    ├── results.json
    └── html/
```

### Flux d'exécution

```
npm run quality-guardian
        │
        ├── clean artefacts
        ├── preflight (bloquant)
        ├── build (si dist absent ou --build)
        ├── playwright test (config guardian)
        │       ├── global-setup → personas + seed
        │       ├── webServer vite --mode guardian :5173
        │       ├── guardian-setup → session William Admin
        │       ├── guardian-guest → signup, login, onboarding, RLS
        │       ├── guardian-authenticated → scénarios métier
        │       └── guardian-session → déconnexion / reconnexion
        └── guardian-report.md + verdict READY / NOT READY
```

---

## 4. Personas de test

Définis dans `tests/e2e/fixtures/users.ts` :

| Persona | Usage |
|---------|-------|
| **William Admin** | Compte principal (via `PLAYWRIGHT_TEST_EMAIL`) |
| **Madeline** | Conjoint référencé dans profil |
| **Famille Test** | Création foyer |
| **Utilisateur Solo** | Inscription guest |

Emails dynamiques : `guardian-{persona}.{timestamp}@guardian.equilibre.test`

Mot de passe par défaut : `GuardianTest2026!` (override : `GUARDIAN_TEST_PASSWORD`)

---

## 5. Scénarios implémentés

| Domaine | Fichier | Scénario |
|---------|---------|----------|
| **AUTH** | `auth/signup.spec.ts` | Création compte Solo |
| | `auth/login.spec.ts` | Connexion + session setup |
| | `auth/logout.spec.ts` | Déconnexion menu |
| | `auth/switch-user.spec.ts` | Déconnexion / reconnexion |
| **ONBOARDING** | `onboarding/household.spec.ts` | Formulaire création foyer |
| | `onboarding/member.spec.ts` | Saisie conjoint (profil) |
| | `onboarding/profile.spec.ts` | Accès Mon profil |
| **PLANNING** | `planning/tasks-crud.spec.ts` | Créer / reporter / terminer tâche |
| **DAILY BRIEF** | `dailyBrief/display-dismiss.spec.ts` | Affichage + fermeture |
| **GOALS** | `goals/goal-lifecycle.spec.ts` | Objectif + étape + progression |
| **HOUSEHOLD** | `household/overview.spec.ts` | Vue Foyer |
| **COLLABORATION** | `collaboration/propose-cancel.spec.ts` | Proposer → Annuler |

Les scénarios **skip** proprement si :
- credentials absents
- onboarding déjà complété
- opportunité / Daily Brief indisponible

---

## 6. Captures d'écran

Chaque scénario principal enregistre :

| Fichier | Moment |
|---------|--------|
| `before.png` | Début du test |
| `after.png` | Fin du test (succès) |
| `failure.png` | Échec uniquement |

Emplacement :

```
tests/e2e/screenshots/runs/{runId}/{project}/{scenario}/
```

Variable `GUARDIAN_RUN_ID` pour corréler une exécution.

---

## 7. Régression visuelle (infrastructure)

Prête, références non créées en masse.

```bash
# Capturer / comparer quand une baseline existe
GUARDIAN_VISUAL=1 npm run quality-guardian
```

Baselines : `tests/e2e/screenshots/baselines/{nom}.png`

Helper : `assertVisualRegression(page, "nom")` dans `visual.helper.ts`

- Si baseline absente → capture silencieuse (seed)
- Si baseline présente + `GUARDIAN_VISUAL=1` → comparaison Playwright

---

## 8. Rapport

Généré automatiquement : `tests/e2e/reports/guardian-report.md`

Contenu :

- Nombre de scénarios
- Réussites / échecs / ignorés
- Durée totale
- Tableau détaillé par projet
- Liens captures et rapport HTML

Rapport HTML : `tests/e2e/reports/html/index.html`

---

## 9. Commandes

| Commande | Description |
|----------|-------------|
| `npm run quality-guardian` | Build si nécessaire + Playwright + rapport |
| `npm run quality-guardian:headed` | Idem, navigateur visible |
| `GUARDIAN_BUILD=1 npm run quality-guardian` | Force le build |
| `PLAYWRIGHT_SKIP_WEBSERVER=1 npm run quality-guardian` | Serveur déjà lancé |
| `GUARDIAN_VISUAL=1 npm run quality-guardian` | Régression visuelle |

### Prérequis `.env.local`

```env
PLAYWRIGHT_TEST_EMAIL=votre-compte@test.com
PLAYWRIGHT_TEST_PASSWORD=votre-mot-de-passe
PLAYWRIGHT_BASE_URL=http://localhost:5173
```

Le Guardian active automatiquement les flags EPIC via `webServer.env` (sans modifier le code).

---

## 10. Ajouter un nouveau test

1. Créer `tests/e2e/{domaine}/mon-scenario.spec.ts`
2. Importer :

```typescript
import { test, expect } from "../fixtures/guardian.fixture";
```

3. Utiliser les helpers (`auth.helper`, `navigation.helper`)
4. Ajouter le fichier au `testMatch` du projet approprié dans `playwright.guardian.config.ts`
5. Lancer `npm run quality-guardian`

### Bonnes pratiques

- **Page Object** léger via helpers (pas de logique métier dans les specs)
- **Skip explicite** si données indisponibles
- **Titres descriptifs** en français (apparaissent dans le rapport)
- **Données uniques** (`Date.now()` dans les titres)
- **Nettoyage UI** via `cleanup.helper.ts` si nécessaire

---

## 11. Nettoyage des données

| Action | Méthode |
|--------|---------|
| Déconnexion | UI menu utilisateur |
| Tâches test | Terminer via bouton « Terminer » |
| Objectifs test | Supprimer via UI Goals (extension future) |
| Storage navigateur | `clearBrowserStorage(page)` helper |

Pas d'accès direct aux services applicatifs depuis les tests.

---

## 12. Dette / extensions futures

| Extension | Détail |
|-----------|--------|
| Baselines visuelles | Ajouter PNG dans `baselines/` progressivement |
| Personas multiples | Sessions parallèles Madeline / Famille Test |
| CI dédiée | Job `quality-guardian` avec secrets |
| Suppression comptes test | API admin Supabase (hors UI, couche test) |
| Mobile | Projet Playwright `Mobile Chrome` |

---

## 13. Verdict

| Critère | Statut |
|---------|--------|
| Playwright, architecture évolutive | ✅ |
| Indépendant des moteurs | ✅ |
| UI uniquement | ✅ |
| Personas + cleanup | ✅ |
| Scénarios AUTH → COLLABORATION | ✅ |
| Captures before/after/failure | ✅ |
| Infra régression visuelle | ✅ |
| Commande unique | ✅ |
| Rapport lisible | ✅ |
| EPIC / moteurs non modifiés | ✅ |

**Verdict : ✅ PRÊT POUR VALIDATION HUMAINE**
