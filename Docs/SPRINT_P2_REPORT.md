# Sprint P2 — Réorganisation intelligente d'une tâche d'étude

> **Date :** 18 juillet 2026  
> **Statut :** ✅ Terminé — en attente validation humaine  
> **Périmètre :** tâche d'étude · même journée · une proposition · confirmation obligatoire

---

## 1. Cartographie du flux existant (audit pré-implémentation)

| Zone | Fichier / service | Rôle existant réutilisé |
|------|-------------------|-------------------------|
| Affichage tâche planifiée | `DayTimeline.tsx` → `TimelineEntryCard` | Timeline du jour sur `PlanningPage` |
| Menu d'actions bloc | `BlockActionsMenu.tsx` | « Décaler », « Je n'ai pas le temps », compléter, annuler |
| Déplacement legacy | `blockActionService.ts` → `applyBlockAction({ action: "reschedule" })` | Options `later_today`, `tomorrow`, `custom` + `customDateTime` |
| Skip / no time | `blockActionService.ts` → `action: "no_time"` | `postpone`, `keep`, `cancel_today`, raccourcissement |
| Disponibilités | `planningEngine.ts` → `findAvailableSlots` | Algorithme legacy de fenêtres libres (pattern répliqué en P2 sur timeline) |
| Contraintes / chevauchement | `decisionEngineCore.ts` → `validatePlannedBlockCore` | Validation A3 (réveil, coucher, locked, fill ratio) |
| Contexte jour | `memoryContextService.ts` → `loadPlanningContextWithLife` | `PlanningContext` pour le moteur |
| Outcomes A4 | `outcomeObservationBridge.ts` | `proposal.presented/accepted/dismissed`, `task.rescheduled` |
| Identifiants | `entry.id`, `entry.calendarItemId`, `proposalId` généré | Traçabilité proposition P2 |

**Chemins legacy conservés :** aucun remplacement de `blockActionService` ; P2 appelle `applyBlockAction` avec `rescheduleOption: "custom"`.

**Éléments déjà présents dans blockActionService utiles à P2 :**
- Replanification via `customDateTime`
- Émission fail-open de `task.rescheduled` après déplacement réussi
- Garde-fous sur contraintes dures (`isHardConstraint`)

---

## 2. Parcours utilisateur final

```
Timeline — tâche d'étude planifiée (flag P2 ON)
    │
    ▼
Menu bloc → « Je ne peux pas maintenant »
    │
    ▼
searchStudyRescheduleProposal (orchestrateur)
    ├── findAlternativeStudySlots (Availability + Scheduler)
    ├── validatePlannedBlockCore (DecisionEngine A3)
    └── formatStudyRescheduleProposalMessage (Recommendation copy)
    │
    ├── Aucun créneau → StudyRescheduleInfoCard (message sobre, tâche inchangée)
    │
    └── Créneau trouvé → presentStudyRescheduleProposal → proposal.presented
            │
            ▼
        StudyRescheduleProposalCard
            ├── [Déplacer]     → proposal.accepted → revalidation → applyBlockAction → task.rescheduled
            ├── [Garder l'horaire actuel] → fermeture (aucun outcome)
            └── [Ignorer]      → proposal.dismissed
```

**Exemple de copy proposée :**

```
Tu ne peux pas réviser maintenant.

Un créneau de 30 minutes est disponible aujourd'hui entre 16 h 10 et 16 h 40.

Je peux déplacer « Révision naturopathie » à ce moment-là.

Il ne chevauche aucun autre engagement et te permet de conserver ta séance aujourd'hui (…).
```

---

## 3. Moteurs sollicités (existants — aucun #21)

| Frontière ADR-0006 | Implémentation P2 | Fichier |
|--------------------|-------------------|---------|
| **AvailabilityEngine** | Fusion intervalles bloquants, gaps futurs même jour | `findAlternativeStudySlots.ts` |
| **ConstraintEngine** | Blocs locked / structural exclus via validation | `isHardConstraint`, `validatePlannedBlockCore` |
| **SchedulerEngine** | Construction candidats + tri score déterministe | `findAlternativeStudySlots`, `pickBestAlternativeSlot` |
| **ReasoningEngine** | Justification courte (`scoreReason`) | `buildStudyRescheduleProposal.buildJustification` |
| **DecisionEngine** | Validation finale de chaque candidat | `validatePlannedBlockCore` (A3) |
| **RecommendationEngine** | Message naturel unique | `formatStudyRescheduleMessage.ts` |
| **ActionProposalEngine** | Préparation déplacement + confirmation | `studyRescheduleService.ts` |
| **OutcomeObservationEngine** | presented / accepted / dismissed / rescheduled | `outcomeObservationBridge` (A4) |

**Non sollicités :** LLM pour horaires, replanification journée entière, calendriers externes, Universal Learning.

---

## 4. Règles de sélection du créneau

