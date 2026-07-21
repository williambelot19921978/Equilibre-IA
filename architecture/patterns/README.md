# Patterns — Architecturaux approuvés

> Patterns validés par l'Architecture Guardian. Tout nouveau pattern → ADR ou extension documentée ici.

## Patterns actifs

### 1. Planning First

Analyser temps, contraintes et foyer **avant** toute recommandation ou action.

Référence : Constitution ch. 4, Loi 1.

### 2. Interfaces First (migration progressive)

Définir contrat → implémenter interface → remplacer moteur legacy sans big bang.

Référence : Constitution ch. 13, ADR-0001.

### 3. Foyer entité centrale

Toute donnée relationnelle passe par `household` / `household_members`, jamais par un champ texte conjoint.

Référence : Constitution ch. 6.

### 4. Moteur déterministe + LLM auxiliaire

Planning, permissions, conflits = déterministe. LLM = dialogue, ambiguïté, ton.

Référence : Constitution ch. 13.

### 5. Pending Action conversationnelle

Actions multi-tours via état `pendingAction` explicite, pas d'inférence implicite seule.

Référence : `src/lib/nlp/conversationActionPending.ts` (existant).

### 6. Universalité — pas de profil fondateur

Aucun hardcode profil fondateur en production. Profils test isolés.

Référence : Constitution ch. 1, ch. 7.

## Patterns interdits

| Pattern | Raison |
|---------|--------|
| Nouveau moteur sans revue Q3 | Duplication |
| LLM modifie planning directement | Contourne règles déterministes |
| `partner_name` pour logique métier | Legacy — utiliser household_members |
| Feature sans scénario QA mappable | Robot QA bloqué |
