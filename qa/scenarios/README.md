# Matrice de scénarios QA — Équilibre IA

> **200 scénarios minimum (Phase 1)** — extension progressive vers 1000

## Structure

```
qa/scenarios/
├── README.md          # Ce fichier
├── schema.json        # Schéma JSON des scénarios
├── index.yaml         # Index global et statistiques
└── domains/           # Scénarios par domaine
    ├── auth.yaml
    ├── onboarding.yaml
    ├── household.yaml
    ├── planning-core.yaml
    ├── planning-conflicts.yaml
    ├── ia-conversation.yaml
    ├── ia-memory.yaml
    ├── goals.yaml
    ├── life-events.yaml
    ├── permissions-privacy.yaml
    ├── wellbeing-sport.yaml
    ├── ui-responsive.yaml
    ├── data-persistence.yaml
    └── regression-smoke.yaml
```

## Format

Chaque scénario est un objet YAML conforme à `schema.json`.

Template : [`../templates/scenario.template.yaml`](../templates/scenario.template.yaml)

### Champs obligatoires

| Champ | Description |
|-------|-------------|
| `id` | `QA-<DOMAINE>-<NNN>` unique |
| `domain` | Domaine fonctionnel |
| `title` | Intitulé actionnable |
| `preconditions` | État initial requis |
| `profile` | Profil utilisateur cible |
| `steps` | Étapes du scénario |
| `expected` | Résultat attendu |
| `criticality` | critical / high / medium / low |
| `status` | pending / automated / manual / passing / failing |
| `automated_test` | Lien vers test auto (optionnel) |
| `last_run` | Date ISO du dernier passage (optionnel) |

## Profils couverts

La matrice Phase 1 inclut des scénarios pour :

- célibataire, couple sans enfant, famille avec enfants
- famille monoparentale, garde alternée, foyer multigénérationnel
- agriculteur, infirmier de nuit, artisan, routier, cadre
- étudiant, retraité, indépendant, télétravail
- horaires variables, sans emploi

## Règles

1. Chaque scénario couvre un **risque réel** (produit, métier, UX ou technique).
2. Pas de scénarios artificiels ou dupliqués sans valeur.
3. Alignement avec [`Docs/EQUILIBRE_AI_CONSTITUTION.md`](../../Docs/EQUILIBRE_AI_CONSTITUTION.md).
4. Référencer `constitution_refs` quand pertinent.
5. Mettre à jour `index.yaml` lors de l'ajout de scénarios.

## Exécution

Les scénarios `automated` ou `passing` doivent pointer vers :

- tests Vitest : `src/**/*.test.ts`
- tests Playwright : `tests/e2e/**/*.spec.ts`

## Rapports

Les résultats d'exécution sont documentés dans [`../reports/`](../reports/) selon le template [`../templates/qa-report.template.md`](../templates/qa-report.template.md).