1. **Fenêtre temporelle :** entre `now + 10 min` et heure de coucher (`getBedTime`).
2. **Durée :** conservée depuis la tâche d'origine (minimum 5 min).
3. **Exclusions :** entrée déplacée, `free_slot`, intervalles fusionnés sans chevauchement.
4. **Gap minimum :** 15 min entre blocs (`MIN_GAP_MINUTES`).
5. **Validation DecisionEngine :** chaque candidat passé par `validatePlannedBlockCore`.
6. **Scoring déterministe :** période d'étude préférée, proximité dans la journée (≤ 3 h), tie-break horaire.
7. **Présentation :** une seule option — `pickBestAlternativeSlot` (score le plus élevé).

---

## 5. Absence de solution

Si aucun candidat valide :

```
Je n'ai pas trouvé de créneau suffisamment long aujourd'hui.

Ta tâche reste à son horaire actuel.
```

- Aucun déplacement
- Aucune proposition au lendemain (hors périmètre P2)
- Fail-open en cas d'exception moteur (message sobre identique)

---

## 6. Concurrence et revalidation

Avant exécution de « Déplacer » :

1. `revalidateStudyRescheduleProposal` recalcule le meilleur créneau.
2. Si le créneau proposé n'est plus le meilleur identique → refus propre :

```
Ce créneau n'est plus disponible.

Aucun changement n'a été effectué.
```

3. `applyBlockAction` n'est jamais appelé si revalidation échoue.

---

## 7. ProposalTrace et événements

| Moment | Événement | Condition |
|--------|-----------|-----------|
| Affichage carte | `proposal.presented` | Créneau trouvé |
| Clic Déplacer | `proposal.accepted` | Avant tentative de move |
| Clic Ignorer | `proposal.dismissed` | Proposition tracée |
| Move réussi | `task.rescheduled` | Via `blockActionService` existant |
| Garder l'horaire | *(aucun)* | Fermeture UI seule |

**Sémantique respectée :** `proposal.accepted` sans move réussi ne produit pas `task.rescheduled`.

Session mémorisée via `rememberPilotProposalSession` (pont A4 existant).

---

## 8. Feature flag

| Variable | Défaut | Effet |
|----------|--------|-------|
| `VITE_P2_SMART_RESCHEDULING` | `false` | OFF → pas de bouton, pas de comportement P2 |
| | `true` | Bouton « Je ne peux pas maintenant » sur tâches d'étude éligibles (`PlanningPage`) |

Helper : `isSmartStudyReschedulingEnabled()` dans `featureFlags.ts`.

---

## 9. Architecture d'implémentation

```
PlanningPage
    └── useStudyRescheduleProposal (hook)
            └── studyRescheduleService (actions + outcomes)
                    └── buildStudyRescheduleProposal (orchestrateur)
                            ├── findAlternativeStudySlots
                            ├── validatePlannedBlockCore
                            └── formatStudyRescheduleMessage
    └── StudyRescheduleProposalCard / StudyRescheduleInfoCard (présentation)
DayTimeline → BlockActionsMenu (déclencheur « Je ne peux pas maintenant »)
```

**Interdictions respectées :** pas de calcul dispo en React, pas de second SchedulerEngine, pas de duplication blockActionService.

---

## 10. Fichiers créés

| Fichier | Rôle |
|---------|------|
| `src/lib/rescheduling/isStudyTimelineEntry.ts` | Éligibilité pilote (étude, non complétée, non contrainte dure) |
| `src/lib/rescheduling/findAlternativeStudySlots.ts` | Availability + Scheduler + scoring |
| `src/lib/rescheduling/buildStudyRescheduleProposal.ts` | Orchestrateur vertical |
| `src/lib/rescheduling/formatStudyRescheduleMessage.ts` | Copy naturelle FR |
| `src/lib/rescheduling/studyRescheduleService.ts` | Search / present / dismiss / confirm |
| `src/lib/rescheduling/buildStudyRescheduleProposal.test.ts` | 24 tests P2 |
| `src/hooks/useStudyRescheduleProposal.ts` | Hook PlanningPage |
| `src/components/rescheduling/StudyRescheduleProposalCard.tsx` | UI Déplacer / Garder / Ignorer |

---

## 11. Fichiers modifiés

| Fichier | Modification |
|---------|--------------|
| `src/pages/PlanningPage.tsx` | Hook P2 + cartes + callbacks timeline |
| `src/components/planning/DayTimeline.tsx` | Props `onCannotDoNowEntry`, `canOfferSmartReschedule` |
| `src/components/planning/BlockActionsMenu.tsx` | Bouton « Je ne peux pas maintenant » |
| `src/config/featureFlags.ts` | `isSmartStudyReschedulingEnabled()` |
| `.env.example` | `VITE_P2_SMART_RESCHEDULING=false` |
| `src/styles/sprint50.css` | Styles cartes P2 |
| `package.json` | `verify:p2` |

