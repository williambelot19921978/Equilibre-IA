# ADR-0000 : Processus ADR

> Statut : **accepted**  
> Date : 2026-07-18  
> Décideurs : Équipe Équilibre IA (validation humaine)

## Contexte

Le projet Équilibre IA accumule des décisions structurantes (Constitution, pipeline IA, modèle foyer, Robot QA). Sans traçabilité, les décisions se perdent et l'architecture dérive.

## Problème

Comment documenter les décisions architecturales de manière durable et consultable ?

## Options

1. **Notes dispersées** dans ROADMAP ou PROJECT_BIBLE
2. **ADR dédiés** dans `architecture/adr/`
3. **Wiki externe**

## Choix

**Option 2 — ADR dans `architecture/adr/`**

Format standard défini dans [`Docs/ARCHITECTURE_GUARDIAN.md`](../../Docs/ARCHITECTURE_GUARDIAN.md) §10.

## Conséquences

### Positives

- Traçabilité des décisions
- Onboarding facilité pour nouveaux contributeurs
- Architecture Guardian a une base de référence

### Négatives

- Overhead documentation (mitigé : ADR uniquement pour décisions structurantes)

## Alternatives rejetées

- **Notes dispersées** : noyées dans docs volumineux, pas de statut
- **Wiki externe** : hors repo, risque de désynchronisation
