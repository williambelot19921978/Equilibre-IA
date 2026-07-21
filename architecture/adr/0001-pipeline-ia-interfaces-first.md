# ADR-0001 : Pipeline IA — Interfaces First

> Statut : **accepted**  
> Date : 2026-07-18  
> Décideurs : Validation humaine (phase Architecture)

## Contexte

Le pipeline IA cible comporte **20 moteurs figés** (Constitution ch. 13, ADR-0005). Historique : 16 composants (ADR-0001), 18 moteurs (ADR-0002 superseded).

## Problème

Comment migrer vers le pipeline cible sans réécriture big bang ni régression ?

## Options

1. **Réécriture complète immédiate** — remplacer tous les moteurs d'un coup
2. **Interfaces first, migration progressive** — contrats d'abord, remplacement composant par composant
3. **Statu quo** — continuer sans pipeline unifié

## Choix

**Option 2 — Interfaces first, migration progressive**

Étapes :
1. Définir interfaces dans `architecture/contracts/` puis `src/ai/contracts/`
2. Définir contrats (entrées, sorties, invariants)
3. Documenter responsabilités
4. Remplacer progressivement les moteurs existants

## Conséquences

### Positives

- Pas de big bang
- Chaque composant testable isolément
- Architecture Guardian peut valider contrat avant implémentation

### Négatives

- Période de coexistence legacy + nouveau
- Discipline requise pour ne pas contourner les interfaces

## Alternatives rejetées

- **Réécriture complète** : risque régression majeur, délai long
- **Statu quo** : dette technique croissante, incohérence Constitution

## Références

- Constitution ch. 13
- `architecture/contracts/README.md`
- Sprint A1 (ROADMAP)
