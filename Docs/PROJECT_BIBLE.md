# Équilibre IA — PROJECT BIBLE

> **Document de référence projet** — subordonné à la [Constitution](./EQUILIBRE_AI_CONSTITUTION.md) (Loi 8)
>
> Version du document : 1.6.0
> Dernière mise à jour : 18 juillet 2026
> Statut : Document vivant — **subordonné à la Constitution**
>
> **Constitution (document le plus important) :** [`EQUILIBRE_AI_CONSTITUTION.md`](./EQUILIBRE_AI_CONSTITUTION.md)  
> **Troisième pilier :** [`ARCHITECTURE_GUARDIAN.md`](./ARCHITECTURE_GUARDIAN.md) · Dossier [`architecture/`](../architecture/)  
> En cas de contradiction, **la Constitution prévaut** (Loi 8).  
> Gouvernance : [`GOVERNANCE_REPORT.md`](./GOVERNANCE_REPORT.md)
>
> **Légende d'implémentation**
> - ✅ Implémenté (code existant)
> - 🚧 Partiellement implémenté
> - 📋 Planifié (non encore codé)
> - 💡 Vision long terme

---

## Table des matières

1. [Vision](#vision)
2. [Philosophie](#philosophie)
3. [Les grands modules](#les-grands-modules)
4. [Architecture technique](#architecture-technique)
5. [Base de données](#base-de-données)
6. [Les règles de l'IA](#les-règles-de-lia)
7. [Planning vivant](#planning-vivant)
8. [Journal invisible](#journal-invisible)
9. [Coach intelligent](#coach-intelligent)
10. [Vision Version 1.0](#vision-version-10)
11. [Annexes](#annexes)

---

# Vision

## Pourquoi cette application existe

Équilibre IA existe parce que **la vie moderne est complexe, fragmentée et émotionnellement chargée** — quelle que soit la configuration de foyer ou de métier.

Le produit est **officiellement universel** : personne seule, couple, famille, colocation, monoparentalité, recomposée, étudiant, retraité, artisan, agriculteur, militaire, travailleur de nuit, entrepreneur, et toute autre réalité déclarée par l'utilisateur.

Chacun jongle entre :

- obligations professionnelles ou personnelles (horaires, trajets, fatigue, travail de nuit) ;
- vie familiale ou relationnelle (enfants si applicable, couple, proches, colocataires) ;
- formation, reconversion ou projets personnels ;
- santé physique et mentale ;
- sommeil (souvent sacrifié) ;
- spiritualité (**uniquement si l'utilisateur active le module**) ;
- temps personnel (rare, précieux, souvent culpabilisant).

Les outils existants — agendas, ToDo, chatbots, apps de productivité — optimisent l'**activité**, pas la **vie**.

**Équilibre IA inverse cette logique.** L'utilisateur est une personne **fatiguée, bienveillante, imparfaite et humaine** — pas une machine d'optimisation.

## Mission produit

```
optimiser le temps → améliorer la vie
```

Le **planning est un outil** au service de cette mission, jamais la finalité.

## Environnement de test legacy

Un ancien environnement de test (prénoms fondateurs historiques) n'est **pas** un cas de référence produit. Voir Constitution ch. 1.

## Quel problème elle résout

### Problème central

> *« Je sais ce que je devrais faire, mais je n'arrive pas à trouver le bon moment, la bonne énergie, ni la bonne priorité — sans culpabiliser ma famille ni moi-même. »*

### Problèmes secondaires adressés

| Problème | Manifestation | Réponse d'Équilibre IA |
|----------|---------------|------------------------|
| **Surcharge cognitive** | Trop de choses en tête, rien n'est écrit | Capture simple des tâches + organisation automatique |
| **Charge mentale familiale** | Anticipation invisible (repas, devoirs, trajets) | Mémoire des routines enfants + protection des créneaux |
| **Procrastination bienveillante** | Reporter sans comprendre pourquoi | Analyse des causes + micro-étapes + compteur de reports |
| **Conflit priorités** | Travail vs enfants vs études vs repos | Moteur d'équilibre multi-piliers |
| **Agenda inadapté** | Cases vides ou surchargées sans contexte | Planning vivant contextuel |
| **Isolement** | Porter seul l'organisation | Foyer multi-membres + partage explicite |
| **Perte de sens** | Productivité sans alignement personnel | Module spiritualité optionnel + journal invisible |

### Ce que l'application ne cherche PAS à faire

- Remplacer un agenda professionnel d'équipe (Outlook, Google Workspace)
- Être une application de contrôle parental
- Maximiser la productivité au détriment du bien-être
- Imposer une méthode unique (Pomodoro, GTD, etc.)
- Diagnostiquer des troubles médicaux ou psychologiques

## Pourquoi elle est différente d'un agenda classique

### Comparaison fondamentale

| Dimension | Agenda classique | Équilibre IA |
|-----------|------------------|--------------|
| **Point de départ** | L'utilisateur planifie | L'application propose |
| **Données** | Événements saisis manuellement | Mémoire progressive + contraintes familiales |
| **Adaptation** | Statique (l'utilisateur modifie) | Dynamique (replanification automatique) |
| **Échec** | Tâche en retard = case rouge | Report compté + adaptation + jamais de culpabilité |
| **Contexte** | Heure + titre | Énergie, enfants, sommeil, spiritualité, procrastination |
| **Temporalité** | Jour / semaine fixe | Planning *vivant* qui respire |
| **Relation** | Outil passif | Coach accompagnant |
| **Données sensibles** | Calendrier externe | Mémoire privée du foyer |

### Les trois différenciateurs clés

#### 1. La mémoire progressive

Un agenda classique ne sait rien de vous. Équilibre IA **apprend** :

- qui prépare les enfants le matin,
- combien de temps cela prend réellement,
- à quelle heure les enfants partent,
- comment vous vous sentez après le travail,
- ce qui vous fait procrastiner,
- combien d'heures de sommeil vous avez besoin,
- si la foi a une place dans votre quotidien.

Cette mémoire alimente **chaque décision** de planification.

#### 2. Le planning vivant

Un agenda affiche ce que vous y avez mis. Équilibre IA **recalcule** :

- quand une tâche est reportée (`skip_count`),
- quand l'énergie du jour est basse,
- quand une contrainte familiale apparaît,
- quand le coucher approche et qu'il faut protéger le sommeil.

Le planning n'est pas un contrat — c'est une **proposition révisable**.

#### 3. L'accompagnement sans culpabilité

Un agenda vous montre ce que vous n'avez pas fait. Équilibre IA :

- compte les reports sans juger,
- propose des versions plus petites des tâches évitées,
- explique *pourquoi* elle a choisi un créneau,
- célèbre la régularité plutôt que la perfection.

---

# Philosophie

## Principes fondateurs

### L'application ne donne pas des ordres

Équilibre IA ne dit jamais *« Tu dois faire X à 14h »*. Elle dit :

> *« Voici ce que je te propose pour cet après-midi, en tenant compte de ton énergie et de la récupération des enfants à 16h30. Tu peux accepter, modifier ou reporter — sans conséquence négative. »*

**Implications techniques :**
- Toute proposition de planning est **modifiable** en un geste
- Aucune notification culpabilisante du type *« Tu as raté ta tâche »*
- Le statut `skipped` est neutre, pas punitif
- Le coach explique, ne condamne pas

### Elle accompagne

L'accompagnement se manifeste à trois niveaux :

1. **Onboarding progressif** — on ne demande pas 50 informations d'un coup
2. **Découverte quotidienne** — 5 questions par session, pas un interrogatoire
3. **Coach contextuel** — messages adaptés au moment, à l'humeur, à l'historique

L'utilisateur n'est jamais seul face à une liste de tâches.

### Elle apprend

Chaque interaction enrichit la mémoire :

| Action utilisateur | Apprentissage |
|-------------------|---------------|
| Répondre à une question découverte | Nouveau `profile_fact` |
| Reporter une tâche | `skip_count++`, pattern de procrastination |
| Terminer une tâche | Créneau/productivité validé |
| Modifier un créneau proposé | Préférence implicite |
| Ignorer une recommandation | Signal négatif pour le moteur |

L'apprentissage est **progressif et réversible** — l'utilisateur peut corriger ses réponses.

### Elle adapte

L'adaptation opère sur quatre axes :

- **Temporel** — déplacer les tâches selon les contraintes du jour
- **Énergétique** — placer les tâches exigeantes aux moments de forte énergie
- **Granulaire** — découper les tâches longues en micro-séances
- **Émotionnel** — proposer du repos, de la musique, un encouragement

### Elle ne culpabilise jamais

**Règle absolue, non négociable.**

Interdictions lexicales dans toute interface et tout message IA :

- ❌ « Tu n'as pas fait… »
- ❌ « Encore en retard »
- ❌ « Tu devrais avoir… »
- ❌ « Échec » / « Raté »

Formulations encouragées :

- ✅ « On peut essayer autrement »
- ✅ « Demain sera une nouvelle occasion »
- ✅ « Voici une version plus légère »
- ✅ « Tu as déjà avancé sur… »

### L'équilibre multi-piliers

L'application cherche toujours le meilleur équilibre entre sept piliers :

```
                    ┌─────────────┐
                    │   FAMILLE   │
                    └──────┬──────┘
           ┌───────────────┼───────────────┐
           │               │               │
     ┌─────▼─────┐   ┌─────▼─────┐   ┌─────▼─────┐
     │  TRAVAIL  │   │  ÉTUDES   │   │   SANTÉ   │
     └─────┬─────┘   └─────┬─────┘   └─────┬─────┘
           │               │               │
           └───────────────┼───────────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
        ┌─────▼─────┐ ┌────▼────┐ ┌─────▼──────┐
        │  SOMMEIL  │ │SPIRITUA-│ │   TEMPS    │
        │           │ │  LITÉ   │ │ PERSONNEL  │
        └───────────┘ └─────────┘ └────────────┘
```

**Hiérarchie de protection (non écrasable par l'IA) :**

1. **Sommeil** — jamais sacrifié pour une tâche non urgente
2. **Famille** — routines enfants protégées (matin, soir)
3. **Santé** — minimum de mouvement maintenu
4. **Travail** — contraintes horaires respectées
5. **Études** — adaptées à l'énergie disponible
6. **Spiritualité** — proposée, jamais imposée
7. **Temps personnel** — préservé quand possible

Cette hiérarchie est implémentée dans le **Decision Engine** (voir Architecture technique).

---

# Les grands modules

Chaque module est décrit selon quatre axes :
- **Objectif** — pourquoi ce module existe
- **Fonctionnement** — comment il opère (état actuel + vision)
- **Données utilisées** — tables, facts, contexte
- **Interactions** — liens avec les autres modules

---

## 1. Authentification

**Statut : ✅ Implémenté**

### Objectif

Garantir un accès sécurisé et personnel à l'espace familial. Chaque utilisateur possède son compte, ses préférences et sa mémoire — tout en pouvant partager un foyer (mode couple, vision).

### Fonctionnement

| Étape | Comportement actuel | Comportement cible |
|-------|---------------------|-------------------|
| Inscription | Email + mot de passe (≥ 8 car.) + prénom en `user_metadata` | Identique + confirmation email |
| Connexion | `signInWithPassword` → redirection `/onboarding/household` | Redirection intelligente selon profil |
| Session | `getSession()` + `onAuthStateChange` via `AuthContext` | Identique + refresh silencieux |
| Déconnexion | `signOut()` → `/login` | Identique |

**Fichiers concernés :**
- `src/contexts/AuthContext.tsx`
- `src/pages/LoginPage.tsx`
- `src/pages/SignupPage.tsx`
- `src/lib/supabase/client.ts`

**Flux cible post-authentification :**

```
Connexion réussie
    │
    ├─ Pas de foyer ? ──────────────► /onboarding/household
    ├─ Foyer sans onboarding ? ─────► /onboarding/children
    ├─ Profil de base incomplet ? ──► /onboarding/profile
    └─ Tout complet ? ──────────────► /home
```

### Données utilisées

| Source | Champs |
|--------|--------|
| `auth.users` | `id`, `email`, `user_metadata.first_name` |
| `profiles` | `id`, `onboarding_completed`, `created_at`, `updated_at` |

### Interactions

| Module | Interaction |
|--------|-------------|
| Foyer | L'utilisateur authentifié crée/rejoint un foyer |
| Profil | `user.id` lie les `profile_facts` |
| Toutes les pages protégées | `ProtectedRoute` vérifie `user !== null` |
| Mode couple (futur) | Invitation par email vers un foyer existant |

---

## 2. Foyer (Household) — entité centrale

> **Décision officielle (Constitution ch. 6) :** le foyer est l'**entité principale** du produit. Les utilisateurs appartiennent à un foyer.

**Statut : 🚧 Partiellement implémenté** — structure de base en place ; modèle multi-membres complet et remplacement de `partner_name` à venir (Sprint F2).

### Objectif

Le foyer est l'unité organisationnelle **centrale**. Il regroupe un ou plusieurs membres (adultes, enfants, animaux si applicable), leurs plannings individuels, leurs objectifs, contraintes, habitudes, préférences, droits et niveaux d'autonomie IA.

Chaque membre possède son identité et son planning — **le conjoint n'est pas un simple texte** (`partner_name` = legacy en retrait).

### Fonctionnement

**Création (actuel) :**
1. L'utilisateur saisit le nom du foyer et son prénom d'affichage
2. Appel RPC `create_household_for_current_user(household_name, display_name)`
3. La RPC crée le foyer + l'adhésion dans `household_members`
4. Redirection vers `/onboarding/children` *(interim — cible : onboarding conversationnel + option « Je n'ai pas d'enfant »)*

**Règles métier :**
- Un utilisateur appartient à **un seul foyer** (V1)
- Le créateur du foyer est membre avec rôle implicite « admin »
- Le nom du foyer est **libre** — aucun nom fondateur imposé (ex. « Famille Belot » = legacy test only)
- **Cible :** invitation de membres (conjoint, colocataire, etc.) comme entités `household_members`, pas comme champ texte

**Fichiers concernés :**
- `src/pages/HouseholdPage.tsx`
- `src/services/profileFactsService.ts` (`getCurrentHouseholdId`)

### Données utilisées

| Table | Champs clés |
|-------|-------------|
| `households` | `id`, `name`, `created_at` |
| `household_members` | `household_id`, `user_id`, `display_name`, `role` |

### Interactions

| Module | Interaction |
|--------|-------------|
| Enfants | Liés par `household_id` |
| Tâches | Scope foyer (`household_id`) |
| Profile facts | Chaque fact porte un `household_id` |
| Mode couple | Second adulte rejoint le même `household_id` |
| Planning vivant | Contraintes calculées au niveau foyer |

---

## 3. Enfants

**Statut : ✅ Implémenté**

### Objectif

Modéliser les membres enfants du foyer pour que l'application comprenne les contraintes familiales réelles (âge, routines, horaires de départ).

### Fonctionnement

**Ajout d'un enfant :**
1. Prénom (obligatoire)
2. Date de naissance (facultative — permet calcul d'âge futur)
3. Insertion dans `children` avec `household_id`
4. Possibilité d'ajouter plusieurs enfants avant de terminer

**Fin de configuration :**
- Mise à jour `profiles.onboarding_completed = true`
- Redirection vers `/home` (cible : `/onboarding/profile`)

**Usages futurs de l'âge :**
- Adapter la durée des routines (bébé vs ado)
- Suggérer des créneaux devoirs selon le niveau scolaire
- Anticiper les vacances scolaires (V2+)

**Fichiers concernés :**
- `src/pages/ChildrenPage.tsx`

### Données utilisées

| Table | Champs |
|-------|--------|
| `children` | `id`, `household_id`, `first_name`, `birth_date`, `created_at` |

### Interactions

| Module | Interaction |
|--------|-------------|
| Découverte | Questions sur routines matin/soir enfants |
| Mémoire | `morning_children_duration`, `children_departure_time`, `children_evening_routine` |
| Planning vivant | Blocs « routine enfants » protégés |
| Coach | Rappels contextuels liés aux enfants |

---

## 4. Profil

**Statut : 🚧 Partiellement implémenté**

### Objectif

Capturer les informations de base nécessaires avant la découverte approfondie : horaires de travail, sommeil, priorité principale, conjoint.

### Fonctionnement

**Profil de base (`/onboarding/profile`) :**

| Champ UI | Clé `profile_facts` | Structure `fact_value` |
|----------|---------------------|------------------------|
| Prénom conjoint | `partner_name` | `{ value: string \| null }` |
| Début travail | `work_schedule` | `{ start: time, end: time }` |
| Fin travail | (même fact) | |
| Heure réveil | `sleep_schedule` | `{ wake_time: time, bed_time: time }` |
| Heure coucher | (même fact) | |
| Priorité principale | `main_priority` | `{ value: enum }` |

**Priorités possibles :** `family`, `study`, `sleep`, `sport`, `personal_time`, `work`

**Problème connu :** ces facts ne sont pas encore lus par `memoryEngine.ts`. Intégration planifiée pour le planning vivant V1.

### Données utilisées

| Table | Clés |
|-------|------|
| `profile_facts` | `partner_name`, `work_schedule`, `sleep_schedule`, `main_priority` |

### Interactions

| Module | Interaction |
|--------|-------------|
| Mémoire | Alimente le profil structuré (cible) |
| Planning vivant | Horaires de travail = contraintes dures |
| Découverte | Complète et affine le profil de base |
| Coach | Priorité principale oriente les messages |

---

## 5. Découverte progressive

**Statut : ✅ Implémenté**

### Objectif

Apprendre progressivement le quotidien de l'utilisateur sans l'épuiser, via un questionnaire adaptatif de 5 questions par session.

### Fonctionnement

**Configuration :** `src/config/discoveryQuestions.ts` — 20 questions réparties en 11 catégories.

**Catégories :**
`family`, `children`, `work`, `studies`, `sleep`, `energy`, `procrastination`, `sport`, `music`, `rest`, `spirituality`

**Types de questions :**
- `text` — saisie libre
- `number` — valeur numérique
- `time` — horaire
- `select` — choix unique (boutons)
- `multi-select` — choix multiples

**Logique adaptative :**

```
Pour chaque question :
  1. Déjà répondue ? → exclure
  2. Dépendance non satisfaite ? → exclure
  3. Sinon → éligible

Prendre les 5 premières éligibles pour la session
```

**Exemples de dépendances :**
- `study_weekly_target` dépend de `studies_active = "yes"`
- `faith_content_preferences` dépend de `faith_importance ≠ "disabled"`

**Persistance :**
- Upsert dans `profile_facts` via `saveProfileFact()`
- `source: "progressive_discovery"`
- `confidence: 1`
- `last_asked_at: now()`

**Fichiers concernés :**
- `src/config/discoveryQuestions.ts`
- `src/pages/DiscoveryPage.tsx`
- `src/services/profileFactsService.ts`

### Données utilisées

| Table | Détail |
|-------|--------|
| `profile_facts` | 20 clés discovery (voir annexe A) |
| `household_members` | Résolution `household_id` |

### Interactions

| Module | Interaction |
|--------|-------------|
| Mémoire | Chaque réponse → `buildMemoryProfile()` |
| Tableau de bord | Progression « Je te connais à X % » |
| Planning vivant | Contraintes dérivées des réponses |
| Coach | Insights personnalisés |
| Spotify | Préférences musicales (`sport_music_preference`, `rest_preference`) |

---

## 6. Mémoire

**Statut : 🚧 Partiellement implémenté**

### Objectif

Transformer les `profile_facts` bruts en profil structuré exploitable par le planning, le coach et l'IA conversationnelle.

### Fonctionnement

**Pipeline actuel :**

```
profile_facts (DB)
       │
       ▼
buildMemoryProfile()     → MemoryProfile (objet typé)
       │
       ├──► generateMemoryInsights()  → MemoryInsight[] (recommandations)
       │
       └──► calculateKnowledgeProgress() → number (0-100%)
```

**`MemoryProfile` — structure :**

```typescript
{
  morningResponsibility?: string;      // qui prépare les enfants
  morningDurationMinutes?: number;     // durée réelle matin
  childrenDepartureTime?: string;      // heure départ
  eveningRoutine: string[];           // tâches soir enfants
  workDays: string[];                 // jours travaillés
  commuteMinutes?: number;            // trajet
  afterWorkEnergy?: string;           // énergie post-travail
  studiesActive?: boolean;
  studyWeeklyHours?: number;
  studyBestPeriod?: string;
  procrastinationCauses: string[];
  preferredFocusMinutes?: number;
  sleepNeededHours?: number;
  sleepProblems: string[];
  sportInterests: string[];
  sportMinimumMinutes?: number;
  sportMusic: string[];
  restPreferences: string[];
  faithImportance?: string;
  faithContent: string[];
}
```

**Insights générés (règles actuelles) :**

| ID | Condition | Priorité |
|----|-----------|----------|
| `protect-children-morning` | matin ≥ 45 min | high |
| `avoid-study-after-work` | énergie basse + études actives | high |
| `study-session-splitting` | heures études + durée focus | medium |
| `reduce-task-entry` | procrastination too_long / unclear_start | high |
| `protect-bedtime` | sommeil late_tasks / late_bedtime | high |
| `micro-sport` | sport_minimum défini | medium |
| `personalized-rest` | préférences repos renseignées | medium |
| `faith-support` | foi activée | low |

**Évolution prévue — Memory Engine V2 :**
- Intégrer `work_schedule`, `sleep_schedule`, `main_priority`
- Lire les enfants du foyer (âges, prénoms)
- Historique des `skip_count` par catégorie
- Score d'énergie par créneau horaire
- Patterns de procrastination temporels

**Fichiers concernés :**
- `src/ai/memoryEngine.ts`
- `src/pages/HomePage.tsx` (affichage insights)

### Données utilisées

| Source | Usage |
|--------|-------|
| `profile_facts` | Source principale |
| `children` | Futur : contraintes par enfant |
| `tasks.skip_count` | Futur : patterns de report |

### Interactions

| Module | Interaction |
|--------|-------------|
| Découverte | Alimente les facts |
| Planning vivant | Contraintes + préférences |
| Coach | Base des messages |
| Tâches | Analyse des reports |
| Journal invisible | Corrélation humeur ↔ patterns |
| Decision Engine | Entrée principale |

---

## 7. Tâches

**Statut : ✅ Implémenté (CRUD partiel)**

### Objectif

Permettre à l'utilisateur de capturer ce qu'il doit faire, avec assez de métadonnées pour que le planning vivant puisse les organiser intelligemment.

### Fonctionnement

**Création d'une tâche :**

| Champ | Type | Obligatoire | Usage planning |
|-------|------|-------------|----------------|
| `title` | string | ✅ | Affichage |
| `description` | string | ❌ | Contexte coach |
| `category` | enum | ✅ | Priorisation par pilier |
| `estimated_minutes` | number | ✅ | Placement créneau |
| `due_at` | datetime | ❌ | Urgence |
| `priority` | 1-5 | ✅ | Ordre de placement |
| `splittable` | boolean | ✅ | Découpage micro-séances |

**Catégories :**
`family`, `children`, `studies`, `work`, `home`, `sport`, `rest`, `personal`, `spirituality`, `other`

**Statuts :**

| Statut | Signification | Implémenté |
|--------|---------------|------------|
| `todo` | À planifier | ✅ |
| `planned` | Créneau assigné | 📋 |
| `in_progress` | En cours | 📋 |
| `done` | Terminée | ✅ |
| `skipped` | Reportée | ✅ |
| `cancelled` | Annulée | 📋 |

**Compteur `skip_count` :**
- Incrémenté à chaque report
- Affichage : « ↩️ X report(s) »
- Alerte UI si ≥ 3 : proposition future de version plus petite
- Futur : déclenchement automatique du découpage par le coach

**Actions disponibles :**
- ✅ Créer
- ✅ Lister (foyer, hors `cancelled`)
- ✅ Terminer (`done`)
- ✅ Reporter (`skipped` + `skip_count++`)
- 📋 Modifier
- 📋 Supprimer / annuler
- 📋 Réassigner (mode couple)

**Fichiers concernés :**
- `src/services/tasksService.ts`
- `src/pages/TasksPage.tsx`

### Données utilisées

| Table | Champs |
|-------|--------|
| `tasks` | Tous les champs listés ci-dessus |

### Interactions

| Module | Interaction |
|--------|-------------|
| Planning vivant | Source des blocs planifiés |
| Mémoire | `skip_count` → patterns procrastination |
| Coach | Suggestions micro-tâches si reports élevés |
| Tableau de bord | Résumé tâches du jour |
| Notifications | Rappels pré-créneau (futur) |

---

## 8. Planning vivant

**Statut : 📋 Planifié**

### Objectif

Proposer automatiquement une organisation intelligente de la journée (puis de la semaine) en croisant mémoire, tâches, contraintes et énergie — avec replanification dynamique.

*Voir section dédiée [Planning vivant](#planning-vivant) pour le détail complet.*

### Fonctionnement (résumé)

1. Collecter contraintes dures (travail, enfants, sommeil)
2. Identifier créneaux libres
3. Classer tâches par priorité, échéance, énergie requise
4. Placer les tâches dans les créneaux compatibles
5. Proposer le planning à l'utilisateur
6. Replanifier à chaque report, modification ou nouveau fait

### Données utilisées

| Source | Données |
|--------|---------|
| `profile_facts` | Horaires, énergie, routines |
| `tasks` | Tâches `todo` et `skipped` |
| `children` | Contraintes familiales |
| `plan_blocks` (futur) | Créneaux planifiés |

### Interactions

| Module | Interaction |
|--------|-------------|
| Mémoire | Contraintes et préférences |
| Tâches | Passage `todo` → `planned` |
| Coach | Explication des choix |
| Tableau de bord | Timeline du jour |
| Notifications | Rappels avant créneaux |
| Spotify | Ambiance pendant créneaux sport/repos |

---

## 9. Coach IA

**Statut : 📋 Planifié (insights statiques ✅)**

### Objectif

Accompagner l'utilisateur avec des messages contextuels, bienveillants et explicatifs — pas un chatbot générique, mais un coach qui *connaît* le foyer.

### Fonctionnement

**Phase actuelle (V0) :**
- Insights statiques générés par règles (`generateMemoryInsights`)
- Affichés sur `/home` sans interactivité

**Phase cible (V1) :**
- Messages contextuels selon l'heure, le jour, les tâches
- Explication des choix de planning
- Suggestions proactives (micro-tâche, pause, encouragement)
- Ton toujours bienveillant, jamais culpabilisant

**Phase long terme :**
- LLM avec contexte mémoire injecté
- Conversation naturelle en français
- Proactivité limitée (pas de spam)

*Voir section dédiée [Coach intelligent](#coach-intelligent).*

### Données utilisées

| Source | Usage |
|--------|-------|
| `MemoryProfile` | Contexte personnalisé |
| `tasks` | État du jour |
| `plan_blocks` | Planning en cours |
| `journal_entries` (futur) | Humeur récente |

### Interactions

| Module | Interaction |
|--------|-------------|
| Mémoire | Personnalisation |
| Planning vivant | Explication des créneaux |
| Tâches | Suggestions de découpage |
| Spiritualité | Encouragements chrétiens (si activé) |
| Notifications | Messages push |

---

## 10. Mode couple

**Statut : 📋 Planifié**

### Objectif

Permettre à deux adultes de partager un foyer, voir les tâches communes, répartir la charge et coordonner le planning familial.

### Fonctionnement (vision)

1. L'admin du foyer invite le conjoint par email
2. Le conjoint crée un compte ou se connecte
3. Rejoint le même `household_id` via RPC `join_household`
4. Chaque adulte a sa propre mémoire (`profile_facts` par `user_id`)
5. Les tâches peuvent être assignées à l'un ou l'autre
6. Le planning affiche les contraintes des deux adultes

**Cas d'usage :**
- « Qui récupère les enfants ce soir ? »
- Répartition automatique selon `morning_children_responsibility`
- Vue partagée des tâches foyer

### Données utilisées

| Table | Extension |
|-------|-----------|
| `household_members` | Multi-utilisateurs, rôles |
| `household_invitations` (futur) | Tokens d'invitation |
| `tasks.assigned_to` | Déjà présent, à exploiter |

### Interactions

| Module | Interaction |
|--------|-------------|
| Foyer | Base du partage |
| Tâches | Assignation |
| Planning vivant | Contraintes des deux adultes |
| Mémoire | Mémoire individuelle, planning partagé |

---

## 11. Spotify

**Statut : 📋 Planifié**

### Objectif

Enrichir les créneaux sport, repos et focus avec une ambiance musicale adaptée aux préférences de l'utilisateur.

### Fonctionnement (vision)

1. L'utilisateur connecte son compte Spotify (OAuth)
2. Les préférences sont lues depuis la mémoire :
   - `sport_music_preference` → playlists énergisantes
   - `rest_preference` → ambient, podcasts, silence
3. Lors d'un créneau planifié « sport » ou « repos », l'app propose de lancer la playlist
4. Intégration via Spotify Web API (lecture, pas contrôle complet)

**Préférences musicales collectées (déjà en place) :**
- Pop dynamique, Rock, Électro, Musique chrétienne dynamique, Rap, Découverte

### Données utilisées

| Source | Usage |
|--------|-------|
| `profile_facts` | `sport_music_preference`, `rest_preference` |
| `spotify_tokens` (futur) | OAuth tokens |
| `plan_blocks` | Type de créneau → playlist |

### Interactions

| Module | Interaction |
|--------|-------------|
| Mémoire | Préférences musicales |
| Planning vivant | Créneaux sport/repos |
| Coach | « Voici une playlist pour ta séance » |

---

## 12. Journal invisible

**Statut : 📋 Planifié**

### Objectif

Collecter des signaux émotionnels et contextuels légers sans demander à l'utilisateur de « tenir un journal » — d'où le qualificatif *invisible*.

*Voir section dédiée [Journal invisible](#journal-invisible-1).*

### Fonctionnement (résumé)

- Micro-questions contextuelles (1 par jour max)
- Collecte passive : reports, validations, modifications de planning
- Pas d'interface « journal » dédiée
- Alimente le Decision Engine pour affiner les propositions

### Données utilisées

| Table (futur) | Contenu |
|---------------|---------|
| `journal_entries` | Humeur, énergie, contexte |
| `behavioral_signals` | Reports, modifications, validations |

### Interactions

| Module | Interaction |
|--------|-------------|
| Mémoire | Enrichissement implicite |
| Coach | Messages adaptés à l'humeur |
| Planning vivant | Ajustement énergie du jour |
| Decision Engine | Signaux comportementaux |

---

## 13. Notifications

**Statut : 📋 Planifié**

### Objectif

Rappeler gentiment les créneaux importants sans devenir intrusif ni culpabilisant.

### Fonctionnement (vision)

**Types de notifications :**

| Type | Exemple | Timing |
|------|---------|--------|
| Pré-créneau | « Dans 15 min : séance d'étude (25 min) » | -15 min |
| Transition | « Les enfants partent dans 30 min » | Contextuel |
| Encouragement | « Belle régularité cette semaine sur le sport » | Hebdomadaire |
| Découverte | « 3 nouvelles questions pour mieux t'accompagner » | Quotidien max |
| Coach | « Ta tâche a été reportée 3 fois — on essaie une version plus courte ? » | Après 3e report |

**Règles strictes :**
- Maximum 3 notifications par jour
- Jamais après l'heure de coucher (`sleep_schedule.bed_time`)
- Jamais de ton culpabilisant
- Désactivables par catégorie
- Mode « silence familial » (soirées, week-ends)

### Données utilisées

| Source | Usage |
|--------|-------|
| `plan_blocks` | Créneaux à rappeler |
| `profile_facts` | Heure coucher, préférences |
| `notification_preferences` (futur) | Opt-in/out par type |

### Interactions

| Module | Interaction |
|--------|-------------|
| Planning vivant | Source des rappels |
| Coach | Messages proactifs |
| Spiritualité | Verset du matin (si activé) |

---

## 14. Tableau de bord

**Statut : 🚧 Partiellement implémenté (`/home`)**

### Objectif

Offrir une vue d'ensemble bienveillante de la journée : mémoire, insights, planning, tâches — le point d'entrée principal après connexion.

### Fonctionnement

**État actuel (`HomePage`) — Sprint 2.8 :**
- Carte `MotivationCard` compacte (phrase du jour, lien espace spirituel, temps calme)
- Masquée si `spiritual_show_on_home = no`
- Si `faith_importance = disabled` : phrase neutre uniquement

**État actuel — Sprint 2.8 (`/spiritual`) :**
- Page dédiée : Aujourd'hui, temps pour moi, recentrage, prière, favoris, préférences
- Bibliothèque locale `spiritualContent.ts` (versets Louis Segond 1910)
- Ajout au planning via `spiritualPlanningService`

**État actuel (`HomePage`) — Sprint 4.5 :**
- Calendrier **retiré du header** — intégré au menu ☰ (`DrawerCalendarSection`, variant `drawer`)
- Défaut `calendar_widget_position` = `drawer` (desktop et mobile)

**Complément sport (Sprint 4.5) :**
- Créneaux libres pertinents → **« Activité sportive proposée »** avec séance `WorkoutSession` déjà générée
- Boutons : Voir la séance, Faire cette séance, Proposer une autre séance, Décaler, Je n'ai pas le temps
- Préférences : Profil → Sport (`sport_settings` jsonb)
- Moteur : `workoutGenerationEngine.ts` + bibliothèque exercices originale

**État actuel (`HomePage`) — Sprint 4.6 :**
- Widget compact **« Comment te sens-tu ? »** (`DailyCheckinWidget`) — humeur du jour + intensité facultative
- Check-in persisté dans `daily_checkins` ; le Life Engine adapte le remplissage et le sport proposé
- **Faire la séance** ouvre `WorkoutSessionPlayer` (chrono guidé, pause, fin partielle ou complète)
- RDV Sport créé manuellement reconnu via `classifyCalendarItemActivity` — mêmes actions que les propositions auto
- Décaler / rallonger un bloc → `replanAfterBlockMove` + absorption par temps libre (`FlexibleBuffer`)

**État actuel — Sprint 4.7 :**
- Toute activité terminée affiche un **statut clair** (« Séance effectuée », « Tâche terminée », etc.) avec style distinct
- **Feedback immédiat** via `achievementFeedbackEngine` — messages variés, non infantilisants, anti-répétition
- **Réalisation en avance** reconnue (`evaluateCompletionTiming`) ; temps restant libéré sans remplissage auto
- Heures réelles et delta enregistrés dans `calendar_items.details` — **persistants après F5**
- Carte compacte `RecentAchievementWidget` sur accueil et planning après un accomplissement récent
- Événements enrichis dans `task_activity_events.metadata` (`completedEarly`, `feedbackId`, etc.)

**Correctif Sprint 4.7 — temporalité & planning :**
- Séance sport **uniquement le jour prévu** (`resolveWorkoutAvailability`) — message explicite si séance future ; bouton « Voir la séance d'aujourd'hui »
- Complétion **bloquée avant écriture Supabase** si date bloc ≠ aujourd'hui (`resolveBlockCompletionAvailability`)
- Soirée = **un bloc Temps libre** + **une suggestion facultative** (`primarySuggestion`) — pas de découpage automatique
- Durées naturelles via `resolveSuggestedActivityDuration` (couple = soirée, film long, sport court)

**Correctif Sprint 4.7 — suggestions diversifiées & durées sport :**
- `ACTIVITY_REPEAT_RULES` — limites par catégorie (sport 1× auto/jour, révision 3× avec gap 90 min, etc.)
- Modal « Me proposer une activité » → **jusqu'à 5 options** (révision, lecture, couple, calme, garder libre…)
- `DailyActivityUsage` — compteurs journaliers au lieu du binaire « déjà fait = interdit » (sauf sport auto)
- Durées sport : **10–40 min** (pas de 5) hors course ; **20–60 min** course à pied
- `adaptWorkoutSessionDuration()` — rallongement par rounds, structure conservée
- `SportProposalCard` — changement de durée immédiat + absorption temps libre adjacent si besoin

**Correctif Sprint 4.8 — matin réaliste, travail & statistiques :**
- `buildMorningRoutineConstraints` — petit déjeuner distinct de la préparation enfants + préparation personnelle
- `morningWorkoutAutomaticallyAllowed` — pas de sport/proposition auto avant travail un jour ouvré
- Temps libre : bouton unique « Me proposer une activité » (pas d'actions sur créneau non accepté)
- NLP exceptions travail : demi-journées, repos ponctuel, horaires override (`workExceptionKind`)
- Page `/statistics` — semaine / mois / année via `statisticsService`

**Correctif Sprint 4.8.1 — stats menu, édition, demi-journées :**
- `appNavigationItems.ts` — source unique navigation ; Statistiques visible sidebar desktop + drawer
- `HomePage` + `TodayTimelineWidget` — `EditBlockModal` et `onEditEntry` pour activités persistées
- `canModifyTimelineEntry` + `canModify` sur `BlockActionsMenu` — pas de bouton Modifier inutile
- NLP demi-journée : `half_morning` avant `cancel` ; clarification sans 13 h inventé ; types `no_work_morning` / `no_work_afternoon`
- Calendrier : badge « Matin libre » / « Après-midi libre » sur fond travail
- `proposeHalfDayFreedActivity` — une proposition selon école, week-end, fatigue

**Correctif Sprint 4.8.2 — travail matin appliqué, Terminer fiable, calendrier compact :**
- NLP « Je travaille demain matin » → `work_morning_only` sans exiger « seulement » ; enrichissement horaires profil
- `NlpExecutionResult` + `formatAssistantReply` honnête — jamais « C'est fait » sans persistance + replan + blocs vérifiés
- `verifyWorkBlocksInPlan` — trajet aller / travail / trajet retour ; `dispatchPlanRefresh` après conversation
- `completeTimelineEntry()` — Terminer indépendant du formulaire, sans état dirty, anti double-clic
- `MonthCalendar variant="planningCompact"` — mini-calendrier secondaire sur `/planning` (desktop coin droit, mobile replié)

**Correctif Sprint 4.8.3 — planning sans calendrier, Annuler, clarification pending :**
- `/planning` sans `MonthCalendar` — navigation jour + lien « Ouvrir le calendrier » ; timeline prioritaire
- `cancelTimelineEntry()` — bouton Annuler fonctionnel, feedback, anti double-clic, tâche d'origine conservée
- `PendingConversationAction` — « De 8 h à midi » complète « Je travaille demain matin » ; expiration 30 min ; « finalement non »

**Sprint 5.0 — coach personnel explicable :**
- `lifeReasoner.ts` — chaque proposition → `LifeDecision` (confiance, facteurs, explication why/whyNow/whyNotOther)
- `HabitProfile` + page `/my-ai` — apprentissage habitudes, feedback Exact/Faux
- `weeklyReviewEngine` — bilan dimanche (3 réussites, 3 conseils, 1 priorité)
- `BalanceScore` + statistiques enrichies (tendances, régularité, équilibre 9 piliers)
- `proactiveCoachEngine` — messages matin/soir/dimanche sur l'accueil

**Sprint 5.1 — mémoire vivante :**
- `livingMemoryEngine.ts` — analyse régulière historique, check-ins, stats, corrections
- `LivingHabitProfile` — métriques évolutives (durées, créneaux, annulations, loisirs…)
- `habitTrendEngine.ts` — tendances amélioration/dégradation/stabilité
- Niveau de connaissance + confiance globale sur `/my-ai`
- Insights automatiques (preuves, raisonnement) + validation Exact/Faux/Plus tard
- `dailyMissionEngine` — une mission/jour ; `weeklyMissionEngine` — mission hebdo facultative
- Adaptation progressive des durées proposées (sport, révision, calme)
- `DailyMissionBanner` sur l'accueil

**Correctif Sprint 4.7 — révision cohérente & assistant compact :**
- `ensurePrimarySuggestionInList` — la recommandation principale (ex. Révision) est toujours dans les choix modal
- `getWeeklyStudyProgress` — temps planifié vs effectué sur la semaine locale
- Option Révision : tâche liée, progression hebdo, durée **choisissable** (10–60 min + personnalisé) via `resolveStudyRevisionDuration`
- Acceptation : INSERT dédié `acceptStudyRevisionSuggestion` — `businessType: study`, `activityType: revision`, `userAccepted: true` ; segmentation soirée (`computeEveningFreeSegments`)
- Assistant : `ConversationHeaderTrigger` en haut à droite du header — panneau popover au clic, sans bande horizontale ni chevauchement permanent

**État actuel (`HomePage`) — Sprint 4.4 :**
- Accueil **épuré par défaut** : motivation, état journée, activité actuelle, prochaine activité, planning restant, conversation
- Mini-calendrier **hors centre** : `header_right` (desktop) ou `hidden` (mobile) ; option `drawer` dans le menu ☰
- Widget `calendar` retiré de la pile centrale par défaut
- Actions sur chaque bloc timeline : Décaler, Je n'ai pas le temps, Terminer, Annuler

**État actuel (`HomePage`) — Sprint 2.4 :**
- Menu latéral ☰ (`AppShell` + `AppDrawer`) remplace les accès rapides
- Mini-calendrier **compact** (~50 % plus petit)
- Navigation jour précédent / Aujourd’hui / suivant
- Repère « Maintenant » avec refresh automatique (60 s)
- Timeline : blocs passés repliés, couleurs par catégorie
- Modes live / historical / future selon la date
- Page **Mon profil** (`/profile`) pour toutes les données personnelles

**État actuel (`CalendarPage`) — Sprint 2.7 :**
- Hook unifié `useCalendarViewData` — une source de chargement, pas de boucle
- Date sélectionnée : `LocalDateString` (`YYYY-MM-DD`) via URL `?date=`
- Sections stables : skeleton au bootstrap, badge « Mise à jour… » au refresh
- RDV : upsert optimiste après INSERT, refresh mois unique
- Menu ☰ et tiroir à gauche (`AppShell` + drawer CSS)

**État actuel (`CalendarPage`) — Sprint 2.4 :**
- Vue mensuelle **full** avec points, libellés courts, vacances vertes
- Légende couleurs (`calendarColors.ts`)
- Clic événement → édition ; clic jour → détail sous le mois

**État actuel (`HomePage`) — Sprint 2.3 :**
- Mini-calendrier mensuel (`MonthCalendar`) avec navigation mois et sélection date (`?date=`)
- Timeline du jour pour la date sélectionnée (via `useDayPlan` + `useUrlDate`)
- Bouton « Me proposer une activité » sur chaque temps libre (modal suggestions)
- Temps disponible du soir (après routine enfants → coucher adulte − 30 min)
- Bouton « Ajouter une période de vacances » (`VacationQuickForm`)
- Section « Mon espace spirituel » si `faith_importance ≠ disabled`
- Prochaine activité, actions rapides, contexte familial
- Analyses mémoire repliées par défaut

**État actuel (`CalendarPage`) — Sprint 2.3 :**
- Mini-calendrier + événements / contraintes de la date sélectionnée
- Périodes de vacances actives affichées
- Boutons « Ajouter un événement » et « Ajouter une période de vacances »

**État cible V1 :**
- Timeline du jour (planning vivant)
- Résumé tâches (fait / à faire / reporté)
- Insight du jour (coach)
- Progression mémoire
- Accès rapide : ajouter tâche, discovery, profil

### Données utilisées

| Source | Affichage |
|--------|-----------|
| `profile_facts` | Progression, insights |
| `tasks` | Résumé tâches |
| `plan_blocks` | Timeline |
| `auth.users` | Prénom |

### Interactions

| Module | Interaction |
|--------|-------------|
| Tous | Point de convergence |

---

## 15. IA conversationnelle

**Statut : 💡 Vision long terme**

### Objectif

Permettre un dialogue naturel en français pour ajuster le planning, poser des questions, demander des conseils — avec le contexte complet du foyer en mémoire.

### Fonctionnement (vision)

**Exemples d'interactions :**
- « Je suis crevée ce soir, allège ma soirée »
- « Ajoute une séance de sport demain matin »
- « Pourquoi tu as mis les devoirs à 17h ? »
- « Mon fils est malade, annule les activités »

**Architecture cible :**
- LLM (Claude / GPT) avec system prompt Équilibre IA
- Contexte injecté : `MemoryProfile` + tâches du jour + planning
- Function calling pour modifier tâches/planning
- Garde-fous : règles de l'IA non contournables

### Données utilisées

Toutes les tables — accès via Decision Engine.

### Interactions

| Module | Interaction |
|--------|-------------|
| Tous | Interface naturelle vers chaque module |

---

## Environnement de test legacy

Les prénoms fondateurs historiques (environnement de test legacy) ne sont **pas** des cas de référence produit. Voir Constitution ch. 1 — produit universel.

## Architecture cerveau — renvoi officiel

> **20 moteurs figés** — ne pas dupliquer ici. Source de vérité :
>
> - [Constitution ch. 13](./EQUILIBRE_AI_CONSTITUTION.md#13-architecture-ia)
> - [`architecture/contracts/00-index.md`](../architecture/contracts/00-index.md)
> - [`src/ai/contracts/`](../src/ai/contracts/)

Boucle : **Comprendre → Décider → Proposer → Observer → Mesurer → Apprendre**

Le code legacy (`memoryEngine`, `planningEngine`, `lifeEngine`, etc.) migre progressivement vers ces 20 moteurs (Sprint A3+).

---

# Architecture technique

## Vue d'ensemble

```
┌─────────────────────────────────────────────────────────────┐
│                        NAVIGATEUR                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              React 19 SPA (Vite 8)                   │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────────────┐ │   │
│  │  │  Pages   │ │ Contexts │ │     Components       │ │   │
│  │  └────┬─────┘ └────┬─────┘ └──────────┬───────────┘ │   │
│  │       │            │                   │             │   │
│  │  ┌────▼────────────▼───────────────────▼───────────┐ │   │
│  │  │              Services Layer (ActionExecution)    │ │   │
│  │  └────────────────────┬────────────────────────────┘ │   │
│  │                       │                               │   │
│  │  ┌────────────────────▼────────────────────────────┐ │   │
│  │  │   AI Brain — 20 moteurs (contrats + legacy)      │ │   │
│  │  │   src/ai/contracts/ · migration-map.ts           │ │   │
│  │  └────────────────────┬────────────────────────────┘ │   │
│  │                       │                               │   │
│  │  ┌────────────────────▼────────────────────────────┐ │   │
│  │  │           Supabase Client (lib/supabase)         │ │   │
│  │  └────────────────────┬────────────────────────────┘ │   │
│  └───────────────────────┼───────────────────────────────┘   │
└──────────────────────────┼───────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼───────────────────────────────────┐
│                      SUPABASE                                 │
└──────────────────────────────────────────────────────────────┘
```

## React

**Version :** React 19.2 + TypeScript 6.0

**Choix architecturaux :**
- SPA pure (pas de SSR) — simplicité mobile-first
- Pas de state manager global (Redux/Zustand) en V1 — `useState` + Context suffisent
- `StrictMode` activé en développement
- Pas de React Compiler (performance build)

**Conventions :**
- Un fichier par page dans `src/pages/`
- Composants réutilisables futurs dans `src/components/`
- Hooks métier futurs dans `src/hooks/`
- Types partagés dans `src/types/`

## Supabase

**Version :** `@supabase/supabase-js` 2.110

**Usage actuel :**
- Auth (email/password)
- Postgres (tables métier)
- Client initialisé dans `src/lib/supabase/client.ts`
- Variables d'environnement : `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`

**Usage futur :**
- Row Level Security (RLS) sur toutes les tables
- Edge Functions pour logique sensible (invitations, Spotify OAuth)
- Realtime pour mode couple (sync tâches)
- Storage pour avatars (optionnel)

**Script de vérification :** `scripts/verify-supabase.mjs`

## Services

Couche d'abstraction entre les pages et Supabase. Chaque service encapsule les requêtes d'un domaine.

| Service | Statut | Responsabilité |
|---------|--------|----------------|
| `profileFactsService` | ✅ | Facts, household_id |
| `tasksService` | ✅ | CRUD tâches |
| `householdService` | 📋 | Foyer, membres, invitations |
| `childrenService` | 📋 | CRUD enfants |
| `planningService` | 📋 | Plan blocks, génération |
| `coachService` | 📋 | Messages, suggestions |
| `journalService` | 📋 | Entrées journal invisible |
| `notificationService` | 📋 | Préférences, envoi |
| `spotifyService` | 📋 | OAuth, playlists |

**Règle :** les pages ne font **pas** d'appels Supabase directs (dette actuelle à corriger dans `HouseholdPage`, `ChildrenPage`, `ProfileOnboardingPage`).

## Contexts

| Context | Statut | Contenu |
|---------|--------|---------|
| `AuthContext` | ✅ | `user`, `session`, `loading`, `signOut` |
| `HouseholdContext` | 📋 | `householdId`, `members`, `children` |
| `PlanningContext` | 📋 | `dayPlan`, `regenerate` |

**Principe :** un Context par domaine transversal. Pas de mega-context.

## Pages

| Route | Page | Statut |
|-------|------|--------|
| `/login` | `LoginPage` | ✅ |
| `/signup` | `SignupPage` | ✅ |
| `/onboarding/household` | `HouseholdPage` | ✅ |
| `/onboarding/children` | `ChildrenPage` | ✅ |
| `/onboarding/profile` | `ProfileOnboardingPage` | ✅ |
| `/home` | `HomePage` | 🚧 |
| `/discovery` | `DiscoveryPage` | ✅ |
| `/tasks` | `TasksPage` | ✅ |
| `/planning` | `PlanningPage` | 📋 |
| `/settings` | `SettingsPage` | 📋 |
| `/coach` | `CoachPage` | 📋 |

**Route guard cible :**

```typescript
// Logique à implémenter
function resolvePostAuthRoute(user: User): string {
  if (!hasHousehold(user)) return '/onboarding/household';
  if (!isOnboardingComplete(user)) return '/onboarding/children';
  if (!hasBaseProfile(user)) return '/onboarding/profile';
  return '/home';
}
```

## Components

**Statut :** 📋 Pas encore extraits — UI inline dans les pages.

**Composants à créer :**

| Composant | Usage |
|-----------|-------|
| `Button`, `Input`, `Select` | Design system de base |
| `TaskCard` | Carte tâche réutilisable |
| `InsightCard` | Carte insight mémoire |
| `TimelineBlock` | Bloc planning vivant |
| `ProgressBar` | Barre de progression mémoire |
| `ChoiceButton` | Bouton choix discovery |
| `CoachMessage` | Bulle message coach |
| `BottomNav` | Navigation mobile |
| `AppSidebar` | Navigation desktop repliable (Sprint 4.2 : 220 px / 72 px, `sidebar_collapsed`) |

## Hooks

**Statut :** 📋 Aucun hook métier encore.

| Hook | Responsabilité |
|------|----------------|
| `useAuth` | ✅ Existe dans AuthContext |
| `useHousehold` | Charger/cache householdId + enfants |
| `useProfileFacts` | Charger/cache facts + memoryProfile |
| `useTasks` | Liste, CRUD, filtres |
| `useDayPlan` | Planning du jour, régénération |
| `useCoach` | Messages contextuels |

## AI Engine

Couche de logique pure (sans UI, sans appels réseau) dans `src/ai/`.

### Memory Engine ✅

**Fichier :** `src/ai/memoryEngine.ts`

| Fonction | Entrée | Sortie |
|----------|--------|--------|
| `buildMemoryProfile(facts)` | `ProfileFactRecord[]` | `MemoryProfile` |
| `generateMemoryInsights(profile)` | `MemoryProfile` | `MemoryInsight[]` |
| `calculateKnowledgeProgress(facts, total)` | facts + nombre questions | `number` (0-100) |

**Nature :** fonctions pures, déterministes, testables unitairement.

### Planning Engine 📋

**Fichier cible :** `src/ai/planningEngine.ts`

| Fonction cible | Responsabilité |
|----------------|----------------|
| `buildDayConstraints(profile, children, date)` | Contraintes dures du jour |
| `findAvailableSlots(constraints, duration)` | Créneaux libres |
| `prioritizeTasks(tasks, profile, insights)` | Ordre de placement |
| `generateDayPlan(constraints, tasks, profile)` | Plan complet |
| `reschedule(task, plan, reason)` | Replanification |

**Entrées :** `MemoryProfile` + `TaskRecord[]` + `Child[]` + date
**Sorties :** `DayPlan` (liste de `PlanBlock`)

### Decision Engine 📋

**Fichier cible :** `src/ai/decisionEngine.ts`

Le Decision Engine est le **gardien des règles**. Il valide ou rejette toute proposition du Planning Engine et du Coach.

| Fonction cible | Responsabilité |
|----------------|----------------|
| `validatePlanBlock(block, profile)` | Vérifie les règles IA |
| `canScheduleTask(task, slot, profile)` | Autorise/refuse un placement |
| `shouldSplitTask(task)` | Découpage si `skip_count >= 3` |
| `shouldSuggestRest(profile, plan)` | Détecte surcharge |
| `resolveConflict(blockA, blockB)` | Arbitrage multi-piliers |

**Principe :** aucune proposition ne sort sans validation du Decision Engine.

```
Planning Engine → proposition
       │
       ▼
Decision Engine → validation (règles IA)
       │
       ├── ✅ Accepté → plan_blocks
       └── ❌ Rejeté → replanification
```

## Structure de fichiers cible

```
src/
├── ai/
│   ├── memoryEngine.ts        ✅
│   ├── lifeEngine.ts          ✅ Sprint 3.0 — LifeContext, types de journée
│   ├── planningEngine.ts      📋
│   ├── decisionEngine.ts      📋
│   └── coachEngine.ts         📋
├── app/
│   ├── providers/
│   │   └── AppProviders.tsx   ✅
│   └── router/
│       └── AppRouter.tsx      ✅
├── components/                📋
│   ├── ui/
│   ├── tasks/
│   ├── planning/
│   └── coach/
├── config/
│   ├── app.ts                 ✅
│   └── discoveryQuestions.ts  ✅
├── contexts/
│   ├── AuthContext.tsx        ✅
│   ├── HouseholdContext.tsx   📋
│   └── PlanningContext.tsx    📋
├── hooks/                     📋
├── lib/
│   ├── env.ts                 ✅
│   └── supabase/
│       └── client.ts          ✅
├── pages/                     ✅ (9 pages)
├── services/
│   ├── profileFactsService.ts ✅
│   ├── tasksService.ts        ✅
│   └── ...                    📋
└── types/
    ├── index.ts
    ├── memory.ts              📋
    ├── planning.ts            📋
    └── database.ts            📋
```

---

# Base de données

## Tables existantes

> Schéma inféré du code client. Les migrations SQL ne sont pas encore versionnées dans le repo — **priorité à corriger**.

### `profiles` ✅

| Colonne | Type | Rôle |
|---------|------|------|
| `id` | uuid (FK auth.users) | Identifiant utilisateur |
| `onboarding_completed` | boolean | Fin de l'onboarding de base |
| `created_at` | timestamptz | Date création |
| `updated_at` | timestamptz | Dernière modification |

**RLS cible :** un utilisateur lit/écrit uniquement son profil.

---

### `households` ✅

| Colonne | Type | Rôle |
|---------|------|------|
| `id` | uuid | Identifiant foyer |
| `name` | text | Nom affiché (ex. « Famille Belot ») |
| `created_at` | timestamptz | Date création |

**Création :** via RPC `create_household_for_current_user`.

---

### `household_members` ✅

| Colonne | Type | Rôle |
|---------|------|------|
| `household_id` | uuid (FK households) | Foyer |
| `user_id` | uuid (FK auth.users) | Utilisateur |
| `display_name` | text | Prénom dans le foyer |
| `role` | text | `admin` / `member` (futur) |

**Contrainte V1 :** un `user_id` = un seul foyer.

---

### `children` ✅

| Colonne | Type | Rôle |
|---------|------|------|
| `id` | uuid | Identifiant enfant |
| `household_id` | uuid (FK households) | Foyer |
| `first_name` | text | Prénom |
| `birth_date` | date (nullable) | Date de naissance |
| `created_at` | timestamptz | Date ajout |

---

### `profile_facts` ✅

| Colonne | Type | Rôle |
|---------|------|------|
| `id` | uuid | Identifiant |
| `household_id` | uuid (FK households) | Foyer |
| `user_id` | uuid (FK auth.users) | Utilisateur |
| `fact_key` | text | Clé sémantique (ex. `work_days`) |
| `fact_value` | jsonb | Valeur structurée |
| `source` | text | Origine (`progressive_discovery`, `onboarding`, `journal`) |
| `confidence` | numeric | Confiance (0-1) |
| `last_asked_at` | timestamptz | Dernière mise à jour |
| `updated_at` | timestamptz | Timestamp |
| `created_at` | timestamptz | Date création |

**Contrainte unique :** `(user_id, fact_key)`

**Structures `fact_value` connues :**

```jsonc
// Découverte — format standard
{ "value": "yes" }
{ "value": ["monday", "tuesday"] }
{ "value": 45 }

// Onboarding — format structuré
{ "start": "08:00", "end": "17:00" }          // work_schedule
{ "wake_time": "06:30", "bed_time": "22:30" }  // sleep_schedule
{ "value": "family" }                           // main_priority
```

---

### `tasks` ✅

| Colonne | Type | Rôle |
|---------|------|------|
| `id` | uuid | Identifiant |
| `household_id` | uuid (FK households) | Foyer |
| `assigned_to` | uuid (FK auth.users, nullable) | Assigné à |
| `created_by` | uuid (FK auth.users) | Créateur |
| `title` | text | Nom de la tâche |
| `description` | text (nullable) | Description |
| `category` | text | Catégorie (family, studies, etc.) |
| `estimated_minutes` | integer (nullable) | Durée estimée |
| `due_at` | timestamptz (nullable) | Échéance |
| `priority` | integer (1-5) | Importance |
| `splittable` | boolean | Découpable en micro-séances |
| `status` | text | `todo` / `planned` / `in_progress` / `done` / `skipped` / `cancelled` |
| `skip_count` | integer | Nombre de reports |
| `created_at` | timestamptz | Date création |
| `updated_at` | timestamptz | Dernière modification |

---

### RPC : `create_household_for_current_user` ✅

| Paramètre | Type | Rôle |
|-----------|------|------|
| `household_name` | text | Nom du foyer |
| `display_name` | text | Prénom de l'utilisateur |

**Effet :** crée `households` + `household_members` + potentiellement `profiles`.

---

## Tables planifiées

### `calendar_items` ✅ — Sprint 1 (remplace `plan_blocks` prévu initialement)

> **Note d'implémentation :** le Sprint 1 utilise la table `calendar_items` déjà présente côté Supabase plutôt que `plan_blocks`.

| Colonne | Type | Rôle |
|---------|------|------|
| `id` | uuid | Identifiant |
| `household_id` | uuid (FK) | Foyer |
| `user_id` | uuid (FK) | Utilisateur concerné |
| `task_id` | uuid (FK tasks, nullable) | Tâche liée (null = routine/contrainte) |
| `title` | text | Libellé affiché |
| `item_type` | text | `constraint` / `task` / `buffer` / `margin` |
| `starts_at` | timestamptz | Début du créneau |
| `ends_at` | timestamptz | Fin du créneau |
| `locked` | boolean | Contrainte manuelle non déplaçable |
| `source` | text | `user` / `ai` / `calendar_sync` / `system` |
| `details` | jsonb | `explanation`, `status`, `facts`, segments… |
| `created_at` | timestamptz | Date création |
| `updated_at` | timestamptz | Date mise à jour |

### `plan_blocks` 📋 — Non créé (remplacé par `calendar_items`)

### `family_context_periods` ✅ — Sprint 1.6

| Colonne | Type | Rôle |
|---------|------|------|
| `id` | uuid | Identifiant |
| `household_id` | uuid (FK) | Foyer |
| `user_id` | uuid (FK, nullable) | Adulte concerné |
| `context_type` | text | Type de situation (vacances, déplacement, parent seul…) |
| `title` | text | Libellé affiché |
| `starts_at` / `ends_at` | timestamptz | Plage active |
| `affected_member_id` | uuid (FK children, nullable) | Enfant concerné |
| `impact` | jsonb | Ajustements moteur |
| `description` | text | Détail libre |
| `status` | text | `active` / `cancelled` |

### `child_routines` ✅ — Sprint 1.6

| Colonne | Type | Rôle |
|---------|------|------|
| `child_id` | uuid (FK, unique) | Enfant |
| `bedtime_weekday` / `bedtime_weekend` | time | Heures de coucher |
| `evening_routine_minutes` | integer | Durée routine du soir |
| `wake_time` | time | Réveil (facultatif) |
| `school_days` | text[] | Jours d’école (facultatif) |

### `google_calendar_connections` ✅ — Sprint 2.5

Connexion OAuth Google par utilisateur et foyer. Refresh token chiffré côté serveur (`encrypted_refresh_token`).

### `google_calendars` ✅ — Sprint 2.5

Calendriers Google listés et sélectionnés pour la synchronisation (`selected_for_sync`).

### `external_calendar_events` ✅ — Sprint 2.5

Événements importés en lecture seule. Upsert par `(provider, external_event_id, user_id)`. Affichés dans le calendrier mensuel et le planning comme contraintes verrouillées (`calendar_sync`).

Voir `Docs/GOOGLE_CALENDAR_SETUP.md`.

---

### `journal_entries` 📋

| Colonne | Type | Rôle |
|---------|------|------|
| `id` | uuid | Identifiant |
| `user_id` | uuid (FK) | Utilisateur |
| `household_id` | uuid (FK) | Foyer |
| `entry_type` | text | `mood` / `energy` / `context` / `micro_reflection` |
| `value` | jsonb | Donnée (ex. `{ "mood": "tired", "scale": 3 }`) |
| `source` | text | `explicit` / `implicit` / `passive` |
| `recorded_at` | timestamptz | Horodatage |

---

### `behavioral_signals` 📋

| Colonne | Type | Rôle |
|---------|------|------|
| `id` | uuid | Identifiant |
| `user_id` | uuid (FK) | Utilisateur |
| `signal_type` | text | `task_skip` / `plan_modify` / `plan_accept` / `task_complete` |
| `entity_type` | text | `task` / `plan_block` |
| `entity_id` | uuid | ID de l'entité |
| `metadata` | jsonb | Contexte (heure, jour, énergie) |
| `recorded_at` | timestamptz | Horodatage |

---

### `household_invitations` 📋 — Mode couple

| Colonne | Type | Rôle |
|---------|------|------|
| `id` | uuid | Identifiant |
| `household_id` | uuid (FK) | Foyer |
| `invited_email` | text | Email invité |
| `invited_by` | uuid (FK auth.users) | Inviteur |
| `token` | text | Token unique |
| `status` | text | `pending` / `accepted` / `expired` |
| `expires_at` | timestamptz | Expiration |
| `created_at` | timestamptz | Date création |

---

### `notification_preferences` 📋

| Colonne | Type | Rôle |
|---------|------|------|
| `user_id` | uuid (FK) | Utilisateur |
| `type` | text | Type de notification |
| `enabled` | boolean | Activé/désactivé |
| `quiet_hours_start` | time | Début silence |
| `quiet_hours_end` | time | Fin silence |

---

### `spotify_connections` 📋

| Colonne | Type | Rôle |
|---------|------|------|
| `user_id` | uuid (FK) | Utilisateur |
| `access_token` | text (chiffré) | Token OAuth |
| `refresh_token` | text (chiffré) | Refresh token |
| `expires_at` | timestamptz | Expiration |
| `playlist_mapping` | jsonb | Mapping préférence → playlist ID |

---

### `coach_messages` 📋

| Colonne | Type | Rôle |
|---------|------|------|
| `id` | uuid | Identifiant |
| `user_id` | uuid (FK) | Utilisateur |
| `message_type` | text | `insight` / `suggestion` / `explanation` / `encouragement` |
| `content` | text | Contenu du message |
| `context` | jsonb | Contexte de génération |
| `read_at` | timestamptz (nullable) | Lu |
| `created_at` | timestamptz | Date création |

---

## Relations entre tables

```
auth.users
    │
    ├── profiles (1:1)
    │
    ├── household_members (1:1 en V1)
    │       │
    │       └── households (N:1)
    │               │
    │               ├── children (1:N)
    │               ├── tasks (1:N)
    │               └── plan_blocks (1:N, futur)
    │
    ├── profile_facts (1:N, par user_id)
    ├── journal_entries (1:N, futur)
    ├── behavioral_signals (1:N, futur)
    └── coach_messages (1:N, futur)
```

---

# Les règles de l'IA

> Ces règles sont **non négociables**. Elles s'appliquent au Memory Engine, Planning Engine, Decision Engine, Coach et IA conversationnelle. Aucun module ne peut les contourner.

## Règles fondamentales

### 1. Protéger le sommeil

- Aucune tâche non urgente ne peut être planifiée après `sleep_schedule.bed_time`
- Si `sleep_problems` contient `late_tasks` ou `late_bedtime`, le coucher est encore plus protégé (buffer de 30 min)
- Les notifications ne sont jamais envoyées après l'heure de coucher
- Le coach ne suggère jamais de « finir encore une chose » tard le soir

**Implémentation :**
```typescript
function isAfterBedtime(slot: TimeSlot, profile: MemoryProfile): boolean {
  const bedtime = getBedtime(profile);
  return slot.startsAt >= bedtime;
}
```

### 2. Préserver la famille

- Les routines enfants (matin, soir) sont des **contraintes dures** non déplaçables
- `morning_children_duration` crée un bloc protégé chaque jour de travail
- `children_evening_routine` crée des blocs protégés le soir
- Les tâches personnelles/études ne chevauchent jamais ces blocs

### 3. Adapter les objectifs

- Si `skip_count >= 3` → proposer automatiquement une version 50 % plus courte
- Si `after_work_energy === "low"` → pas de tâches exigeantes le soir
- Si surcharge détectée → réduire le nombre de tâches planifiées, pas augmenter la pression
- L'objectif hebdomadaire d'études est une **cible flexible**, pas un quota

### 4. Ne jamais culpabiliser

**Liste noire de formulations (hardcodée) :**
- « Tu n'as pas… »
- « Tu devrais… »
- « Encore en retard »
- « Échec » / « Raté » / « Manqué »
- « Tu aurais dû… »

**Liste blanche de formulations :**
- « On peut essayer… »
- « Voici une version plus légère »
- « Demain est un nouveau départ »
- « Tu as avancé sur… »
- « C'est normal de… »

### 5. Privilégier la régularité

- Mieux vaut 15 min de sport 4 fois/semaine que 1h une fois
- Le coach célèbre les streaks (séries), pas les records
- Les micro-séances comptent autant que les longues
- La progression mémoire valorise la constance des réponses discovery

### 6. Proposer des solutions simples

- Maximum 3 tâches planifiées par demi-journée
- Les propositions ont un seul call-to-action clair
- Pas de choix paradoxaux (« Que veux-tu faire ? » avec 15 options)
- Le découpage de tâche propose **une** micro-étape, pas un plan de 10 étapes

### 7. Expliquer ses choix

Chaque `plan_block` généré par l'engine porte un champ `explanation` :

> *« J'ai placé ta séance d'étude à 6h30 car tu es plus efficace le matin et ton énergie est basse après le travail. »*

L'explication cite toujours un **fait mémorisé**, pas une supposition.

### 8. Apprendre progressivement

- Ne jamais supposer une information non mémorisée
- Poser des questions discovery avant de planifier un pilier inconnu
- La confiance (`confidence`) des facts augmente avec la cohérence des signaux
- Un fait peut être corrigé sans pénalité

## Matrice de priorité des piliers

Quand deux piliers entrent en conflit, le Decision Engine applique cette matrice :

| Priorité | Pilier | Peut être sacrifié pour… |
|----------|--------|--------------------------|
| 1 | Sommeil | Rien |
| 2 | Famille (routines enfants) | Rien |
| 3 | Santé (minimum sport) | Travail non urgent |
| 4 | Travail (horaires fixes) | Temps personnel |
| 5 | Études | Temps personnel, repos |
| 6 | Spiritualité | Temps personnel |
| 7 | Temps personnel | Rien d'autre (protégé en dernier recours) |

## Règles de planification

| Règle | Condition | Action |
|-------|-----------|--------|
| R-01 | Tâche chevauche routine enfants | Rejeter le placement |
| R-02 | Tâche après bedtime | Rejeter sauf urgence (priority = 5 + due_at aujourd'hui) |
| R-03 | `skip_count >= 3` et `splittable` | Proposer durée = 50 % de `estimated_minutes` |
| R-04 | `after_work_energy = low` | Tâches studies/work → créneaux matinaux uniquement |
| R-05 | Plus de 5 tâches actives | Ne planifier que les 3 plus prioritaires |
| R-06 | Jour non travaillé | Pas de contrainte travail, plus de créneaux libres |
| R-07 | `faith_importance = disabled` | Aucun contenu spirituel |
| R-08 | `faith_importance ≠ disabled` | Max 1 contenu spirituel par jour, jamais imposé |

---

# Planning vivant

## Définition

Le **planning vivant** est le cœur différenciant d'Équilibre IA. Ce n'est pas un agenda. C'est un système qui :

1. **Comprend** les contraintes réelles de la journée
2. **Propose** un agencement intelligent des tâches et routines
3. **S'adapte** en temps réel aux changements
4. **Explique** chaque choix
5. **Ne culpabilise jamais** quand le plan n'est pas suivi

## Principes

| Principe | Description |
|----------|-------------|
| **Proposition, pas obligation** | Le plan est une suggestion révisable |
| **Replanification continue** | Chaque report, validation ou nouveau fait déclenche un recalcul |
| **Contraintes dures d'abord** | Routines enfants, travail, sommeil sont posées avant les tâches |
| **Énergie comme ressource** | Les tâches exigeantes vont aux créneaux à haute énergie |
| **Simplicité visuelle** | Maximum 6-8 blocs par jour, lisible en un coup d'œil |

## Algorithme V1 (déterministe)

### Étape 1 — Collecter les contraintes dures

```
Entrées :
  - MemoryProfile (facts)
  - children[] (foyer)
  - child_routines[] (couchers)
  - family_context_periods[] actives pour la date
  - Date cible

Sortie : DayConstraints
```

**Blocs non négociables générés :**

| Bloc | Source | Condition |
|------|--------|-----------|
| Routine matin enfants | `morning_children_duration` + `children_departure_time` | Jours avec enfants |
| Trajet travail | `commute_duration` | Jours travaillés (`work_days` ou `work_schedule_patterns`) |
| Horaires travail | `work_schedule` | Jours travaillés |
| Routine soir enfants | `child_routines` + facts `evening_routine_*` | Tous les jours — start = coucher min − durée moyenne |
| Temps de coucher | `sleep_schedule.bed_time` | Tous les jours |
| Réveil | `sleep_schedule.wake_time` | Tous les jours |

### Étape 2 — Calculer les créneaux libres

```
Créneaux libres = Journée (wake → bedtime) - Contraintes dures - Buffers (15 min)
```

Les buffers de 15 minutes sont insérés automatiquement entre chaque bloc pour éviter la surcharge.

### Étape 3 — Prioriser les tâches

```
Score de priorité =
  (priority × 20) +
  (urgence échéance × 30) +
  (alignement pilier principal × 15) +
  (pénalité skip_count × -5) +
  (bonus splittable si créneau court × 10)
```

**Tri décroissant.** Maximum 5 tâches planifiées par jour en V1.

### Étape 4 — Placer les tâches

Pour chaque tâche (par score décroissant) :

```
1. Déterminer l'énergie requise selon category :
   - studies, work → haute énergie
   - home, family → énergie moyenne
   - sport → énergie modulable
   - rest, spirituality → basse énergie

2. Trouver le premier créneau libre compatible :
   - Durée ≥ estimated_minutes (ou 50 % si skip_count >= 3)
   - Énergie du créneau ≥ énergie requise
   - Pas de chevauchement avec contraintes dures
   - Respect des règles R-01 à R-08

3. Si aucun créneau → marquer « non planifiable aujourd'hui »
   (le coach explique pourquoi)
```

**Mapping énergie ↔ créneau :**

| Créneau | Énergie | Source |
|---------|---------|--------|
| Matin (wake → +2h) | Haute | Par défaut |
| Matinée travail | Nulle (bloqué) | `work_schedule` |
| Pause déjeuner | Moyenne | Fixe |
| Après-midi | Moyenne | Par défaut |
| Après travail | Selon `after_work_energy` | Mémoire |
| Soir (après routines enfants) | Basse | Par défaut |

### Étape 5 — Générer le plan

```typescript
type PlanBlock = {
  id: string;
  blockType: 'routine' | 'task' | 'buffer' | 'rest' | 'sport';
  title: string;
  startsAt: Date;
  endsAt: Date;
  taskId?: string;
  status: 'proposed';
  explanation: string;
  source: 'engine';
};

type DayPlan = {
  date: string;
  blocks: PlanBlock[];
  unplannableTasks: TaskRecord[];
  metadata: {
    totalFreeMinutes: number;
    totalPlannedMinutes: number;
    energyProfile: string;
  };
};
```

### Étape 6 — Présenter et interagir

L'utilisateur voit la timeline et peut :
- ✅ **Accepter** un bloc → `status: accepted`, tâche → `planned`
- 🔄 **Déplacer** un bloc → `status: modified`, signal comportemental
- ⏭️ **Reporter** → retour à `tasksService.incrementTaskSkipCount`, replanification
- ✔️ **Terminer** → tâche → `done`, bloc → `completed`

### Replanification

Déclenchée par :
- Report d'une tâche
- Ajout d'une nouvelle tâche
- Modification manuelle d'un bloc
- Nouvelle réponse discovery (changement de contraintes)
- Micro-question journal (changement d'énergie)

**La replanification ne supprime jamais les blocs `completed`.**

## Affichage UI (V1)

### Timeline journalière

```
06:30 ┌─────────────────────────────┐
      │ 🌅 Réveil                    │
07:00 ├─────────────────────────────┤
      │ 👶 Routine enfants (75 min) │ ← contrainte dure
      │    "Protégé — 45 min min."  │
08:15 ├─────────────────────────────┤
      │ 📚 Étude : Module phyto     │ ← tâche planifiée
      │    25 min — "Efficace le    │
      │    matin pour toi"          │
08:45 ├─ buffer 15 min ────────────┤
09:00 ├─────────────────────────────┤
      │ 💼 Travail                   │
      │    ...                       │
```

### États visuels

| État | Couleur | Icône |
|------|---------|-------|
| Contrainte dure | Gris neutre | 🔒 |
| Tâche proposée | Vert doux | 📋 |
| Tâche acceptée | Vert vif | ✅ |
| Tâche terminée | Vert pâle | ✔️ |
| Buffer | Pointillé | ⏸️ |
| Repos/Sport | Bleu/Orange | 🧘/🏃 |

## Évolutions V2+

- Planning hebdomadaire (pas seulement journalier)
- Prise en compte météo (sport extérieur)
- Intégration calendrier externe (lecture seule)
- Planification couple (contraintes des deux adultes)
- ML sur les patterns de validation/modification

---

# Journal invisible

## Définition

Le journal invisible n'est **pas** un journal intime classique. C'est un système de collecte de signaux émotionnels et comportementaux **sans friction** — l'utilisateur ne tient pas un journal, l'application observe et pose des micro-questions contextuelles.

## Philosophie

- **Invisible** : pas d'écran « Mon journal »
- **Léger** : maximum 1 question explicite par jour
- **Utile** : chaque donnée sert le planning ou le coach
- **Privé** : jamais partagé avec le conjoint (sauf opt-in explicite)
- **Non culpabilisant** : « Comment te sens-tu ? » et non « Pourquoi n'as-tu pas fait ? »

## Sources de données

### 1. Collecte passive (automatique)

| Signal | Déclencheur | Donnée enregistrée |
|--------|-------------|-------------------|
| `task_skip` | Utilisateur reporte une tâche | heure, jour, catégorie, skip_count |
| `task_complete` | Utilisateur termine une tâche | heure, durée réelle vs estimée |
| `plan_accept` | Utilisateur accepte un bloc | créneau validé |
| `plan_modify` | Utilisateur déplace un bloc | créneau préféré implicite |
| `plan_reject` | Utilisateur supprime un bloc | créneau rejeté |
| `discovery_answer` | Réponse à une question | fact_key + value |
| `session_duration` | Temps passé dans l'app | engagement |

### 2. Micro-questions contextuelles (1/jour max)

Affichées dans le tableau de bord ou en notification douce :

| Moment | Question | Type |
|--------|----------|------|
| Matin (après réveil) | « Comment as-tu dormi ? » | Échelle 1-5 |
| Milieu de journée | « Ton énergie en ce moment ? » | Échelle 1-5 |
| Après un report | « Qu'est-ce qui t'a fait reporter ? » | Choix multiples |
| Soir (avant coucher) | « Comment s'est passée ta journée ? » | Échelle 1-5 |
| Hebdomadaire | « Qu'est-ce qui t'a le plus pesé cette semaine ? » | Texte libre |

**Règles d'affichage :**
- Jamais si l'utilisateur a déjà répondu aujourd'hui
- Jamais pendant une routine enfants
- Jamais après l'heure de coucher
- Possibilité de « Passer » sans conséquence

### 3. Inférences (calculées, pas demandées)

| Inférence | Source | Confiance |
|-----------|--------|-----------|
| Énergie matinale basse | 3+ reports de tâches matinales | Moyenne |
| Surcharge soir | Reports systématiques après 20h | Haute |
| Procrastination études | `skip_count` élevé sur catégorie studies | Haute |
| Satisfaction sport | Complétion régulière créneaux sport | Moyenne |

## Stockage

```typescript
type JournalEntry = {
  id: string;
  userId: string;
  householdId: string;
  entryType: 'mood' | 'energy' | 'sleep_quality' | 'day_rating' | 'skip_reason' | 'micro_reflection';
  value: {
    scale?: number;        // 1-5
    text?: string;         // réponse libre
    choices?: string[];    // choix multiples
  };
  source: 'explicit' | 'implicit' | 'passive';
  recordedAt: string;
};
```

## Exploitation

| Module | Usage du journal |
|--------|-----------------|
| **Planning vivant** | Ajuster l'énergie du jour en temps réel |
| **Mémoire** | Enrichir les facts avec `confidence` dynamique |
| **Coach** | « Tu as l'air fatiguée ce soir, j'ai allégé le planning » |
| **Decision Engine** | Détecter surcharge → réduire le plan |
| **Tableau de bord** | Tendance hebdomadaire (pas de détail jour par jour) |

## Vie privée

- Les entrées `explicit` sont visibles uniquement par l'utilisateur
- Les entrées `passive` sont des métadonnées agrégées (pas de contenu sensible)
- Pas d'export, pas de partage, pas d'analyse marketing
- Suppression possible à tout moment (RGPD)
- Rétention max : 12 mois (configurable)

---

# Coach intelligent

## Définition

Le coach intelligent est la **voix** d'Équilibre IA. Ce n'est pas un chatbot générique — c'est un accompagnant qui connaît le foyer, respecte les règles de l'IA et explique ses choix.

## Modes du coach

### Mode 1 — Insights (✅ actuel)

Messages statiques générés par `generateMemoryInsights()`.

> *« La préparation des enfants prend environ 75 minutes. Ce temps devra être bloqué avant toute autre activité. »*

- Déclenché : à chaque chargement de `/home`
- Source : règles sur `MemoryProfile`
- Interactif : non

### Mode 2 — Explications (📋 V1)

Le coach explique chaque choix du planning vivant.

> *« J'ai placé ta séance d'étude à 6h30 car tu es plus efficace le matin et ton énergie est basse après le travail. »*

- Déclenché : génération d'un `plan_block`
- Source : `explanation` du bloc
- Interactif : bouton « Déplacer » / « OK »

### Mode 3 — Suggestions proactives (📋 V1)

Le coach intervient sans être sollicité, avec parcimonie.

| Déclencheur | Message type |
|-------------|-------------|
| `skip_count >= 3` | « Cette tâche a été reportée plusieurs fois. Veux-tu essayer une version de 15 min ? » |
| Surcharge détectée | « Ta journée est bien remplie. Je te propose de reporter 2 tâches à demain. » |
| Streak sport | « 4 séances de sport cette semaine — belle régularité ! » |
| Découverte disponible | « 3 nouvelles questions m'aideraient à mieux t'accompagner. » |
| Début de semaine | « Voici ta semaine en perspective : 6h d'étude, 3 séances sport. » |

**Maximum 2 suggestions proactives par jour.**

### Mode 4 — Conversation (💡 V2+)

Dialogue naturel en français avec contexte complet.

- LLM avec system prompt Équilibre IA
- Function calling pour actions (créer tâche, modifier plan)
- Historique de conversation limité (session courante)
- Garde-fous Decision Engine sur chaque action

## Logique de génération (V1)

```typescript
type CoachMessage = {
  id: string;
  type: 'insight' | 'explanation' | 'suggestion' | 'encouragement' | 'question';
  content: string;
  priority: 'low' | 'medium' | 'high';
  action?: {
    label: string;
    type: 'navigate' | 'modify_task' | 'split_task' | 'start_discovery';
    payload: unknown;
  };
  context: {
    trigger: string;
    factsUsed: string[];
    timestamp: string;
  };
};
```

### Pipeline

```
1. Collecter le contexte :
   - MemoryProfile
   - Tâches du jour (états, skip_count)
   - DayPlan (si existant)
   - Journal du jour (si existant)
   - Heure actuelle

2. Évaluer les déclencheurs :
   - Pour chaque règle de suggestion, vérifier si le déclencheur est actif
   - Trier par priorité

3. Filtrer :
   - Maximum 2 messages proactifs/jour
   - Pas de message culpabilisant (liste noire)
   - Pas de message si quiet hours

4. Générer le message :
   - Template + variables (V1)
   - LLM + contexte injecté (V2+)

5. Présenter :
   - Carte sur le tableau de bord
   - Optionnel : notification push
```

## Ton et personnalité

| Trait | Description |
|-------|-------------|
| **Bienveillant** | Toujours du côté de l'utilisateur |
| **Pratique** | Concret, pas philosophique |
| **Concis** | 1-3 phrases maximum |
| **Personnalisé** | Utilise le prénom, cite des faits mémorisés |
| **Non genré** | S'adapte au profil (pas de suppositions) |
| **Français naturel** | Tutoiement, registre familier mais respectueux |

## Spiritualité dans le coach

Uniquement si `faith_importance ≠ "disabled"` :

| `faith_importance` | Comportement |
|--------------------|-------------|
| `important` | 1 message spirituel par jour max |
| `discreet` | 1 message par semaine, intégré naturellement |
| `when_needed` | Uniquement si `day_rating ≤ 2` ou surcharge |
| `disabled` | Aucun contenu spirituel, jamais |

**Contenus possibles :** verset court, encouragement, gratitude, prière brève, réflexion du soir.

---

# Vision Version 1.0

## Définition

La Version 1.0 d'Équilibre IA est l'application **complète, stable et utilisable au quotidien** par un parent organisant sa vie familiale seul (mode couple en V1.1). Ce n'est pas un prototype — c'est un produit fini pour le cas d'usage principal.

## Critères de « terminé »

| Critère | Mesure |
|---------|--------|
| Un utilisateur peut s'inscrire, configurer son foyer et utiliser l'app quotidiennement | Parcours complet sans blocage |
| Le planning vivant génère un plan journalier cohérent | Basé sur mémoire + tâches |
| Le coach explique et accompagne sans culpabiliser | 0 message de la liste noire |
| Les données sont persistées et sécurisées | RLS actif, migrations versionnées |
| L'app fonctionne sur mobile (viewport 360px+) | Responsive testé |
| Le build TypeScript passe sans erreur | `npm run build` ✅ |
| Le temps de chargement initial < 3s | 4G mobile |

## Parcours utilisateur V1.0

### Premier lancement (Jour 0)

```
1. Inscription (email, mot de passe, prénom)
2. Création du foyer (nom, prénom)
3. Ajout des enfants (0 à N)
4. Profil de base (horaires travail/sommeil, priorité)
5. → Tableau de bord avec invitation à la découverte
6. Première session discovery (5 questions)
7. Premiers insights affichés
```

### Usage quotidien (Jour 1+)

```
Matin :
  1. Ouvrir l'app → Tableau de bord
  2. Voir le planning du jour (généré automatiquement)
  3. Accepter/ajuster les propositions
  4. Optionnel : répondre à la micro-question du matin

Journée :
  5. Marquer les tâches terminées
  6. Reporter si nécessaire (sans culpabilité)
  7. Ajouter une nouvelle tâche si besoin → replanification

Soir :
  8. Bilan doux de la journée (micro-question optionnelle)
  9. Aperçu de demain (planning pré-généré)
  10. Optionnel : session discovery (5 questions)
```

## Écrans de la V1.0

| Écran | Contenu | Statut actuel |
|-------|---------|---------------|
| **Inscription** | Formulaire simple | ✅ |
| **Connexion** | Email + mot de passe + redirection intelligente | 🚧 (redirection à corriger) |
| **Onboarding foyer** | Nom foyer + prénom | ✅ |
| **Onboarding enfants** | Ajout enfants | ✅ |
| **Onboarding profil** | Horaires + priorité | ✅ |
| **Tableau de bord** | Planning du jour + insights + progression mémoire | 🚧 |
| **Tâches** | Liste + création + terminer/reporter | ✅ |
| **Découverte** | 5 questions adaptatives | ✅ |
| **Planning** | Timeline journalière interactive | 📋 |
| **Paramètres** | Profil, notifications, déconnexion | 📋 |

## Modules livrés en V1.0

| Module | Niveau V1.0 |
|--------|-------------|
| Authentification | Complet |
| Foyer | Complet (solo) |
| Enfants | Complet |
| Profil | Complet + intégré au moteur mémoire |
| Découverte progressive | Complet (20 questions) |
| Mémoire | Complet (profil + insights + progression) |
| Tâches | Complet (CRUD + skip_count + statuts) |
| Planning vivant | Complet (journalier, déterministe) |
| Coach intelligent | Partiel (insights + explications + suggestions) |
| Journal invisible | Partiel (collecte passive + 1 micro-question/jour) |
| Tableau de bord | Complet (convergence de tous les modules) |
| Mode couple | ❌ Reporté V1.1 |
| Spotify | ❌ Reporté V1.2 |
| Notifications push | ❌ Reporté V1.1 |
| IA conversationnelle | ❌ Reporté V2 |

## Planning vivant V1.0 — périmètre exact

### Inclus

- Génération automatique du planning journalier
- Contraintes dures (enfants, travail, sommeil)
- Placement tâches par priorité et énergie
- Découpage automatique si `skip_count >= 3`
- Replanification à chaque modification
- Explication de chaque créneau (coach)
- Timeline visuelle sur le tableau de bord
- Acceptation / déplacement / report par l'utilisateur

### Exclu (V1.1+)

- Planning hebdomadaire
- Sync calendrier externe
- Planification couple
- Prise en compte météo
- Optimisation ML

## Coach V1.0 — périmètre exact

### Inclus

- Insights mémoire (8 règles)
- Explication des créneaux planifiés
- Suggestions proactives (max 2/jour) :
  - Découpage tâche après 3 reports
  - Allègement si surcharge
  - Célébration régularité sport
  - Invitation discovery
- Ton bienveillant, jamais culpabilisant
- Contenu spirituel optionnel

### Exclu (V2+)

- Conversation naturelle (LLM)
- Analyse de tendances long terme
- Rapports hebdomadaires détaillés

## Base de données V1.0

### Tables requises

| Table | Statut |
|-------|--------|
| `profiles` | ✅ |
| `households` | ✅ |
| `household_members` | ✅ |
| `children` | ✅ |
| `profile_facts` | ✅ |
| `tasks` | ✅ |
| `plan_blocks` | 📋 À créer |
| `behavioral_signals` | 📋 À créer |
| `journal_entries` | 📋 À créer |
| `coach_messages` | 📋 À créer |

### Migrations

Toutes les migrations SQL doivent être versionnées dans `supabase/migrations/` avant la release V1.0.

### RLS

Chaque table doit avoir des policies :
- Un utilisateur ne lit que les données de son foyer
- Un utilisateur ne modifie que ses propres facts/journal
- Les tâches sont lisibles par tous les membres du foyer
- Les plan_blocks sont lisibles par le foyer, modifiables par l'utilisateur concerné

## Architecture V1.0

### Fichiers à créer

| Fichier | Priorité |
|---------|----------|
| `src/ai/planningEngine.ts` | P0 |
| `src/ai/decisionEngine.ts` | P0 |
| `src/ai/coachEngine.ts` | P1 |
| `src/services/planningService.ts` | P0 |
| `src/services/coachService.ts` | P1 |
| `src/services/journalService.ts` | P1 |
| `src/services/householdService.ts` | P1 |
| `src/hooks/useHousehold.ts` | P1 |
| `src/hooks/useProfileFacts.ts` | P1 |
| `src/hooks/useDayPlan.ts` | P0 |
| `src/contexts/HouseholdContext.tsx` | P1 |
| `src/components/planning/TimelineBlock.tsx` | P0 |
| `src/components/coach/CoachMessage.tsx` | P1 |
| `src/types/memory.ts` | P1 |
| `src/types/planning.ts` | P0 |
| `src/types/database.ts` | P0 |
| `supabase/migrations/*.sql` | P0 |

### Fichiers à modifier

| Fichier | Modification |
|---------|-------------|
| `src/ai/memoryEngine.ts` | Intégrer work_schedule, sleep_schedule, main_priority |
| `src/pages/HomePage.tsx` | Timeline planning + coach |
| `src/pages/LoginPage.tsx` | Redirection intelligente |
| `src/pages/ChildrenPage.tsx` | Rediriger vers /onboarding/profile |
| `src/app/router/AppRouter.tsx` | Route guard + /planning |
| `src/services/tasksService.ts` | Statuts planned, requêtes planning |
| `src/pages/TasksPage.tsx` | Afficher créneau planifié, filtrer skipped |
| `src/pages/DiscoveryPage.tsx` | Corriger erreur TS factsMap |

## Roadmap vers V1.0

### Sprint 0 — Stabilisation (1 semaine)

- [ ] Corriger build TypeScript
- [ ] Route guard post-auth
- [ ] Flux onboarding complet (children → profile → home)
- [ ] Harmoniser `getCurrentHouseholdId` (maybeSingle)
- [ ] Extraire appels Supabase des pages vers services
- [ ] Versionner migrations SQL existantes
- [ ] Générer types Supabase

### Sprint 1 — Planning Engine (2 semaines)

- [ ] Créer `plan_blocks` (migration)
- [ ] Implémenter `planningEngine.ts` (contraintes + placement)
- [ ] Implémenter `decisionEngine.ts` (règles IA)
- [ ] Créer `planningService.ts`
- [ ] Intégrer `work_schedule` et `sleep_schedule` dans memoryEngine
- [ ] Tests unitaires planning + decision

### Sprint 2 — UI Planning (1 semaine)

- [ ] Composant `TimelineBlock`
- [ ] Hook `useDayPlan`
- [ ] Intégrer timeline dans `HomePage`
- [ ] Actions : accepter, déplacer, reporter
- [ ] Replanification en temps réel

### Sprint 2.3 — Journées navigables et temps libre (livré)

- [x] `MonthCalendar` — mini-calendrier mensuel (Accueil, Planning, Calendrier)
- [x] `useUrlDate` — persistance date via `?date=YYYY-MM-DD`
- [x] Temps disponible après coucher enfants
- [x] `freeTimeSuggestionEngine` — suggestions sport, étude, repos, famille, spiritualité
- [x] `sportSessionGenerator` — séances courtes structurées
- [x] `SpiritualSpaceSection` — bibliothèque locale, références exactes
- [x] `VacationQuickForm` — vacances visibles sur Accueil + Calendrier
- [x] `suggestionAcceptanceService` — persistance suggestion → `calendar_item`
- [x] Tests A–Q (`sprint23.test.ts`)

### Sprint 3.0 — Life Engine V1 (livré)

- [x] `src/ai/lifeEngine.ts` — `LifeContext`, types de journée, propositions scorées
- [x] Travail contrainte dure ; repos / vacances / déplacement visuellement distincts
- [x] Créneaux libres découpés (`splitFreeSlots.ts`) — fini les blocs 8h–19h
- [x] Moteur unique : planning, accueil, suggestions, espace spirituel
- [x] `LifeDebugPanel` (dev only) — 20 tests `lifeEngine.test.ts`
- Rapport : `Docs/SPRINT_3_0_REPORT.md`

### Sprint 3.1 — Natural Language Engine (livré)

- [x] `src/ai/nlp/` — intent, entités, actions, conversation
- [x] `ConversationHeaderTrigger` — déclencheur compact dans le header global (`AppShell`)
- [x] `nlpActionService.ts` — exécution + replan Life Engine
- [x] Confirmations, mémoire récurrente, 60 tests
- Rapport : `Docs/SPRINT_3_1_REPORT.md`

### Sprint 3 — Coach + Journal (1 semaine)

- [ ] Implémenter `coachEngine.ts`
- [ ] Créer `journal_entries` + `behavioral_signals` (migrations)
- [ ] Collecte passive des signaux
- [ ] Micro-questions (1/jour)
- [ ] Suggestions proactives du coach
- [ ] Composant `CoachMessage`

### Sprint 4 — Finition V1 (1 semaine)

- [ ] Page Paramètres
- [ ] Responsive final
- [ ] Tests end-to-end parcours complet
- [ ] Documentation API interne
- [ ] Revue sécurité RLS
- [ ] Performance (chargement < 3s)

**Estimation totale : 6 semaines**

## Métriques de succès V1.0

| Métrique | Objectif |
|----------|----------|
| Rétention J7 | ≥ 40 % |
| Sessions discovery complétées | ≥ 3 dans les 7 premiers jours |
| Tâches créées par utilisateur actif | ≥ 5/semaine |
| Taux d'acceptation des plans proposés | ≥ 60 % |
| Reports moyens par tâche | ≤ 2 |
| NPS | ≥ 30 |
| Crash-free rate | ≥ 99.5 % |

## Ce que V1.0 n'est PAS

- Une application de productivité d'entreprise
- Un réseau social familial
- Un substitut médical ou thérapeutique
- Un agenda partagé avec le monde extérieur
- Une application avec IA conversationnelle complète

---

# Annexes

## Annexe A — Clés `profile_facts` (découverte)

| Clé | Catégorie | Type | Dépendance |
|-----|-----------|------|------------|
| `morning_children_responsibility` | children | select | — |
| `morning_children_duration` | children | number | — |
| `children_departure_time` | children | time | — |
| `children_evening_routine` | children | multi-select | — |
| `work_days` | work | multi-select | — |
| `commute_duration` | work | number | — |
| `after_work_energy` | energy | select | — |
| `studies_active` | studies | select | — |
| `study_weekly_target` | studies | number | `studies_active = yes` |
| `study_best_period` | studies | select | `studies_active = yes` |
| `procrastination_cause` | procrastination | multi-select | — |
| `preferred_focus_duration` | procrastination | select | — |
| `sleep_needed_hours` | sleep | number | — |
| `sleep_main_problem` | sleep | multi-select | — |
| `sport_interest` | sport | multi-select | — |
| `sport_minimum_duration` | sport | select | — |
| `sport_music_preference` | music | multi-select | — |
| `rest_preference` | rest | multi-select | — |
| `faith_importance` | spirituality | select | — |
| `faith_content_preferences` | spirituality | multi-select | `faith_importance ≠ disabled` |

## Annexe B — Clés `profile_facts` (onboarding)

| Clé | Structure `fact_value` |
|-----|------------------------|
| `partner_name` | `{ value: string \| null }` |
| `work_schedule` | `{ start: time, end: time }` |
| `sleep_schedule` | `{ wake_time: time, bed_time: time }` |
| `main_priority` | `{ value: enum }` |

## Annexe C — Statuts des tâches

```
                    ┌──────────┐
            ┌──────►│   todo   │◄──────┐
            │       └────┬─────┘       │
            │            │             │
            │            ▼             │
            │       ┌──────────┐       │
            │       │ planned  │       │
            │       └────┬─────┘       │
            │            │             │
            │            ▼             │
            │    ┌──────────────┐      │
            │    │ in_progress  │      │
            │    └──────┬───────┘      │
            │           │              │
            │     ┌─────┼─────┐        │
            │     ▼     ▼     ▼        │
            │  ┌─────┐ ┌─────┐ ┌─────┐│
            │  │done │ │skip │ │canc ││
            │  └─────┘ └──┬──┘ └─────┘│
            │             │            │
            └─────────────┘            │
                  (replanification)    │
                                       │
              (nouvelle tâche) ────────┘
```

## Annexe D — Glossaire

| Terme | Définition |
|-------|------------|
| **Foyer (Household)** | Unité organisationnelle : adultes + enfants + tâches partagées |
| **Fact** | Unité de mémoire : une réponse utilisateur stockée en `profile_facts` |
| **Insight** | Recommandation générée par le Memory Engine à partir des facts |
| **Plan Block** | Segment de temps dans le planning vivant (tâche, routine, buffer, repos) |
| **Skip** | Report d'une tâche, neutre, comptabilisé via `skip_count` |
| **Discovery** | Questionnaire adaptatif progressif (5 questions/session) |
| **Coach** | Voix bienveillante de l'application, contextuelle et explicative |
| **Journal invisible** | Collecte de signaux émotionnels sans interface journal dédiée |
| **Pilier** | Un des 7 axes d'équilibre (famille, travail, études, santé, sommeil, spiritualité, temps personnel) |
| **Contrainte dure** | Bloc non déplaçable (routine enfants, travail, sommeil) |
| **Créneau libre** | Plage disponible entre les contraintes dures |

## Annexe E — Variables d'environnement

| Variable | Description | Obligatoire |
|----------|-------------|-------------|
| `VITE_SUPABASE_URL` | URL du projet Supabase | ✅ |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clé publique (anon) | ✅ |
| `VITE_GOOGLE_CALENDAR_ENABLED` | Active Google Calendar (`true` / `false`, défaut `false`) | ✅ V1 bêta |

**Déploiement Netlify :** voir `Docs/NETLIFY_DEPLOYMENT.md`. Fichier `netlify.toml` à la racine.

**Futures variables :**

| Variable | Description | Version |
|----------|-------------|---------|
| `VITE_SPOTIFY_CLIENT_ID` | OAuth Spotify | V1.2 |
| `VITE_LLM_API_KEY` | Clé API LLM (Edge Function) | V2 |
| `VITE_VAPID_PUBLIC_KEY` | Notifications push | V1.1 |

## Annexe F — Conventions de code

| Convention | Règle |
|------------|-------|
| Langue UI | Français (tutoiement) |
| Langue code | Anglais (variables, fonctions, types) |
| Langue commentaires | Français ou anglais (cohérent par fichier) |
| Nommage fichiers | camelCase pour services/hooks, PascalCase pour pages/composants |
| Imports | Chemins relatifs (pages) ou alias `@/` (lib, config) |
| Erreurs | `throw error` dans les services, catch dans les pages avec message utilisateur |
| State | `useState` local dans les pages, Context pour le transversal |
| CSS | Classes custom dans `index.css`, Tailwind pour le base layer |
| Tests | `*.test.ts` à côté du fichier testé (à mettre en place) |

## Annexe G — Historique du document

| Version | Date | Auteur | Changements |
|---------|------|--------|-------------|
| 1.0.0 | 2026-07-12 | Architecte principal | Création initiale — analyse complète du codebase existant + vision V1.0 |
| 1.1.0 | 2026-07-13 | Sprint 2.3 | Navigation par date, suggestions temps libre, vacances visibles, espace spirituel |
| 1.2.0 | 2026-07-14 | Sprint 2.4 | Calendrier compact/full, heure locale, menu latéral, profil, historique |
| 1.3.0 | 2026-07-16 | Sprint 4.2 | Sidebar compacte, rythmes cycliques, saint du jour, `resolveWorkStatusForDate` |
| 1.4.0 | 2026-07-16 | Sprint 4.3 | Éditeur rythme A/B corrigé, `EveningOpportunity`, `evening_planning_mode`, coucher minuit |
| 1.5.0 | 2026-07-16 | Sprint 4.4 | Accueil épuré, repas, soir max 2 activités, `WorkoutSession`, actions bloc, `recoveryPriorityEngine`, `task_activity_events` |
| 1.6.0 | 2026-07-16 | Sprint 4.5 | Calendrier drawer, garde enfants vacances, `BlockActionButton`, espace Loisirs, `leisure_favorites` |
| 1.6.1 | 2026-07-16 | Sprint 4.5 complément | Propositions sport auto (`workoutGenerationEngine`, `SportProposalCard`), `sport_settings` |
| 1.7.0 | 2026-07-16 | Sprint 4.6 | Sport manuel reconnu, `WorkoutSessionPlayer`, `daily_checkins`, replan dynamique (`replanAfterBlockMove`, `absorbDurationChangeWithFreeTime`) |
| 1.8.0 | 2026-07-16 | Sprint 4.7 | Accomplissements visibles, `achievementFeedbackEngine`, timing complétion, temps libéré en avance, persistance F5 |
| 1.8.1 | 2026-07-16 | Sprint 4.7 correctif | Cohérence temporelle séances sport, complétion jour uniquement, grands blocs Temps libre, 1 suggestion/soirée, `DailyActivityCompletionState` |
| 1.8.2 | 2026-07-16 | Sprint 4.7 correctif 2 | Suggestions diversifiées (max 5), catégories répétables, durées sport 10–40 / course 20–60, `adaptWorkoutSessionDuration` |
| 1.9.0 | 2026-07-17 | Sprint 4.8 | Matin réaliste, exceptions travail NLP, page Statistiques |
| 1.9.1 | 2026-07-17 | Sprint 4.8.1 | Menu Statistiques, édition timeline, demi-journées NLP |
| 1.9.2 | 2026-07-17 | Sprint 4.8.2 | Travail matin NLP appliqué, Terminer sans modif, calendrier Planning compact |
| 1.9.3 | 2026-07-17 | Sprint 4.8.3 | Planning sans calendrier, Annuler fiable, clarification pending NLP |
| 2.0.0 | 2026-07-17 | Sprint 5.0 | Life Reasoner, HabitProfile, Mon IA, bilan hebdo, BalanceScore, coach proactif |
| 2.1.0 | 2026-07-17 | Sprint 5.1 | Mémoire vivante, LivingHabitProfile, tendances, missions, adaptation progressive |
| 1.8.4 | 2026-07-16 | Sprint 4.7 correctif 4 | Durée révision choisissable, INSERT visible planning, assistant compact header |
| 1.8.3 | 2026-07-16 | Sprint 4.7 correctif 3 | Révision toujours visible si recommandée, suivi hebdo études, barre conversation sous header |

---

> **Ce document est la source de vérité du projet Équilibre IA.**
> Toute décision technique ou produit doit être compatible avec ce document.
> Toute divergence doit être documentée ici avant implémentation.
