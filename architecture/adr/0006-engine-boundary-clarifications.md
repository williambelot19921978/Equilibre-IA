# ADR-0006 : Clarification des frontières entre moteurs

> Statut : **accepted**  
> Date : 2026-07-18  
> Décideurs : Sprint A2 — validation humaine

## Contexte

Trois ambiguïtés identifiées lors de la revue CTO pré-implémentation devaient être tranchées avant les contrats TypeScript Sprint A2.

## 1. SchedulerEngine versus DecisionEngine

### Question

Qui construit les options ? Qui arbitre ? Qui valide le plan final ?

### Décision

| Rôle | Moteur | Responsabilité |
|------|--------|----------------|
| **Construire** les placements calendrier | **SchedulerEngine** | Génère `DayPlan` / `SchedulePatch` **déterministe** à partir de contraintes, créneaux, poids objectifs |
| **Arbitrer** priorités et tradeoffs | **ReasoningEngine** | Produit `ProposedDecision` argumentée (incl. demande de replan si pertinent) |
| **Valider** conformité règles | **DecisionEngine** | Gatekeeper : approuve ou rejette plan/proposition ; exige confirmation si autonomie basse |
| **Proposer** actions typées | **ActionProposalEngine** | Transforme décision validée en actions exécutables |

### Flux canonique (planning)

```
ReasoningEngine → ProposedDecision (incl. schedulingRequest si besoin)
       ↓
SchedulerEngine → DayPlan | SchedulePatch   (CONSTRUIT)
       ↓
DecisionEngine  → DecisionValidation        (VALIDE le plan)
       ↓
ActionProposalEngine → proposedActions
       ↓
ActionExecution (service)
```

**SchedulerEngine ne décide pas** si un plan est acceptable — il **calcule**.  
**DecisionEngine ne place pas** de blocs — il **valide**.

Ordre strict : **Scheduler produit → Decision valide** (jamais l'inverse pour un plan final).

## 2. ReasoningEngine versus RecommendationEngine versus SchedulerEngine

### Question

Qui raisonne ? Qui fabrique une recommandation ? Qui place dans le temps ?

### Décision

| Capacité | Moteur | Exemple |
|----------|--------|---------|
| **Raisonner** (arbitrer, expliquer, alternatives) | **ReasoningEngine** | « Tu es fatigué — allège la soirée ou décale le sport ? » |
| **Recommander** un contenu d'activité (après Planning First) | **RecommendationEngine** | « Film X, séance course légère, moment calme » |
| **Planifier** dans le calendrier | **SchedulerEngine** | Bloc 18h–19h « sport » placé mardi |

### Règle Planning First

```
AvailabilityEngine (créneaux réels)
       ↓
ReasoningEngine (arbitrage global — optionnel selon intent)
       ↓
RecommendationEngine (QUOI faire — si intent loisir/suggestion)
       ↓
SchedulerEngine (QUAND — si placement calendrier requis)
```

- **ReasoningEngine** peut **demander** une recommandation ou un replan — il ne détaille pas l'activité ni ne place le bloc.
- **RecommendationEngine** ne modifie **jamais** le calendrier directement.
- **SchedulerEngine** ne choisit **pas** le film ou l'activité — il place ce qui est déjà décidé/proposé.

## 3. PersonalLanguageMemoryEngine versus IntentEngine

### Question

Qui reconnaît le sens global ? Qui applique les expressions personnelles ? Qui valide une correction ?

### Décision

| Étape | Moteur | Rôle |
|-------|--------|------|
| **Résolution expression personnelle** | **PLM** (upstream) | Match expressions apprises du membre → `LanguageResolution` + hints |
| **Classification intent global** | **IntentEngine** | Intent + entités ; **arbitre final** si conflit avec hint PLM |
| **Validation apprentissage PLM** | **PLM** + **utilisateur** | PLM **propose** ; utilisateur **confirme** ; OutcomeObservationEngine signale confirmation |

### Règle d'arbitrage PLM / Intent

1. PLM fournit `languageHints[]` en amont (parallèle).
2. IntentEngine **intègre** hints comme signal, pas comme vérité absolue.
3. Si `confidence(PLM) > seuil` **et** pas de conflit entités → IntentEngine **adopte** hint.
4. Si conflit → IntentEngine **gagne** ; NaturalResponseEngine peut demander clarification.
5. Nouvelle expression → PLM `learningProposal` → confirmation utilisateur → **jamais** écriture Universal sans gate.

**IntentEngine** = sens **structuré global**.  
**PLM** = sens **personnel appris**.  
**Utilisateur** = seule source validation apprentissage PLM.

## Conséquences

- Contrats TypeScript Sprint A2 reflètent ces flux.
- Tests de contrat vérifient ordering Scheduler → Decision.
- Migration legacy : extraire validation inline de `planningEngine` vers DecisionEngine.

## Références

- ADR-0005 (gel 20 moteurs)
- [`architecture/contracts/scheduler-engine.md`](../contracts/scheduler-engine.md)
- [`architecture/contracts/decision-engine.md`](../contracts/decision-engine.md)
- [`architecture/contracts/reasoning-engine.md`](../contracts/reasoning-engine.md)
