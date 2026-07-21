# Équilibre IA — Charte du Robot QA

> **Composant officiel du projet** — au même titre que le moteur de planning ou la conversation IA
>
> Version : 1.3.0  
> Date : 18 juillet 2026  
> Constitution : [`EQUILIBRE_AI_CONSTITUTION.md`](./EQUILIBRE_AI_CONSTITUTION.md) (ch. 19–22)  
> Architecture Guardian : [`ARCHITECTURE_GUARDIAN.md`](./ARCHITECTURE_GUARDIAN.md) — pilier **avant** dev
> Références : [`PROJECT_BIBLE.md`](./PROJECT_BIBLE.md), [`AI_RULEBOOK.md`](./AI_RULEBOOK.md), [`ROADMAP.md`](./ROADMAP.md)

---

## 0. Statut officiel

> **Décision validée :** le Robot QA n'est **pas** un simple ensemble de tests.

C'est un **composant officiel** possédant :

| Élément | Emplacement |
|---------|-------------|
| Architecture | §2 ci-dessous + évolution `qa/robot/` |
| Documentation | Ce document + Constitution ch. 19 |
| Roadmap | [`ROADMAP.md`](./ROADMAP.md) § Robot QA |
| Rapports | `qa/reports/<date>-<feature>.md` |
| Métriques | Health Score (Constitution ch. 20) — à implémenter |
| Matrice scénarios | `qa/scenarios/` (200 scénarios Phase 1) |

## 1. Mission

Le Robot QA est le gardien permanent de la qualité d'Équilibre IA. Il existe pour garantir que chaque évolution du produit :

- respecte la [constitution](./EQUILIBRE_AI_CONSTITUTION.md) ;
- ne régresse pas les parcours existants ;
- reste utilisable sur desktop et mobile ;
- protège les données et permissions ;
- produit des rapports actionnables avant tout déploiement ;
- contribue à terme au **Health Score** global du projet.

## 1.1 Décisions produit — le Robot QA ne décide jamais seul

Le Robot QA **peut** :

- détecter bugs, incohérences UX, régressions, comportements étranges ;
- **proposer** des améliorations ;
- corriger automatiquement les erreurs **sûres** (voir § Auto-correction).

Le Robot QA **ne peut pas** :

- modifier la logique métier, les permissions, le comportement IA, le modèle foyer ;
- prendre des décisions produit ou UX structurantes ;
- déployer ou valider un déploiement sans validation humaine.

> **Les décisions produit restent humaines.**

## 2. Architecture cible

```
qa/
├── scenarios/          # Matrice de scénarios (200+)
├── reports/            # Rapports par feature
├── templates/          # Templates scénario et rapport
└── robot/              # (à créer) Orchestrateur Robot QA
    ├── orchestrator    # Lit constitution + scénarios, lance exécutions
    ├── executors/      # Vitest, Playwright, lint, build, verify
    ├── reporters/      # Génère rapports markdown
    └── health-score/   # (futur) Calcul Health Score
```

### Roadmap Robot QA

| Phase | Objectif | Statut |
|-------|----------|--------|
| RQA-0 | Charte + matrice 200 scénarios | ✅ Fait |
| RQA-1 | Orchestrateur `npm run qa:robot` | 📋 Planifié |
| RQA-2 | Mapping scénarios ↔ tests automatisés | 📋 Planifié |
| RQA-3 | Health Score (calcul + rapport) | 💡 Vision |
| RQA-4 | Vérification post-déploiement production | 💡 Vision |

## 3. Périmètre de vérification

Le Robot QA doit systématiquement vérifier :

| Domaine | Vérifications |
|---------|---------------|
| **Site** | Navigation, chargement, erreurs visibles |
| **Fonctionnalités** | Parcours nominal et alternatifs de chaque nouvelle feature |
| **Régressions** | Comparaison avec l'état validé précédent |
| **Boutons** | Présence, état disabled/loading, action branchée |
| **Formulaires** | Validation, soumission, messages d'erreur |
| **Règles métier** | Planning First, contraintes, priorités |
| **Permissions** | RLS, accès inter-membres, données privées |
| **Données** | Persistance, cohérence, refresh |
| **Responsive** | Layout mobile, tablette, desktop |
| **Mobile** | Touch, viewport, scroll, clavier |
| **Console** | Absence d'erreurs non gérées |
| **Réseau** | Erreurs API, timeouts, retry |
| **Accessibilité** | Labels, focus, contrastes de base |
| **Performances** | Temps de chargement, bundle, latence perçue |
| **UX** | Cohérence avec constitution et specs |
| **Dual Memory** | Aucune PII dans Universal Learning — voir §3.1 |

## 3.1 Contrôle permanent — Universal Learning (Dual Memory)

> **Obligatoire** pour toute feature touchant mémoire, apprentissage, langage ou agrégation.

Le Robot QA doit **vérifier en permanence** qu'**aucune donnée personnelle** ne peut être injectée dans le **Universal Learning Engine**.

### Checklist anti-PII