**Non modifiés :** contrats moteurs, migrations Supabase, P1, blockActionService (réutilisé tel quel).

---

## 12. Tests ajoutés

| Suite | Tests | Couverture |
|-------|:-----:|------------|
| `buildStudyRescheduleProposal.test.ts` | 24 | 22 scénarios spec + parcours vertical + frontières architecture |

Scénarios couverts :
1. Déclenchement tâche d'étude  
2. Créneau valide proposé  
3. Durée conservée  
4. Pas de chevauchement  
5. Événement verrouillé bloque  
6. Absence de créneau → message contrôlé  
7. Une seule option  
8. Déplacer via `applyBlockAction`  
9–14. Outcomes presented / accepted / dismissed  
15–16. Revalidation et conflit concurrent  
17. Fail-open observation  
18. Échec move sans rescheduled côté P2  
19. Flag désactivé par défaut  
20. P1 intact  
21. Pas de décision métier en UI  
22. Pas de nouvel événement / moteur  

Commande : `npm run verify:p2`

---

## 13. Protocole de validation manuelle

**Prérequis :** `VITE_P2_SMART_RESCHEDULING=true`, planning généré avec tâche d'étude (`activityType: revision`).

| Cas | Action | Résultat attendu |
|-----|--------|------------------|
| **A — créneau disponible** | « Je ne peux pas maintenant » sur révision | Carte avec un créneau + 3 boutons |
| **B — journée pleine** | Idem sur journée sans gap ≥ durée | Message « pas de créneau… » ; horaire inchangé |
| **C — conflit avant confirm** | Proposer puis ajouter un RDV sur le créneau (autre onglet / édition) | « Ce créneau n'est plus disponible » ; pas de move |
| **D — garder l'horaire** | Garder l'horaire actuel | Carte fermée ; tâche inchangée ; pas d'outcome |
| **E — ignorer** | Ignorer | Carte fermée ; `proposal.dismissed` si observation ON |

**Résultats manuels :** non exécutés (en attente validation humaine locale).

---

## 14. Résultats des commandes

| Commande | Résultat |
|----------|:--------:|
| `npm run build` | ✅ |
| `npm run lint` | ✅ (warnings préexistants uniquement) |
| `npm test` | ✅ **956** tests (+24 P2) |
| `npm run verify:contracts` | ✅ |
| `npm run verify:p1` | ✅ 5 tests |
| `npm run verify:p2` | ✅ 24 tests |

---

## 15. Risques restants

| Risque | Mitigation |
|--------|------------|
| P2 limité à `PlanningPage` (pas HomePage) | Aligné P1 ; extension future |
| Fuseau / format ISO local vs UTC en prod | Tests alignés sur `combineDateAndTime` ; surveiller edge cases |
| `Garder l'horaire` sans trace outcome | Volontaire (≠ rejet objectif) |
| Gap algorithm simplifié vs `findAvailableSlots` full | Suffisant P2 ; convergence possible si multi-catégories |

---

## 16. Dette

| Dette créée | Impact |
|-------------|--------|
| Algorithme gaps P2 parallèle à `findAvailableSlots` | Faible — scope une tâche / un jour |
| Pas de persistence proposition inter-session | Faible |

| Dette évitée | |
|--------------|--|
| Nouveau moteur #21 | ✅ |
| Nouveau contrat / événement | ✅ |
| Déplacement automatique | ✅ |
| Refactor global planning | ✅ |
| Migration Supabase | ✅ |

---

## 17. Recommandation pour la suite (P3+)

1. Étendre le pilote à `HomePage` / widget timeline si UX validée.
2. Factoriser gap-finding P2 vers adaptateur `findAvailableSlots` si second vertical (sport, travail).
3. Persister defer « Garder » si une catégorie outcome defer est ajoutée à A4.
4. Tests e2e Playwright sur Cas A–E une fois flag activé en CI staging.

---

## 18. Verdict Architecture Guardian

| Critère | Statut |
|---------|:------:|
| Réutilisation moteurs existants | ✅ |
| ADR-0006 frontières respectées | ✅ |
| Aucune décision métier en UI | ✅ |
| Horaires déterministes (sans LLM) | ✅ |
| Confirmation humaine obligatoire | ✅ |
| Pas de déplacement silencieux | ✅ |
| Revalidation avant action | ✅ |
| ProposalTrace / outcomes A4 | ✅ |
| Fail-open | ✅ |
| Absence moteur #21 | ✅ |
| Pas d'abstraction prématurée | ✅ |
| Non-régression P1 | ✅ |

### Verdict : **APPROVED**

Recommandations mineures : documenter fuseau dans protocole manuel ; envisager test e2e post-validation humaine.

---

*Aucun commit, merge ou déploiement effectué — en attente validation humaine.*
