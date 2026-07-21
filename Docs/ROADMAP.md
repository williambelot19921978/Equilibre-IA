# Équilibre IA — ROADMAP

> **Plan de développement concret et ordonné**
>
> Version : 1.4.0
> Date : 18 juillet 2026
> **Constitution :** [`EQUILIBRE_AI_CONSTITUTION.md`](./EQUILIBRE_AI_CONSTITUTION.md) — prévaut (Loi 8)
> **Trois piliers :** Constitution · [`ARCHITECTURE_GUARDIAN.md`](./ARCHITECTURE_GUARDIAN.md) · [`ROBOT_QA_CHARTER.md`](./ROBOT_QA_CHARTER.md)
> Gouvernance : [`GOVERNANCE_REPORT.md`](./GOVERNANCE_REPORT.md)

---

## Phase Architecture — Décisions figées (juillet 2026) ✅

Avant tout sprint d'implémentation (F1 et suivants), les décisions suivantes sont **officiellement validées** :

| # | Décision | Référence Constitution |
|---|----------|------------------------|
| 1 | Produit **universel** — profils génériques uniquement (legacy test isolé) | ch. 1 |
| 2 | **Foyer** = entité centrale ; conjoint = membre, pas texte | ch. 6 |
| 3 | Planning = **outil**, pas le but | ch. 1, 4, Loi 1-2 |
| 4 | Robot QA = **composant officiel** | ch. 19 |
| 5 | Décisions produit = **humaines** ; Robot QA propose seulement | ch. 19 |
| 6 | Pipeline IA = **interfaces d'abord**, migration progressive | ch. 13 |
| 7 | Spiritualité = **module optionnel**, jamais imposée | ch. 7 |
| 8 | Onboarding final = **conversationnel** ; « Je n'ai pas d'enfant » = étape intermédiaire | ch. 7 |
| 9 | **8 Lois fondamentales** ajoutées | ch. 2 |
| 10 | **Health Score** = concept validé, non implémenté | ch. 20 |

**Phase Fondation terminée (Sprint 0.5).** Implémentations produit : Sprint A3+.

---

## Phase Fondation — Documentation (juillet 2026) ✅

| Sprint | Livrable | Statut |
|--------|----------|--------|
| A1 | 20 contrats moteurs documentaires | ✅ |
| A2 | Interfaces TypeScript `src/ai/contracts/` | ✅ |
| UL-0 | Dual Memory, Universal Learning doc | ✅ |
| Sprint 0 | Audit fondations | ✅ |
| **Sprint 0.5** | **Alignement documentaire Constitution v1.4** | ✅ |

**Architecture figée à 20 moteurs** (ADR-0005). Boucle : Comprendre → Décider → Proposer → Observer → Mesurer → Apprendre.

---

## Phase Gouvernance — Troisième pilier (juillet 2026) ✅

*(Architecture Guardian — voir [`GOVERNANCE_REPORT.md`](./GOVERNANCE_REPORT.md))*

---

## Sprint A1 — Contrats cerveau IA (juillet 2026) ✅

| Livrable | Emplacement |
|----------|-------------|
| 20 contrats moteurs | [`architecture/contracts/`](../architecture/contracts/) |
| ADR-0005 (gel 20 moteurs) | [`architecture/adr/0005-freeze-brain-architecture-20-engines.md`](../architecture/adr/0005-freeze-brain-architecture-20-engines.md) |
| ADR-0002 | superseded → ADR-0005 |
| Rapport Sprint A1 | [`architecture/decisions/2026-07-18-sprint-a1-report.md`](../architecture/decisions/2026-07-18-sprint-a1-report.md) |
| Architecture Score | **94/100** — APPROVED |

**Aucun code `src/` modifié.** Sprint A2 = interfaces TypeScript.

---

## Sprint A2 — Contrats TypeScript (juillet 2026) ✅

| Livrable | Emplacement |
|----------|-------------|
| 20 interfaces moteurs | [`src/ai/contracts/`](../src/ai/contracts/) |
| Gel 20 moteurs | ADR-0005 |
| Frontières moteurs | ADR-0006 |
| Rapport Sprint A2 | [`SPRINT_A2_REPORT.md`](./SPRINT_A2_REPORT.md) |
| Architecture Score | **96/100** — APPROVED WITH RECOMMENDATIONS |

**Contrats uniquement — aucune logique métier.** Sprint A3 = adaptateurs legacy pilote.

---

## Phase Universal Learning — Dual Memory (juillet 2026) ✅

| Livrable | Emplacement |
|----------|-------------|
| Référence officielle | [`UNIVERSAL_LEARNING_ENGINE.md`](./UNIVERSAL_LEARNING_ENGINE.md) |
| Contrat moteur #19 | [`architecture/contracts/universal-learning-engine.md`](../architecture/contracts/universal-learning-engine.md) |
| ADR-0003 | [`architecture/adr/0003-dual-memory-universal-learning.md`](../architecture/adr/0003-dual-memory-universal-learning.md) |
| Rapport | [`UNIVERSAL_LEARNING_REPORT.md`](./UNIVERSAL_LEARNING_REPORT.md) |

**Principe :** le projet apprend des connaissances, jamais des personnes. **Aucune implémentation.**

| Phase | Objectif | Statut |
|-------|----------|--------|
| UL-2 | Spec AnonymizationGate + types | 📋 Après A2 |
| UL-3 | Pipeline agrégation backend | 💡 |

---

## Étape fondation (juillet 2026) — ✅ Validée

1. Constitution v1.1 → [`EQUILIBRE_AI_CONSTITUTION.md`](./EQUILIBRE_AI_CONSTITUTION.md)
2. Charte Robot QA → [`ROBOT_QA_CHARTER.md`](./ROBOT_QA_CHARTER.md)
3. Matrice 200 scénarios → [`qa/scenarios/`](../qa/scenarios/)
4. Rapports d'alignement → [`CONSTITUTION_ALIGNMENT_REPORT.md`](./CONSTITUTION_ALIGNMENT_REPORT.md)

---

## Prochaines étapes planifiées (sans ordre de démarrage immédiat)

| Phase | Objectif | Statut |
|-------|----------|--------|
| **A1** | Contrats moteurs cerveau IA (`architecture/contracts/`) | ✅ **Terminé** |
| **A2** | Interfaces TypeScript (`src/ai/contracts/`) | 📋 Planifié — après validation humaine A1 |
| **A2** | Documentation Robot QA architecture + métriques | 📋 Planifié |
| **F1** | Neutralité plateforme (UI, onboarding, NLP) | ⏸️ En attente validation post-architecture |
| **F2** | Modèle foyer membres (remplacement `partner_name`) | 📋 Planifié |
| **F3** | Health Score (concept → implémentation Robot QA) | 💡 Vision |

---

## Table des matières

