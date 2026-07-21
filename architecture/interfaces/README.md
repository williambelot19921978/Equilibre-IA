# Interfaces — Documentation inter-composants

> Frontières entre moteurs, services, pages et Supabase.

## Principes

- Une interface = un contrat clair (entrées, sorties, invariants)
- Pas de couplage direct entre moteurs sans interface documentée
- Le LLM ne contourne jamais les interfaces déterministes (Constitution ch. 13)

## Interfaces clés actuelles

| Interface | Producteur | Consommateur |
|-----------|------------|--------------|
| `ProfileFactRecord[]` | Supabase / services | Memory, Planning, NLP |
| `PlanningContext` | `planningEngine` | Conversation, suggestions |
| `NlpParseResult` | `intentEngine` | `actionResolver` |
| `HouseholdMember` | Supabase RPC | Pages onboarding, planning |

## À documenter (A1)

- Interface unifiée `ConversationContext`
- Interface `HouseholdContext` (modèle foyer centrale)
- Interface `PendingAction` (actions conversationnelles)

Chaque nouvelle interface structurante → **ADR obligatoire**.
