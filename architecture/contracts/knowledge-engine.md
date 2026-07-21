# KnowledgeEngine — Contrat

> ID : `knowledge-engine` · Pipeline #16 · External Knowledge · *(planifié)*

## Mission

Fournir des **informations externes vérifiables** (météo, horaires, lieux, définitions) **après** analyse du contexte planning. Jamais avant Planning First (Constitution ch. 15).

## Entrées

| Entrée | Type conceptuel | Source |
|--------|-----------------|--------|
| `knowledgeRequest` | Type + query + geo | RecommendationEngine / ReasoningEngine |
| `planningContext` | Contexte (preuve Planning First) | PlanningContextEngine |
| `availableSlots[]` | Créneau cible | AvailabilityEngine |

## Sorties

| Sortie | Type conceptuel | Consommateur(s) |
|--------|-----------------|-----------------|
| `KnowledgeResult` | `{ data, source, fetchedAt, confidence }` | RecommendationEngine, NaturalResponseEngine |

## Dépendances

| Moteur | Obligatoire |
|--------|-------------|
| AvailabilityEngine | Oui (gate Planning First) |

## Responsabilités

- Fetch météo, trafic, horaires, événements locaux.
- Citer ou expliquer l'origine (Constitution ch. 15).
- Retourner erreur explicite si indisponible — **ne jamais inventer**.

## Ce qu'il ne doit jamais faire

- Intervenir avant analyse planning/disponibilité.
- Inventer horaires, adresses, notes.
- Remplacer RecommendationEngine.

## Interfaces publiques (cibles)

```typescript
interface IKnowledgeEngine {
  fetch(input: KnowledgeRequest): Promise<KnowledgeResult>;
  canFetch(request: KnowledgeRequest): boolean;
}
```

## Événements émis

| Événement | Payload | Quand |
|-----------|---------|-------|
| `knowledge.fetched` | `{ type, source }` | Données obtenues |
| `knowledge.failed` | `{ type, error }` | Échec fetch |

## Mapping code actuel

| Fichier | Rôle |
|---------|------|
| — | **Aucune implémentation** |

## Chevauchements

Aucun (moteur absent — gap Constitution ch. 15).