1. [Audit de l'existant](#audit-de-lexistant)
2. [Sprint 0 — Stabilisation](#sprint-0--stabilisation)
3. [Sprint 1 — Planning vivant V1](#sprint-1--planning-vivant-v1)
4. [Sprint 2 — Modification conversationnelle sans LLM](#sprint-2--modification-conversationnelle-sans-llm)
5. [Sprint 3 — Mémoire comportementale](#sprint-3--mémoire-comportementale)
6. [Sprint 4 — Coach proactif](#sprint-4--coach-proactif)
7. [Sprint 5 — Mode couple](#sprint-5--mode-couple)
8. [Sprint 6 — Notifications et PWA](#sprint-6--notifications-et-pwa)
9. [Sprint 7 — Spotify et spiritualité](#sprint-7--spotify-et-spiritualité)
10. [Sprint 8 — Vraie IA conversationnelle](#sprint-8--vraie-ia-conversationnelle)
11. [Sprint 9 — Tests familiaux](#sprint-9--tests-familiaux)
12. [Synthèse](#synthèse)

---

# Audit de l'existant

## Stack en place

| Élément | Version | Statut |
|---------|---------|--------|
| React | 19.2 | ✅ |
| TypeScript | 6.0 | ✅ (build cassé) |
| Vite | 8.1 | ✅ |
| React Router | 7.18 | ✅ |
| Tailwind CSS | 4.3 | ✅ |
| Supabase JS | 2.110 | ✅ |
| oxlint | 1.71 | ✅ |

## Fichiers source (26 fichiers `src/`)

| Zone | Fichiers | Maturité |
|------|----------|----------|
| Pages | 9 pages | Fonctionnelles, logique inline |
| Services | 2 (`profileFactsService`, `tasksService`) | Partiels |
| AI | 1 (`memoryEngine.ts`) | Règles statiques |
| Contexts | 1 (`AuthContext`) | Minimal |
| Config | 2 (`app.ts`, `discoveryQuestions.ts`) | Complet |
| Router | 1 (`AppRouter.tsx`) | Sans garde onboarding |
| Types | Vide (`types/index.ts`) | À créer |

## Fonctionnalités par module

| Module | Implémenté | Manquant |
|--------|------------|----------|
| **Auth** | Signup, login, session, signOut | Redirection intelligente |
| **Foyer** | RPC création, page onboarding | Service dédié, garde doublon |
| **Enfants** | CRUD basique | Lien mémoire/planning |
| **Profil** | Upsert 4 facts | Non lu par memoryEngine |
| **Discovery** | 20 questions, 5/session, dépendances | Erreur TS `factsMap` |
| **Mémoire** | buildProfile, insights, progression | Facts onboarding, enfants |
| **Tâches** | Create, list, done, skip (+skip_count) | planned, edit, cancel, filtre skipped |
| **Planning** | — | Tout |
| **Coach** | Insights statiques sur /home | Proactif, explications |
| **Journal** | — | Tout |
| **Mode couple** | — | Tout |
| **Spotify** | — | Tout |
| **Notifications** | — | Tout |
| **PWA** | — | Tout |
| **IA LLM** | — | Tout |

## Tables Supabase (inférées du code)

| Table | Utilisée | RLS versionnée |
|-------|----------|----------------|
| `profiles` | ✅ Écrit | ❌ |
| `households` | ✅ Via RPC | ❌ |
| `household_members` | ✅ | ❌ |
| `children` | ✅ | ❌ |
| `profile_facts` | ✅ | ❌ |
| `tasks` | ✅ | ❌ |

**Migrations SQL dans le repo :** aucune.

## Bugs et dettes connus

| ID | Sévérité | Description |
|----|----------|-------------|
| B-01 | 🔴 Bloquant | `npm run build` échoue — `factsMap` inutilisé dans `DiscoveryPage.tsx` |
| B-02 | 🔴 Bloquant | Login redirige toujours vers `/onboarding/household` |
| B-03 | 🟠 Majeur | `getCurrentHouseholdId` utilise `.single()` — crash si 0 ou 2+ foyers |
| B-04 | 🟠 Majeur | Onboarding saute `/onboarding/profile` (children → home) |
| B-05 | 🟠 Majeur | `onboarding_completed` écrit mais jamais lu |
| B-06 | 🟡 Mineur | Tâches `skipped` restent dans liste active |
| B-07 | 🟡 Mineur | Appels Supabase dispersés dans les pages |
| B-08 | 🟡 Mineur | `src/pages/.gitkeep` contient du code dupliqué |
| B-09 | 🟡 Mineur | Pas de types Supabase générés |
| B-10 | 🟡 Mineur | Progression mémoire faussée (facts onboarding comptés) |

---

# Sprint 0 — Stabilisation (historique)

> **Supersédé** par la Phase Fondation (Sprints A1, A2, 0, 0.5). Conservé pour historique du projet early-stage.

**Estimation : S (1 semaine)**
**Priorité : P0 — Prérequis à tout le reste**
**Dépendances : aucune**

## Objectifs

1. Build TypeScript vert
2. Flux auth/onboarding cohérent
3. Services Supabase centralisés
4. Migrations SQL versionnées
5. Repo Git propre et sauvegardé

## Tâches détaillées

### Build TypeScript et lint

- [ ] Supprimer ou utiliser `factsMap` dans `DiscoveryPage.tsx`
- [ ] Vérifier `npm run build` ✅
- [ ] Vérifier `npm run lint` sans erreurs bloquantes
- [ ] Corriger indentation `SignupPage.tsx` (cosmétique)

### Routes et redirections

- [ ] Créer `resolvePostAuthRoute()` — lit `profiles`, `household_members`
- [ ] `LoginPage` → redirection intelligente (home si onboarding complet)
- [ ] `SignupPage` → idem si session immédiate
- [ ] Route guard dans `AppRouter` : rediriger vers onboarding si incomplet
- [ ] Empêcher accès `/onboarding/household` si foyer déjà existant

### Onboarding

- [ ] `ChildrenPage.handleFinish` → `/onboarding/profile` (pas `/home`)
- [ ] `ProfileOnboardingPage` → `/home` ou `/discovery` après save
- [ ] Lire `onboarding_completed` dans le route guard

### Services Supabase

- [ ] Créer `householdService.ts` (getHousehold, getMembership, create via RPC)
- [ ] Harmoniser `getCurrentHouseholdId` → `maybeSingle()` + erreur explicite
- [ ] Migrer appels Supabase de `HouseholdPage`, `ChildrenPage`, `ProfileOnboardingPage` vers services
- [ ] Supprimer ou nettoyer `src/pages/.gitkeep`

### Migrations et Git

- [ ] Initialiser `supabase/migrations/` avec schéma actuel documenté
- [ ] Générer `src/types/database.ts` (Supabase CLI)
- [ ] Commit de référence « Sprint 0 — stabilisation »
- [ ] Vérifier `.env.local` dans `.gitignore`

## Fichiers probables

| Action | Fichier |
|--------|---------|
| Modifier | `src/pages/DiscoveryPage.tsx` |
| Modifier | `src/pages/LoginPage.tsx` |
| Modifier | `src/pages/SignupPage.tsx` |
| Modifier | `src/pages/ChildrenPage.tsx` |
| Modifier | `src/app/router/AppRouter.tsx` |
| Modifier | `src/services/profileFactsService.ts` |
| Créer | `src/services/householdService.ts` |
| Créer | `src/lib/routing/resolvePostAuthRoute.ts` |
| Créer | `supabase/migrations/00001_initial_schema.sql` |
| Créer | `src/types/database.ts` |
| Supprimer | `src/pages/.gitkeep` (ou vider) |

## Tables Supabase

| Table | Action |
|-------|--------|
| `profiles` | Documenter + RLS |
| `households` | Documenter + RLS |
| `household_members` | Documenter + RLS |
| `children` | Documenter + RLS |
| `profile_facts` | Documenter + RLS |
| `tasks` | Documenter + RLS |

## Critères d'acceptation

- [ ] `npm run build` passe sans erreur
- [ ] Utilisateur existant avec onboarding complet → login → `/home`
- [ ] Nouvel utilisateur → signup → household → children → profile → home
- [ ] Utilisateur sans foyer → login → `/onboarding/household`
- [ ] Aucun appel Supabase direct dans les pages (sauf auth pages)
- [ ] Migrations SQL présentes dans le repo
- [ ] Types database générés

## Tests manuels

1. Créer un nouveau compte → parcours onboarding complet → arrive sur /home
2. Se déconnecter → se reconnecter → arrive sur /home (pas household)
3. Accéder à /onboarding/household avec foyer existant → redirection
4. Utilisateur sans enfants → peut terminer onboarding
5. `npm run verify:supabase` OK

## Risques

| Risque | Mitigation |
|--------|------------|
| Schéma Supabase distant inconnu | Exporter via Supabase Dashboard avant migration |
| RLS mal configuré bloque les requêtes | Tester chaque table après policy |
| Régression auth | Tester signup + login à chaque modification |

---

# Sprint 1 — Planning vivant V1

**Estimation : L (2 semaines)**
**Priorité : P0 — Cœur produit**
**Dépendances : Sprint 0**

## Objectifs

1. Moteur de planning déterministe fonctionnel
2. Contraintes dures (enfants, travail, sommeil) respectées
3. Placement automatique des tâches `todo`
4. Persistance des blocs planifiés
5. Timeline visible sur le tableau de bord

## Tâches détaillées

### AI Engine

- [ ] Créer `src/ai/planningEngine.ts`
  - `buildDayConstraints(profile, children, date)`
  - `findAvailableSlots(constraints)`
  - `prioritizeTasks(tasks, profile)`
  - `generateDayPlan(constraints, tasks, profile)`
- [ ] Créer `src/ai/decisionEngine.ts`
  - Règles R-01 à R-08 (cf. PROJECT_BIBLE)
  - `validatePlanBlock()`, `canScheduleTask()`
- [ ] Étendre `memoryEngine.ts`
  - Lire `work_schedule`, `sleep_schedule`, `main_priority`
  - Helpers `getBedtime()`, `getWakeTime()`, `getWorkHours()`

### Services et données

- [x] Migration `calendar_items` documentée (table existante)
- [x] Créer `planningService.ts` (save, load, regenerate)
- [x] Étendre `tasksService.ts` — statut `planned`, `getTasksForPlanning()`

### UI

- [x] Créer `src/types/planning.ts` (`PlannedBlock`, `DayPlan`, `DayConstraint`)
- [x] Créer `src/pages/PlanningPage.tsx` (timeline intégrée)
- [x] Créer `src/hooks/useDayPlan.ts`
- [x] Résumé planning dans `HomePage.tsx`
- [ ] Actions : accepter bloc, reporter tâche → replanification (Sprint 2)
- [x] Styles timeline dans `index.css`

## Fichiers probables

| Action | Fichier |
|--------|---------|
| Créer | `src/ai/planningEngine.ts` |
| Créer | `src/ai/decisionEngine.ts` |
| Créer | `src/services/planningService.ts` |
| Créer | `src/types/planning.ts` |
| Créer | `src/hooks/useDayPlan.ts` |
| Créer | `src/pages/PlanningPage.tsx` |
| Créer | `supabase/migrations/00002_calendar_items_documented.sql` |
| Modifier | `src/ai/memoryEngine.ts` |
| Modifier | `src/services/tasksService.ts` |
| Modifier | `src/pages/HomePage.tsx` |
| Modifier | `src/index.css` |

## Tables Supabase

| Table | Action |
|-------|--------|
| `calendar_items` | **Utiliser** (stockage planning) |
| `tasks` | Utiliser statuts `planned` |
| `profile_facts` | Lire horaires |
| `children` | Lire pour contraintes |

## Critères d'acceptation

- [ ] Planning généré automatiquement à l'ouverture de /home
- [ ] Routines enfants apparaissent comme blocs protégés
- [ ] Horaires travail bloquent les créneaux
- [ ] Tâches `todo` placées selon priorité et énergie
- [ ] Tâche avec `skip_count >= 3` proposée en version réduite
- [ ] Reporter une tâche → replanification
- [ ] Aucune tâche planifiée après bedtime
- [ ] Chaque bloc a un champ `explanation`

## Tests manuels

1. Utilisateur avec facts complets → planning cohérent affiché
2. Ajouter une tâche → replanification visible
3. Reporter 3 fois → durée réduite proposée
4. Jour non travaillé (samedi) → pas de bloc travail
5. Utilisateur sans `sleep_schedule` → message demandant l'info

## Risques

| Risque | Mitigation |
|--------|------------|
| Algorithme trop rigide | Commencer déterministe, itérer |
| Performance recalcul | Debounce replanification |
| UX timeline encombrée | Max 8 blocs, scroll si plus |

---

---

# Sprint 1.6 — Contexte familial daté ✅

**Estimation : M**  
**Priorité : P0**  
**Dépendances : Sprint 1, Sprint 1.5**

## Objectifs

- Périodes temporaires (vacances, absences, parent seul…) dans `family_context_periods`
- Routines enfants explicites (`child_routines` + couchers)
- Planning Engine contextuel par date
- UI `/family-context`, accueil et planning adaptés

## Livrables

- [x] Migrations `00003_family_context_periods.sql`, `00004_child_routines.sql`
- [x] `familyContextEngine.ts`, `eveningRoutine.ts`
- [x] `FamilyContextPage`, `DailyRoutinePage` enrichi
- [x] Bannières `/home`, adaptations `/planning`
- [x] 24 tests (A–J)

**Rapport :** `docs/SPRINT_1_6_REPORT.md`

---

---

# Sprint 1.7 — Réparation stabilité ✅ (code)

**Priorité : P0**  
**Rapport :** `docs/SPRINT_1_7_REPORT.md`

- [x] Source de vérité progression (`calculateDiscoveryProgress`)
- [x] Chargements isolés (`Promise.allSettled`)
- [x] Calendrier découplé de `loadHouseholdMemoryContext`
- [x] Messages erreur `[table] OPERATION`
- [x] Migration 00005 + `npm run verify:schema`
- [ ] Migrations 00003/00004 à exécuter sur Supabase distant
- [ ] Tests navigateur A–J (validation manuelle)

---

# Sprint 2 — Modification conversationnelle sans LLM

**Estimation : M (1 semaine)**
**Priorité : P1**
**Dépendances : Sprint 1**

## Objectifs

Permettre à l'utilisateur de modifier son planning par des **commandes textuelles prédéfinies** — sans LLM, via pattern matching et intents.

## Tâches détaillées

- [ ] Créer `src/ai/conversationEngine.ts` — parser d'intents (regex + mots-clés)
- [ ] Créer `src/config/conversationPatterns.ts` — patterns français
- [ ] Créer composant `CommandInput` sur HomePage
- [ ] Intents V1 :
  - `BLOCK_CHILDREN` — « préparer les enfants »
  - `MOVE_TASK` — « déplace / reporte à demain »
  - `DECLARE_FATIGUE` — « fatiguée / crevée »
  - `SHORT_ON_TIME` — « X minutes »
  - `PARTNER_AWAY` — « un membre en déplacement »
  - `CHILDREN_SICK` — « enfants malades »
  - `CANCEL_BLOCK` — « annule / laisse tomber »
  - `CONFIRM` / `REJECT` — « oui » / « non »
- [ ] Pipeline 7 étapes (cf. AI_RULEBOOK)
- [ ] Confirmation avant changements importants
- [ ] Enregistrement contraintes temporaires (table `journal_entries` basique)

## Fichiers probables

| Action | Fichier |
|--------|---------|
| Créer | `src/ai/conversationEngine.ts` |
| Créer | `src/config/conversationPatterns.ts` |
| Créer | `src/components/coach/CommandInput.tsx` |
| Créer | `src/services/journalService.ts` (minimal) |
| Créer | `supabase/migrations/00003_journal_entries.sql` |
| Modifier | `src/pages/HomePage.tsx` |
| Modifier | `src/ai/planningEngine.ts` (replanification) |

## Tables Supabase

| Table | Action |
|-------|--------|
| `journal_entries` | **Créer** (minimal) |
| `plan_blocks` | Modifier statuts |
| `tasks` | Modifier statuts |

## Critères d'acceptation

- [ ] « Je suis trop fatiguée » → allègement du plan + message bienveillant
- [ ] « Déplace ma séance à demain » → tâche déplacée + confirmation
- [ ] « Les enfants sont malades » → journée allégée
- [ ] « J'ai seulement 20 minutes » → proposition micro-tâche
- [ ] « Là je dois préparer les enfants » → créneau bloqué immédiatement
- [ ] Aucune commande ne culpabilise
- [ ] Max 1 question de clarification par commande

## Tests manuels

1. Tester chaque phrase type de l'AI_RULEBOOK
2. Commande ambiguë → une seule question de précision
3. Refus (« non ») → plan inchangé
4. Commande inconnue → « Je n'ai pas compris — tu peux reformuler ? »

## Risques

| Risque | Mitigation |
|--------|------------|
| Pattern matching trop fragile | Couvrir variantes françaises courantes |
| Faux positifs | Score de confiance minimum par intent |

---

# Sprint 2.3 — Journées navigables et temps libre (livré)

**Date :** 13 juillet 2026  
**Priorité :** P1 — usage quotidien  
**Dépendances :** Sprint 2.0–2.2

## Objectifs livrés

1. Mini-calendrier mensuel sur Accueil, Planning et Calendrier
2. Navigation par date via `?date=YYYY-MM-DD` (persiste après F5)
3. Temps disponible après coucher enfants
4. Suggestions facultatives sur chaque temps libre (sport, étude, repos, famille, spiritualité)
5. Vacances visibles et adaptées au moteur
6. Espace spirituel discret selon `faith_importance`

## Fichiers clés

| Fichier | Rôle |
|---------|------|
| `MonthCalendar.tsx` | Calendrier mensuel réutilisable |
| `urlDate.ts` / `useUrlDate.ts` | Date URL partagée |
| `freeTimeSuggestionEngine.ts` | Moteur suggestions déterministe |
| `sportSessionGenerator.ts` | Séances sport courtes |
| `spiritualContentLibrary.ts` | Contenus validés avec références |
| `VacationQuickForm.tsx` | Ajout rapide vacances |
| `suggestionAcceptanceService.ts` | Persistance suggestion → `calendar_item` |

## Critères validés

- [x] Navigation jour par jour + URL persistante
- [x] Vacances suppriment travail (user) / école (enfants)
- [x] Bouton « Me proposer une activité » sur temps libres
- [x] Toujours « Garder ce temps libre »
- [x] 122 tests automatisés, build/lint/verify OK

Voir `Docs/SPRINT_2_3_REPORT.md` pour le détail.

---

# Sprint 2.4 — Navigation mobile et calendrier visuel (livré)

**Date :** 14 juillet 2026

## Objectifs livrés

1. Calendrier compact + vue mensuelle full colorée
2. Heure locale appareil (`deviceClock.ts`)
3. Repère « Maintenant » + blocs passés repliés
4. Historique sans recalcul automatique
5. Menu latéral `AppDrawer`
6. Page `/profile` complète
7. Code couleur `calendarColors.ts`

**131 tests** — build/lint/verify OK. Voir `Docs/SPRINT_2_4_REPORT.md`.

---

# Sprint 2.5 — Calendrier lisible et Google Calendar (livré)

**Date :** 14 juillet 2026

## Objectifs livrés

1. Calendrier mensuel par semaines avec bandes multi-jours (`MonthEventBar`)
2. Fusion vacances + calendar_items + événements Google
3. Accueil desktop 2 colonnes + carte motivation/spiritualité
4. Travail + trajets aller/retour toujours visibles (titres exacts)
5. OAuth Google Calendar lecture seule + sync manuelle/auto
6. Filtres calendrier + « À venir ce mois-ci »

**153 tests** — build/lint OK. Migration `00008` + déploiement Edge Functions requis pour prod. Voir `Docs/SPRINT_2_5_REPORT.md` et `Docs/GOOGLE_CALENDAR_SETUP.md`.

---

# Sprint 2.6 — Préparation V1 Netlify (livré)

**Date :** 14 juillet 2026

## Objectifs livrés

1. Feature flag `VITE_GOOGLE_CALENDAR_ENABLED=false` — Google masqué sans erreur
2. `netlify.toml` — build, SPA, headers, cache
3. ErrorBoundary + page 404
4. Version bêta `0.1.0-beta` + badge discret
5. Guide `Docs/NETLIFY_DEPLOYMENT.md`

**157 tests** — prêt pour déploiement Netlify. Voir `Docs/SPRINT_2_6_REPORT.md`.

---

# Sprint 2.7 — Stabilisation calendrier et menu gauche (livré)

**Date :** 15 juillet 2026

## Objectifs livrés

1. Correction boucle rechargement `CalendarPage` (hook `useCalendarViewData`)
2. Date unique `LocalDateString` + garde URL dans `useUrlDate`
3. Sections stables — skeleton / badge « Mise à jour… », pas de bonds
4. RDV : upsert optimiste + garde `requestId` contre réponses obsolètes
5. Menu ☰ et tiroir entièrement à gauche

**170 tests** — build/lint/verify OK. Tests navigateur manuels requis. Voir `Docs/SPRINT_2_7_REPORT.md`.

---

# Sprint 2.8 — Espace spirituel personnel (livré)

**Date :** 15 juillet 2026

## Objectifs livrés

1. Route `/spiritual` + `SpiritualSpacePage`
2. Menu ☰ « ✦ Espace spirituel » (plus de redirect `/home`)
3. Bibliothèque locale validée (Louis Segond 1910)
4. Moteur `spiritualSuggestionEngine` déterministe
5. Ajout au planning (locked calendar_item + replan)
6. Favoris (`00009_spiritual_favorites.sql`)
7. Préférences étendues + carte accueil conditionnelle

**189 tests** — migration `00009` requise en prod. Voir `Docs/SPRINT_2_8_REPORT.md`.

---

# Sprint 3 — Mémoire comportementale

**Estimation : M (1 semaine)**
**Priorité : P1**
**Dépendances : Sprint 1, Sprint 2**

## Objectifs

Enrichir la mémoire avec des signaux comportementaux passifs et des habitudes observées.

## Tâches détaillées

- [ ] Créer `behavioral_signals` (migration)
- [ ] Enregistrer automatiquement : skip, complete, plan_accept, plan_modify, plan_reject
- [ ] Créer `src/ai/behaviorEngine.ts` — agrégation signaux → habitudes
- [ ] Étendre `memoryEngine.ts` — intégrer habitudes avec confidence
- [ ] Ajuster `confidence` des facts selon cohérence signaux
- [ ] Corriger `calculateKnowledgeProgress` — distinguer facts discovery vs onboarding
- [ ] Insights évolutifs basés sur habitudes (pas seulement facts déclarés)

## Fichiers probables

| Action | Fichier |
|--------|---------|
| Créer | `src/ai/behaviorEngine.ts` |
| Créer | `src/services/behaviorService.ts` |
| Créer | `supabase/migrations/00004_behavioral_signals.sql` |
| Modifier | `src/ai/memoryEngine.ts` |
| Modifier | `src/services/tasksService.ts` (hooks signaux) |
| Modifier | `src/services/planningService.ts` (hooks signaux) |
| Modifier | `src/pages/TasksPage.tsx` (filtre skipped) |

## Tables Supabase

| Table | Action |
|-------|--------|
| `behavioral_signals` | **Créer** |
| `profile_facts` | Mettre à jour `confidence` |

## Critères d'acceptation

- [ ] Chaque skip/complete enregistre un signal
- [ ] Insight « reports le soir » après 5+ signaux cohérents
- [ ] Déduction présentée comme « J'ai remarqué… » (pas comme fait)
- [ ] Progression mémoire ne compte que les 20 questions discovery
- [ ] Tâches `skipped` dans section séparée (pas « à organiser »)

## Tests manuels

1. Reporter 5 tâches le soir → insight adapté
2. Terminer 3 tâches le matin (studies) → suggestion créneau matinal
3. Corriger un fact → confidence remise à 1.0

## Risques

| Risque | Mitigation |
|--------|------------|
| Sur-interprétation | Seuil minimum de signaux |
| Stockage excessif | Agrégation hebdomadaire |

---

# Sprint 4.2 — Navigation compacte & rythmes variables ✅

**Date :** 16 juillet 2026  
**Statut :** Livré — voir `Docs/SPRINT_4_2_REPORT.md`

## Livrables

- Sidebar repliable (220 px / 72 px) avec persistance `sidebar_collapsed`
- Table `work_schedule_patterns` + UI « Mon rythme de travail »
- `resolveWorkStatusForDate()` — source unique calendrier / planning / life engine
- Calendrier catholique français + affichage dans `MotivationCard`
- 445 tests automatisés au vert

## Migration requise

`supabase/migrations/00011_sprint42_work_schedule_sidebar.sql`

---

# Sprint 4.3 — Rythmes A/B & planification du soir ✅

**Date :** 16 juillet 2026  
**Statut :** Livré — voir `Docs/SPRINT_4_3_REPORT.md`

## Livrables

- Correction sélection rythme A/B/cycle (hook `useWorkScheduleEditor`, visible hors mode Modifier)
- `EveningOpportunity` — créneau après coucher enfants, max 60 %, marge coucher
- Coucher `00:00` interprété comme fin de soirée (jour suivant)
- Préférence `evening_planning_mode` (automatic / suggestions_only / disabled)
- Timeline : header soir + suggestions `proposed` + temps libre conservé
- 478 tests automatisés au vert

## Migration requise

`supabase/migrations/00012_sprint43_evening_planning.sql`

---

# Sprint 4.4 — Journée réaliste & actions flexibles ✅

**Date :** 16 juillet 2026  
**Statut :** Livré — voir `Docs/SPRINT_4_4_REPORT.md`

## Livrables

- Accueil épuré : calendrier hors centre (`calendar_widget_position` : header_right / hidden / drawer)
- Repas explicites : `meal_settings` + contraintes `breakfast` / `dinner` dans le planning
- Soirée max **2 activités** + temps libre (moteur soir réécrit)
- Séances sport détaillées : `WorkoutSession` (échauffement, circuit, retour au calme)
- Actions sur chaque bloc : Décaler, Je n'ai pas le temps, Terminer, Annuler
- Reprise progressive : `recoveryPriorityEngine` + colonnes annulation sur `tasks`
- Historique : table `task_activity_events`
- 497 tests automatisés au vert

## Migration requise

`supabase/migrations/00013_sprint44_realistic_day.sql`

---

# Sprint 4.5 — Calendrier drawer, garde enfants & Loisirs ✅

**Date :** 16 juillet 2026  
**Statut :** Livré — voir `Docs/SPRINT_4_5_REPORT.md`

## Livrables

- Calendrier retiré du header — intégré au drawer (variant `drawer`, défaut)
- Mode de garde vacances enfants (`childcareMode` dans `impact` jsonb)
- `BlockActionButton` — boutons timeline visibles avec icônes
- Espace Loisirs (`/leisure`) — sport, musique, bibliothèque, favoris
- `leisureSuggestionEngine` — propositions dans les temps libres
- **Complément sport auto** — `workoutGenerationEngine`, `SportProposalCard`, propositions directes sur créneaux libres
- `sport_settings` (Profil → Sport) — niveau, types, matériel, durée
- 530+ tests automatisés au vert

## Migrations requises

`supabase/migrations/00014_sprint45_leisure_childcare.sql`  
`supabase/migrations/00015_sport_settings.sql`

---

# Sprint 4.6 — Sport exécutable, ressenti & replanification dynamique ✅

**Date :** 16 juillet 2026  
**Statut :** Livré — voir `Docs/SPRINT_4_6_REPORT.md`

## Livrables

- `classifyCalendarItemActivity(item)` — reconnaissance sport manuel (pas le titre seul)
- Formulaire calendrier Sport → `details.businessType`, séance optionnelle
- `WorkoutSessionPlayer` + `useWorkoutTimer` — exécution guidée avec chrono
- `DailyCheckinWidget` + table `daily_checkins` — ressenti du jour sur l'accueil
- Life Engine : impact check-in sur remplissage, sport, marges
- `replanAfterBlockMove` + `absorbDurationChangeWithFreeTime` + `FlexibleBuffer`
- Actions bloc complètes sur sport manuel (modifier, décaler, annuler, terminer, séance)
- 552 tests automatisés au vert

## Migrations requises

`supabase/migrations/00016_daily_checkins.sql`

---

# Sprint 4.7 — Accomplissements, encouragements & fin en avance ✅

**Date :** 16 juillet 2026  
**Statut :** Livré — voir `Docs/SPRINT_4_7_REPORT.md`

## Livrables

- `evaluateCompletionTiming()` — early / on_time / late / unscheduled (±5 min)
- `achievementFeedbackEngine.ts` — encouragements variés, anti-répétition, niveaux de célébration
- `completeActivityWithFeedback()` — pipeline unifié sport + toutes activités planifiées
- Statuts visibles : « Séance effectuée », badges timeline, persistance `details` après F5
- Fin en avance → temps libéré via `releaseEarlyFinishTime` + replan flexible
- `RecentAchievementWidget` — carte compacte accueil / planning
- `task_activity_events.metadata` enrichi (timing, feedbackId, workoutCompleted…)
- 605 tests automatisés au vert
- **Correctif temporalité :** séances sport jour uniquement, complétion bloquée si date incohérente, planning soir simplifié (1 bloc libre + 1 suggestion), `DailyActivityCompletionState`
- **Correctif diversité :** suggestions multiples (max 5), catégories répétables, durées sport cohérentes, `adaptWorkoutSessionDuration`

## Correctif cohérence temporelle (16 juillet 2026)

- `resolveWorkoutAvailability()` — séance future non lançable ; redirection vers séance du jour
- `resolveBlockCompletionAvailability()` — pas d'écriture Supabase si bloc futur ou incohérent
- `mergeAdjacentFreeTimeBlocks()` + soirée = suggestion facultative sans `calendar_item` tant que non acceptée
- `resolveSuggestedActivityDuration()` — couple/film/sport/révision avec durées naturelles
- Tests : `sprint47-temporal.test.ts` (A–P)

## Correctif suggestions diversifiées (16 juillet 2026)

- `activityRepeatRules.ts` — matrice répétition par catégorie (sport 1× auto, révision 3×, etc.)
- `slotActivitySuggestionEngine.ts` — scoring équilibré, max 5 options/créneau
- `dailyActivityCompletionState.ts` — compteurs journaliers + gaps (révision 90 min)
- `resolveSportDuration.ts` + `adaptWorkoutSessionDuration.ts` — tranches 10–40 / 20–60, rounds+
- UI : `FreeTimeSuggestionModal` (multi-options), `SportProposalCard` (choix durée)
- Tests : `sprint47-diversity.test.ts` (A–P) — **622 tests** au vert

## Correctif révision & conversation (16 juillet 2026)

- `ensurePrimarySuggestionInList.ts` — recommandation principale injectée en 1re position (max 5)
- `getWeeklyStudyProgress.ts` — planned vs completed, semaine locale lundi–dimanche
- Modal Révision enrichie (tâche, objectif hebdo, révision libre)
- `FloatingConversationBar` dans `AppShell` sous header — z-index et padding ajustés
- Tests : `sprint47-revision.test.ts` (A–J), `conversation-layout.test.ts` (A–I) — **641 tests**

## Correctif ciblé — durée, planning, assistant compact (16 juillet 2026)

- `resolveStudyRevisionDuration.ts` — durée recommandée modifiable (10–60 + personnalisé)
- `computeEveningFreeSegments.ts` + `freeSlotEntries.ts` — **cause** révision masquée : bloc Temps libre soirée entier recouvrait l'INSERT
- `acceptStudyRevisionSuggestion()` — INSERT sans `generateAndSaveDayPlan`, message horaire précis
- `ConversationHeaderTrigger` — assistant compact header droite, panneau popover ; suppression `app-conversation-band`
- Tests : `sprint47-revision-duration.test.ts` (A–I), `conversation-layout.test.ts` (L–R) — **648 tests**

## Sprint 4.8 — Matin réaliste, exceptions travail, statistiques (17 juillet 2026)

- `buildMorningRoutineConstraints.ts` — réveil → petit déjeuner → préparation personnelle → enfants
- `morningWorkoutAutomaticallyAllowed` dans `LifeContext` — sport auto interdit matin workday
- `DayTimeline` — Temps libre : uniquement « Me proposer une activité »
- NLP : `workExceptionKind` (cancel, half_morning, half_afternoon, overrides) + clarification demi-journée
- `/statistics` + `statisticsService` — sport, révision, accomplissements, ressenti, spiritualité, loisirs
- Tests : `sprint48.test.ts` (A–T) — **668 tests**

## Sprint 4.8.1 — Stats menu, édition, demi-journées (17 juillet 2026)

- `appNavigationItems.ts` — Statistiques dans sidebar desktop + drawer (source unique)
- `HomePage` / `PlanningPage` — `EditBlockModal` + `canModifyTimelineEntry`
- NLP : demi-journée avant `cancel` ; clarification heure reprise ; `proposeHalfDayFreedActivity`
- Calendrier : badge demi-journée sur fond travail
- Tests : `sprint481.test.ts` (A–R) — **686 tests**

## Sprint 4.8.2 — Travail matin appliqué, Terminer, calendrier compact (17 juillet 2026)

- NLP : « Je travaille demain matin » → `work_morning_only` ; `enrichWorkEntities` ; réponses honnêtes (`NlpExecutionResult`)
- `verifyWorkBlocksInPlan` + `dispatchPlanRefresh` — fiabilité persistance + replan + blocs trajet/travail/trajet
- `completeTimelineEntry()` — Terminer indépendant du formulaire (Accueil + Planning)
- `MonthCalendar variant="planningCompact"` — layout `/planning` desktop/mobile
- Tests : `sprint482.test.ts` (A–N) — **701 tests**

## Sprint 4.8.3 — Planning sans calendrier, Annuler, clarification (17 juillet 2026)

- Suppression `MonthCalendar` de `/planning` — `DayNavigationBar` + lien `/calendar`
- `cancelTimelineEntry()` — annulation fiable avec feedback et anti double-clic
- `PendingConversationAction` — réponses horaires complètent la demande en cours
- Tests : `sprint483.test.ts` (A–R) — **718 tests**

## Sprint 5.0 — Coach personnel explicable (17 juillet 2026)

- `lifeReasoner.ts` — pipeline Contexte → Décision → Explication ; score confiance 0–100
- `HabitProfile` + `/my-ai` — habitudes apprises, corrections Exact/Faux
- `weeklyReviewEngine` — bilan dimanche encourageant
- `BalanceScore` + stats enrichies (tendances, régularité, 9 piliers)
- `proactiveCoachEngine` — initiative matin/soir
- Tests : `sprint50.test.ts` (A–N) — **732 tests**

## Sprint 5.1 — Mémoire vivante (17 juillet 2026)

- `livingMemoryEngine.ts` — mémoire durable (historique, check-ins, stats, corrections)
- `LivingHabitProfile` — métriques évolutives (durées, créneaux, annulations…)
- `habitTrendEngine.ts` — amélioration / dégradation / stabilité
- Niveau de connaissance + confiance globale sur `/my-ai`
- Insights avec preuves + validation Exact/Faux/Plus tard
- `dailyMissionEngine` + `weeklyMissionEngine` — missions personnalisées
- Adaptation automatique des durées proposées
- Tests : `sprint51.test.ts` (A–N) — **746 tests**

## Migrations requises

Aucune — champs timing et feedback dans `calendar_items.details` existant.

---

# Sprint 4 — Coach proactif

**Estimation : M (1 semaine)**
**Priorité : P1**
**Dépendances : Sprint 1, Sprint 3**

## Objectifs

Coach contextuel avec suggestions proactives, limites de fréquence, retour sur les rails.

## Tâches détaillées

- [ ] Créer `src/ai/coachEngine.ts`
- [ ] Créer `src/services/coachService.ts`
- [ ] Créer `coach_messages` (migration)
- [ ] Créer `CoachMessage.tsx` composant
- [ ] Déclencheurs : skip_count≥3, surcharge, dette sommeil, absence sport, régularité
- [ ] Limites : max 2 proactifs/jour, max 3 messages/jour
- [ ] Liste noire lexicale (AI_RULEBOOK)
- [ ] Explications sur chaque `plan_block`
- [ ] Propositions micro-sport et repos (sans Spotify auto)

## Fichiers probables

| Action | Fichier |
|--------|---------|
| Créer | `src/ai/coachEngine.ts` |
| Créer | `src/services/coachService.ts` |
| Créer | `src/components/coach/CoachMessage.tsx` |
| Créer | `supabase/migrations/00005_coach_messages.sql` |
| Modifier | `src/pages/HomePage.tsx` |

## Tables Supabase

| Table | Action |
|-------|--------|
| `coach_messages` | **Créer** |
| `journal_entries` | Lire humeur/énergie |
| `behavioral_signals` | Lire habitudes |

## Critères d'acceptation

- [ ] Max 2 suggestions proactives par jour respecté
- [ ] Aucun message de la liste noire
- [ ] skip_count≥3 → proposition micro-séance
- [ ] Surcharge → proposition allègement
- [ ] 3+ sport/semaine → encouragement sobre
- [ ] Chaque bloc planning a son explication visible

## Tests manuels

1. Déclencher chaque type de suggestion
2. Ignorer 2 messages → pas de 3e
3. Vérifier absence de contenu culpabilisant dans 20 scénarios

## Risques

| Risque | Mitigation |
|--------|------------|
| Messages trop fréquents | Compteur journalier strict |
| Ton inadapté | Templates validés manuellement |

---

# Sprint 5 — Mode couple

**Estimation : L (2 semaines)**
**Priorité : P2**
**Dépendances : Sprint 1, Sprint 4**

## Objectifs

Deux adultes dans un foyer, plannings synchronisés, proposition de relais.

## Tâches détaillées

- [ ] Migration `household_invitations`
- [ ] RPC `join_household_by_token`
- [ ] Page invitation / acceptation
- [ ] `HouseholdContext` — membres, disponibilités
- [ ] Planning agrégé : contraintes des 2 adultes
- [ ] Flux relais : proposition → accord Utilisateur A → notification Membre B → acceptation
- [ ] Mémoire individuelle (profile_facts par user_id)
- [ ] Tâches assignables à chaque adulte

## Fichiers probables

| Action | Fichier |
|--------|---------|
| Créer | `src/pages/InvitePartnerPage.tsx` |
| Créer | `src/contexts/HouseholdContext.tsx` |
| Créer | `src/services/invitationService.ts` |
| Créer | `supabase/migrations/00006_household_invitations.sql` |
| Modifier | `src/ai/planningEngine.ts` (multi-adulte) |
| Modifier | `src/ai/coachEngine.ts` (relais) |
| Modifier | `src/services/tasksService.ts` (assignation) |

## Tables Supabase

| Table | Action |
|-------|--------|
| `household_invitations` | **Créer** |
| `household_members` | Multi-membres |
| `tasks.assigned_to` | Exploiter |

## Critères d'acceptation

- [ ] Membre B reçoit invitation par email
- [ ] Membre B rejoint le foyer existant
- [ ] Chaque adulte a sa mémoire séparée
- [ ] Planning tient compte des 2 agendas
- [ ] Relais proposé → acceptation Membre B requise
- [ ] Refus Membre B → alternative sans culpabilité
- [ ] Mémoire privée de Utilisateur A non visible par Membre B

## Tests manuels

1. Utilisateur A invite Membre B → Membre B accepte → même foyer
2. Proposition relais → Membre B accepte → plannings sync
3. Membre B refuse → Utilisateur A a une alternative
4. Membre B en déplacement → contrainte temporaire

## Risques

| Risque | Mitigation |
|--------|------------|
| Complexité planning 2 adultes | MVP : relais manuels, pas optimisation globale |
| Vie privée | RLS strict par user_id pour journal/facts |

---

# Sprint 6 — Notifications et PWA

**Estimation : M (1 semaine)**
**Priorité : P2**
**Dépendances : Sprint 1, Sprint 4**

## Objectifs

Notifications web bienveillantes, PWA installable, mise à jour automatique.

## Tâches détaillées

- [ ] Configurer `manifest.json` + service worker (Vite PWA plugin)
- [ ] Migration `notification_preferences`
- [ ] Notifications : pré-créneau (-15 min), encouragement hebdo
- [ ] Limites : max 3/jour, jamais après bedtime
- [ ] Page paramètres notifications (opt-in/out par type)
- [ ] Mode « silence familial » (soirées)
- [ ] Icônes PWA, splash screen
- [ ] Documenter limites alarmes web (pas de réveil garanti)

## Fichiers probables

| Action | Fichier |
|--------|---------|
| Créer | `public/manifest.json` |
| Créer | `src/services/notificationService.ts` |
| Créer | `src/pages/SettingsPage.tsx` |
| Créer | `supabase/migrations/00007_notification_preferences.sql` |
| Modifier | `vite.config.ts` (PWA plugin) |
| Modifier | `index.html` |

## Tables Supabase

| Table | Action |
|-------|--------|
| `notification_preferences` | **Créer** |
| `plan_blocks` | Lire pour rappels |

## Critères d'acceptation

- [ ] App installable sur mobile (Android + iOS Safari)
- [ ] Notification pré-créneau fonctionne (avec permission)
- [ ] Max 3 notifications/jour respecté
- [ ] Aucune notification après bedtime
- [ ] Utilisateur peut tout désactiver
- [ ] Documentation claire : pas d'alarme réveil garantie

## Tests manuels

1. Installer PWA sur téléphone
2. Accepter notification → rappel 15 min avant créneau
3. Désactiver notifications → plus aucun push
4. Mode silence → pas de notif soir

## Risques

| Risque | Mitigation |
|--------|------------|
| iOS limites PWA | Documenter clairement |
| Notifications perçues comme culpabilisantes | Ton bienveillant, opt-in |

---

# Sprint 7 — Spotify et spiritualité

**Estimation : M (1 semaine)**
**Priorité : P3**
**Dépendances : Sprint 4, Sprint 6**

## Objectifs

Intégration Spotify volontaire, contenu spirituel facultatif.

## Tâches détaillées

- [ ] OAuth Spotify via Edge Function (pas de secret client)
- [ ] Migration `spotify_connections`
- [ ] Mapping `sport_music_preference` / `rest_preference` → playlists
- [ ] Bouton « Ouvrir Spotify » (jamais lecture auto)
- [ ] Minuterie repos native
- [ ] Module spiritualité dans coachEngine
- [ ] Contenus : verset, prière, encouragement, gratitude
- [ ] Fréquence selon `faith_importance`
- [ ] Aucune voix artificielle de relaxation

## Fichiers probables

| Action | Fichier |
|--------|---------|
| Créer | `supabase/functions/spotify-auth/` |
| Créer | `src/services/spotifyService.ts` |
| Créer | `src/components/rest/RestTimer.tsx` |
| Créer | `src/components/rest/SpotifyButton.tsx` |
| Créer | `supabase/migrations/00008_spotify_connections.sql` |
| Modifier | `src/ai/coachEngine.ts` (spiritualité) |

## Tables Supabase

| Table | Action |
|-------|--------|
| `spotify_connections` | **Créer** |
| `profile_facts` | Lire préférences musique/foi |

## Critères d'acceptation

- [ ] Spotify ne se lance jamais automatiquement
- [ ] Playlist proposée selon préférences mémoire
- [ ] Minuterie repos fonctionne sans Spotify
- [ ] Contenu spirituel uniquement si foi activée
- [ ] Max 1 contenu spirituel/jour
- [ ] Aucune pression si ignoré 3 fois
- [ ] Pas de voix synthétique de relaxation

## Tests manuels

1. Connecter Spotify → bouton ouvre bonne playlist
2. `faith_importance = disabled` → aucun contenu spirituel
3. Repos avec minuterie → fonctionne en arrière-plan PWA

## Risques

| Risque | Mitigation |
|--------|------------|
| OAuth complexité | Edge Function Supabase |
| Spotify API changes | Abstraction service |

---

# Sprint 8 — Vraie IA conversationnelle

**Estimation : XL (2-3 semaines)**
**Priorité : P3**
**Dépendances : Sprint 2, Sprint 3, Sprint 4**

## Objectifs

LLM conversationnel sécurisé via Edge Function, function calling, mémoire injectée.

## Tâches détaillées

- [ ] Edge Function `ai-chat` (Supabase)
- [ ] Intégration OpenAI API (clé serveur uniquement)
- [ ] System prompt basé sur AI_RULEBOOK
- [ ] Injection contexte : MemoryProfile + tâches + planning + journal
- [ ] Function calling : actions autorisées (cf. AI_RULEBOOK)
- [ ] Validation Decision Engine sur chaque action LLM
- [ ] Filtrage liste noire sur sorties
- [ ] Rate limiting (coûts)
- [ ] UI chat sur `/coach` ou panneau HomePage
- [ ] Historique session (mémoire court terme, pas de stockage verbatim long terme)

## Fichiers probables

| Action | Fichier |
|--------|---------|
| Créer | `supabase/functions/ai-chat/index.ts` |
| Créer | `src/services/aiChatService.ts` |
| Créer | `src/pages/CoachPage.tsx` |
| Créer | `src/components/coach/ChatPanel.tsx` |
| Modifier | `src/ai/decisionEngine.ts` (validation LLM) |

## Tables Supabase

| Table | Action |
|-------|--------|
| Toutes | Lecture via contexte injecté |
| `coach_messages` | Stocker réponses |

## Critères d'acceptation

- [ ] Aucune clé API dans le client
- [ ] LLM respecte les 9 principes non négociables
- [ ] Function calling ne peut pas contourner Decision Engine
- [ ] Coût plafonné par utilisateur/jour
- [ ] Conversation en français naturel
- [ ] Latence < 5s pour réponse simple

## Tests manuels

1. 24 dialogues AI_RULEBOOK via chat LLM
2. Tentative action interdite → bloquée par Decision Engine
3. Injection prompt → rejetée
4. Vérifier absence secrets dans bundle client

## Risques

| Risque | Mitigation |
|--------|------------|
| Coûts OpenAI | Rate limit + cache |
| Hallucinations | Decision Engine + faits uniquement |
| Latence | Streaming SSE |

---

# Sprint 9 — Tests familiaux

**Estimation : M (1 semaine)**
**Priorité : P0 — Validation finale V1**
**Dépendances : Sprint 0 à 4 minimum**

## Objectifs

Validation réelle par utilisateurs pilotes, corrections bugs, mesure pertinence.

## Tâches détaillées

- [ ] Protocole de test : 7 jours d'usage réel
- [ ] Scénarios documentés (matin enfants, fatigue, études, sport, couple)
- [ ] Collecte bugs dans issue tracker
- [ ] Mesure pertinence planning (% blocs acceptés)
- [ ] Mesure ton coach (aucune culpabilité ressentie)
- [ ] Ajustements UX mobile
- [ ] Corrections bugs P0/P1
- [ ] Rapport de test + décision go/no-go V1

## Fichiers probables

| Action | Fichier |
|--------|---------|
| Créer | `docs/TEST_PROTOCOL.md` |
| Créer | `docs/TEST_RESULTS.md` |
| Modifier | Selon bugs trouvés |

## Critères d'acceptation

- [ ] 7 jours d'usage sans bug bloquant
- [ ] ≥ 60 % des blocs planning acceptés
- [ ] 0 message culpabilisant rapporté
- [ ] Parcours onboarding fluide pour nouvel utilisateur
- [ ] Performance mobile acceptable
- [ ] Utilisateurs pilotes valident l'usage quotidien

## Tests manuels

| Jour | Scénario |
|------|----------|
| J1 | Onboarding complet + première discovery |
| J2 | Journée travail + enfants matin |
| J3 | Fatigue + allègement |
| J4 | Procrastination + micro-séance |
| J5 | Sport + repos |
| J6 | Surcharge + allègement |
| J7 | Bilan + ajustements |

## Risques

| Risque | Mitigation |
|--------|------------|
| Biais testeurs = créateurs | Tester aussi compte vierge |
| Fatigue de test | Scénarios courts, pas imposés |

---

# Synthèse

## Ordre recommandé

```
Sprint 0 ──► Sprint 1 ──► Sprint 2 ──► Sprint 3 ──► Sprint 4
                │                                        │
                │         ┌──────────────────────────────┤
                │         ▼                              ▼
                │    Sprint 9 (tests)              Sprint 5 (couple)
                │         │                              │
                ▼         ▼                              ▼
           Sprint 6 (PWA) ◄───────────────────── Sprint 7 (Spotify)
                │
                ▼
           Sprint 8 (LLM)
```

**Chemin critique vers V1 utilisable :** Sprint 0 → 1 → 2 → 3 → 4 → 9

**Chemin complet vers V1 riche :** + Sprint 5 → 6 → 7 → 8 → 9

## Estimations globales

| Sprint | Taille | Durée estimée |
|--------|--------|---------------|
| 0 — Stabilisation | S | 1 semaine |
| 1 — Planning V1 | L | 2 semaines |
| 2 — Conversation sans LLM | M | 1 semaine |
| 3 — Mémoire comportementale | M | 1 semaine |
| 4 — Coach proactif | M | 1 semaine |
| 5 — Mode couple | L | 2 semaines |
| 6 — Notifications PWA | M | 1 semaine |
| 7 — Spotify + spiritualité | M | 1 semaine |
| 8 — IA conversationnelle | XL | 2-3 semaines |
| 9 — Tests familiaux | M | 1 semaine |
| **Total** | | **~13-15 semaines** |

## Ce qui reste hors V1

| Fonctionnalité | Version cible | Raison |
|----------------|---------------|--------|
| IA conversationnelle LLM | V1.2 (Sprint 8) | Coût, complexité, pas nécessaire au MVP |
| Mode couple | V1.1 (Sprint 5) | MVP solo d'abord |
| Spotify | V1.2 (Sprint 7) | Dépendance externe |
| Notifications push | V1.1 (Sprint 6) | PWA requis d'abord |
| Planning hebdomadaire | V2 | V1 = journalier |
| Sync calendrier externe | V2 | Intégration complexe |
| Cuisine (questions) | V1.1 | Questions pas encore créées |
| ML / personnalisation avancée | V2+ | Données insuffisantes en V1 |
| App native iOS/Android | V2+ | PWA d'abord |
| Rapports hebdomadaires détaillés | V2 | Coach simple d'abord |

## Définition de V1.0 (rappel)

V1.0 = Sprints 0 à 4 + Sprint 9 validés.

L'utilisateur peut :
- S'inscrire, configurer son foyer, répondre au questionnaire
- Ajouter des tâches, les terminer, les reporter
- Voir un planning vivant journalier auto-généré
- Modifier le planning par commandes simples
- Recevoir des suggestions coach bienveillantes
- Bénéficier d'une mémoire qui s'enrichit

## Prochain sprint à lancer

### → Sprint A3 — Adaptateurs legacy pilote

Voir [`ROADMAP.md`](./Docs/ROADMAP.md) — Phase Fondation ✅ terminée.

**Justification :**
- Le build TypeScript est cassé (bloquant)
- Le flux login/onboarding est incorrect (expérience utilisateur)
- Les migrations ne sont pas versionnées (risque perte schéma)
- Aucun sprint suivant ne peut être construit sur une base instable

**Première tâche concrète :**
> Corriger `factsMap` inutilisé dans `DiscoveryPage.tsx` pour débloquer `npm run build`.

**Validation requise avant démarrage :**
- [ ] Approbation de `docs/PROJECT_BIBLE.md`
- [ ] Approbation de `docs/AI_RULEBOOK.md`
- [ ] Approbation de `docs/ROADMAP.md`

---

> **Fin de la ROADMAP**
>
> Ce document est mis à jour à la fin de chaque sprint.
> Dernière révision : 12 juillet 2026