| # | Vérification | Méthode |
|---|--------------|---------|
| UL-1 | Aucun export direct Personal Memory → Universal | Revue architecture + code (quand implémenté) |
| UL-2 | Gate anonymisation présente avant agrégation | Spec + tests |
| UL-3 | Pas de noms, prénoms, adresses dans store universal | Scan patterns + tests |
| UL-4 | Pas de calendrier, horaires, objectifs personnels agrégés | Revue données test |
| UL-5 | Pas de santé, finances, localisation | Revue + rejet automatique |
| UL-6 | Q11 Architecture Guardian documentée | Revue `architecture/decisions/` |
| UL-7 | Stores Personal et Universal séparés | Architecture + schéma DB futur |
| UL-8 | Scénario : « un membre court mardi 18h » **rejeté** par gate (donnée personnelle) | Test manuel / automatisé |

### Format d'alerte

```
Violation Dual Memory détectée

- Type : PII_IN_UNIVERSAL | MIXED_MEMORY | MISSING_GATE
- Donnée concernée : [catégorie sans PII dans le log public]
- Fichiers / composants :
- Risque : critical
- Recommandation : REJET — corriger avant déploiement
```

### Scénarios QA associés

- `QA-MEM-015` — Dual Memory typage TypeScript
- `QA-MEM-016` — OutcomeObservation sans contenu vie
- `QA-PRV-015` — Aucune fuite inter-foyer via Universal Learning

Référence : [`UNIVERSAL_LEARNING_ENGINE.md`](./UNIVERSAL_LEARNING_ENGINE.md)

## 3.2 Documents obligatoires à lire

Avant tout cycle QA significatif, le Robot QA lit :

1. [`Docs/EQUILIBRE_AI_CONSTITUTION.md`](./EQUILIBRE_AI_CONSTITUTION.md) — **ch. 14, 22**
2. [`Docs/UNIVERSAL_LEARNING_ENGINE.md`](./UNIVERSAL_LEARNING_ENGINE.md)
3. [`Docs/PROJECT_BIBLE.md`](./PROJECT_BIBLE.md)
4. [`Docs/AI_RULEBOOK.md`](./AI_RULEBOOK.md)
5. [`Docs/ROADMAP.md`](./ROADMAP.md)
6. La spécification ou le ticket de la fonctionnalité testée
7. La matrice de scénarios dans `qa/scenarios/`

## 4. Processus par fonctionnalité

Chaque nouvelle fonctionnalité suit ce processus **sans exception** :

```
1. Lire la constitution
2. Vérifier cohérence vision
3. Produire un plan
4. Implémenter
5. Tests unitaires
6. Tests d'intégration
7. Tests Playwright
8. Robot QA (check spécifique feature)
9. Vérification régressions
10. Rapport QA
11. Auto-correction bugs sûrs
12. Signalement incohérences produit
13. Recommandation déploiement (GO / GO AVEC RÉSERVES / NO GO)
```

## 5. Check spécifique nouvelle fonctionnalité

Pour chaque feature, le Robot QA exécute au minimum :

| Scénario | Description |
|----------|-------------|
| Parcours nominal | Happy path complet |
| Erreurs utilisateur | Saisies invalides, champs manquants |
| Données vides | État initial, listes vides |
| Données partielles | Profil incomplet, onboarding interrompu |
| Données extrêmes | Longues chaînes, dates limites, volume élevé |
| Annulation | Abandon mid-flow |
| Retour arrière | Navigation arrière, undo si applicable |
| Rafraîchissement | F5 / reload mid-session |
| Persistance | Données conservées après reload |
| Mobile | Viewport 375px minimum |
| Desktop | Viewport 1280px+ |
| Permissions | Accès autorisé / refusé |
| Conflits | Planning, doublons, chevauchements |
| Double clic | Pas de double soumission |
| Latence réseau | Slow 3G simulé |
| Erreurs Supabase | 401, 403, 500 simulés ou observés |
| Messages affichés | Clarté, langue, pas de jargon technique |
| Cohérence cahier des charges | Specs respectées |
| Cohérence constitution | Planning First, protection temps, universalité |

## 6. Matrice de scénarios

### Emplacement

```
qa/scenarios/
├── README.md           # Guide et conventions
├── schema.json         # Schéma JSON des scénarios
├── index.yaml          # Index global (200+ scénarios)
└── domains/            # Scénarios par domaine
    ├── auth.yaml
    ├── onboarding.yaml
    └── ...
```

### Format standard

Voir `qa/templates/scenario.template.yaml` et `qa/scenarios/schema.json`.

Champs obligatoires :

| Champ | Type | Description |
|-------|------|-------------|
| `id` | string | Identifiant unique (`QA-XXX-NNN`) |
| `domain` | string | Domaine fonctionnel |
| `title` | string | Titre lisible |
| `preconditions` | array | État requis avant test |
| `profile` | string | Profil utilisateur (voir liste ci-dessous) |
| `steps` | array | Étapes numérotées |
| `expected` | string | Résultat attendu |
| `criticality` | enum | `critical` \| `high` \| `medium` \| `low` |
| `status` | enum | `pending` \| `automated` \| `manual` \| `passing` \| `failing` |
| `automated_test` | string? | Chemin test Playwright/Vitest |
| `last_run` | date? | Dernière exécution (ISO 8601) |
| `constitution_refs` | array? | Sections constitution concernées |

### Profils utilisateur de référence

La matrice couvre au minimum ces profils :

- célibataire
- couple sans enfant
- famille avec enfants
- famille monoparentale
- garde alternée
- agriculteur
- infirmier de nuit
- artisan
- étudiant
- retraité
- routier
- cadre
- travailleur indépendant
- télétravail
- horaires variables
- sans emploi
- foyer multigénérationnel

### Objectif de couverture

- **Phase 1 (actuelle)** : 200 scénarios minimum, chacun couvrant un risque produit, métier, UX ou technique réel.
- **Phase 2** : extension progressive vers 1000 scénarios.
- **Interdit** : créer des tests artificiels sans valeur.

## 7. Auto-correction

### Le Robot QA **peut** corriger automatiquement

- faute de texte évidente ;
- bouton non branché (wiring évident) ;
- erreur de sélecteur de test ;
- test cassé à cause d'un renommage légitime ;
- erreur console simple ;
- oubli d'état loading ;
- erreur d'affichage évidente ;
- bug de persistance localisé ;
- incohérence technique sans impact métier.

### Le Robot QA **ne doit pas** modifier automatiquement

- logique métier ;
- règles de priorité ;
- permissions ;
- suppressions ;
- comportement de l'IA ;
- niveau d'autonomie ;
- modèle foyer ;
- décisions produit ;
- UX structurante ;
- schéma de données majeur.

### Format d'incohérence produit

Lorsqu'une incohérence produit est détectée, produire :

```
Incohérence produit détectée

- Comportement actuel : ...
- Comportement attendu : ...
- Risque : ...
- Proposition : ...
- Fichiers concernés : ...
- Niveau de criticité : critical | high | medium | low
- Recommandation : ...
```

## 8. Rapport QA obligatoire

### Emplacement

```
qa/reports/<YYYY-MM-DD>-<feature>.md
```

Template : `qa/templates/qa-report.template.md`

### Contenu requis

- fonctionnalité testée ;
- environnement (local, preview, production) ;
- commit SHA ;
- navigateurs testés ;
- tailles d'écran ;
- scénarios exécutés (IDs) ;
- résultats (pass/fail/skip) ;
- bugs détectés ;
- bugs corrigés automatiquement ;
- incohérences produit ;
- régressions ;
- tests ajoutés ;
- tests manquants ;
- niveau de confiance (0–100 %) ;
- recommandation de déploiement : **GO** | **GO AVEC RÉSERVES** | **NO GO**.

## 9. CI et déploiement

### Pipeline CI minimum

```bash
npm run lint
npm run build
npm test
npx playwright test
```

Si disponibles :

```bash
npm run verify:schema
npm run verify:supabase
```

### Critères avant production

| Critère | Requis |
|---------|--------|
| Tests critiques | Tous passants |
| Bugs bloquants | Aucun |
| Bugs majeurs | Aucun non accepté |
| Rapport QA | Produits et validé |
| Build | Valide |
| Migrations | Validées |
| Smoke préproduction | Passant |
| Smoke post-déploiement | Passant |

Le Robot QA vérifie également la **production après déploiement**.

## 10. Outils actuels et évolution

| Outil | Rôle actuel |
|-------|-------------|
| Vitest | Tests unitaires et intégration |
| Playwright | Tests E2E, auth, parcours utilisateur |
| oxlint | Lint |
| GitHub Actions | CI (`/.github/workflows/ci.yml`) |

### Évolution cible

Le Robot QA formalisé pourra orchestrer :

- exécution sélective par domaine ;
- génération automatique de rapports ;
- mapping scénarios ↔ tests automatisés ;
- vérification post-déploiement production ;
- détection d'incohérences constitutionnelles.

## 10. Health Score et Architecture Score (vision)

> Concepts validés — **non automatisés** à ce stade.

### Architecture Score (Architecture Guardian)

Produit **avant** développement lors de chaque revue. Dimensions :

Vision, Architecture, Interfaces, Réutilisation, Dette technique, Maintenabilité, Extensibilité.

Voir [`ARCHITECTURE_GUARDIAN.md`](./ARCHITECTURE_GUARDIAN.md) §8.

### Health Score (Robot QA)

Produit **après** développement. Intègre l'Architecture Score parmi :

Architecture Score, Documentation, Tests, UX, Performance, Sécurité, Accessibilité, Respect Constitution, Couverture fonctionnelle, Dette technique, Confiance déploiement.

Voir Constitution ch. 20.

## 11. Gouvernance

- Le Robot QA **ne remplace pas** la validation humaine sur les décisions produit.
- Toute auto-correction doit être **traçable** (commit, rapport, ou log).
- En cas de doute entre bug technique et incohérence produit → **incohérence produit** et escalade humaine.
- La [constitution](./EQUILIBRE_AI_CONSTITUTION.md) prévaut sur toute autre doc en cas de conflit.

---

*Charte du Robot QA — Équilibre IA v1.0.0*
