# EPIC1-A — Daily Brief intelligent

> **Date :** 18 juillet 2026  
> **Statut :** ✅ Terminé — en attente validation humaine  
> **Phase :** Assistant proactif — premier Daily Brief

---

## 1. Parcours utilisateur

```
Première visite Accueil du jour (flag ON)
    │
    ▼
buildDailyBrief (orchestrateur)
    ├── PlanningContextEngine (contexte jour)
    ├── AvailabilityEngine (analyse timeline)
    ├── DecisionEngine (validation études via P1)
    ├── ReasoningEngine (justification études)
    └── RecommendationEngine (suggestions études via P1)
    │
    ▼
DailyBriefModal (overlay unique)
    ├── Salutation : Bonjour {Prénom} 👋
    ├── Synthèse : une phrase calme
    └── 0 à 3 cartes recommandation
    │
    ├── [Compris / Fermer] → mémorisé localStorage (plus de modal aujourd'hui)
    └── [Voir] sur carte → Planning
    │
    ▼
DailyBriefSection (Accueil — toujours consultable)
    └── Réduire / Ouvrir
```

**Questions couvertes :**

| Question | Source |
|----------|--------|
| Que retenir aujourd'hui ? | Synthèse journée (chargée / ouverte / équilibrée) |
| Meilleure action ? | Carte Études (si créneau validé par DecisionEngine) |
| Risque / opportunité ? | Carte Temps (après-midi dense) ou Sport (séance prévue) |

---

## 2. Architecture

```
HomePage
    └── useDailyBrief (hook — état modal + délégation)
            └── buildDailyBrief (orchestrateur pur)
                    ├── analyzeDayForBrief (disponibilité / densité)
                    └── buildDailyBriefRecommendations
                            ├── buildStudySlotRecommendation (P1 — Recommendation + Decision)
                            ├── reasonAboutLifeProposal (ReasoningEngine)
                            └── règles sport / temps (déterministes)
    ├── DailyBriefModal (première ouverture)
    └── DailyBriefSection (consultation Accueil)
```

**Principe :** aucune décision métier dans les composants React — affichage et callbacks uniquement.

---

## 3. Moteurs utilisés (existants — aucun #21)

| Moteur | Rôle Daily Brief | Fichier réutilisé |
|--------|------------------|-------------------|
| **PlanningContextEngine** | Contexte jour, profil, lifeContext | `loadPlanningContextWithLife` |
| **AvailabilityEngine** (pattern) | Analyse créneaux libres, densité | `analyzeDayForBrief`, timeline |
| **DecisionEngine** | Validation recommandation études | `validatePlannedBlockCore` via P1 |
| **ReasoningEngine** | Justification cartes études | `reasonAboutLifeProposal` |
| **RecommendationEngine** | Suggestion études | `generateFreeTimeSuggestions` via P1 |
| **OutcomeObservationEngine** | *Non sollicité* | Événements `dailybrief.*` absents du contrat |

**Non sollicités :** LLM, Universal Learning, HumanModel, NotificationEngine.

---

## 4. Contenu et règles

### Salutation
`Bonjour {Prénom} 👋` — capitalisation automatique.

### Synthèse (deterministic)
| Condition | Phrase |
|-----------|--------|
| Journée vide | « Ta journée est encore à composer. » |
| ≥ 90 min libres, peu planifié | « Tu disposes de plusieurs créneaux intéressants aujourd'hui. » |
| ≥ 300 min planifiées ou ≥ 8 blocs | « Aujourd'hui semble être une journée assez chargée. » |
| Sinon | « Ta journée paraît plutôt équilibrée. » |

### Recommandations (max 3)

| Type | Icône | Priorité | Condition |
|------|-------|----------|-----------|
| Études | 📚 | 100 | Créneau libre + P1 validé par DecisionEngine |
| Sport | 🏃 | 80 / 75 | Séance prévue ou déjà complétée |
| Temps | ⚠ | 55 | Après-midi dense (≥ 4 blocs ou ≥ 180 min entre 12h–18h) |

Tri décroissant par priorité → slice(0, 3).

---

## 5. Outcomes et mémoire

Les événements `dailybrief.presented`, `dailybrief.opened`, `recommendation.clicked` **n'existent pas** dans `outcome-events.ts`.

**Conformément au cahier des charges : aucun nouvel événement créé.**

Mémorisation locale uniquement :
- `localStorage` : `daily-brief-presented:{userId}:{date}`
- Pas d'écriture HumanModel / Universal Learning

---

## 6. Feature flag

| Variable | Défaut | Effet |
|----------|--------|-------|
| `VITE_DAILY_BRIEF` | `false` | OFF → aucun modal, aucune section |

Helper : `isDailyBriefEnabled()` dans `featureFlags.ts`.

---

## 7. Fichiers créés

| Fichier | Rôle |
|---------|------|
| `src/lib/dailyBrief/buildDailyBrief.ts` | Orchestrateur vertical |
| `src/lib/dailyBrief/buildDailyBriefRecommendations.ts` | Candidats + tri Decision/Reasoning |
| `src/lib/dailyBrief/analyzeDayForBrief.ts` | Synthèse + densité après-midi |
| `src/lib/dailyBrief/formatDailyBriefMessage.ts` | Copy naturelle FR |
| `src/lib/dailyBrief/dailyBriefStorage.ts` | Première ouverture / jour |
| `src/lib/dailyBrief/buildDailyBrief.test.ts` | 21 tests |
| `src/hooks/useDailyBrief.ts` | Hook HomePage |
| `src/components/dailyBrief/DailyBriefCard.tsx` | Carte recommandation |
| `src/components/dailyBrief/DailyBriefContent.tsx` | Corps brief |
| `src/components/dailyBrief/DailyBriefModal.tsx` | Overlay première ouverture |
| `src/components/dailyBrief/DailyBriefSection.tsx` | Section Accueil |

---

## 8. Fichiers modifiés

| Fichier | Modification |
|---------|--------------|
| `src/pages/HomePage.tsx` | Hook + modal + section Daily Brief |
| `src/config/featureFlags.ts` | `isDailyBriefEnabled()` |
| `.env.example` | `VITE_DAILY_BRIEF=false` |
| `src/styles/sprint50.css` | Styles modal / section / cartes |
| `package.json` | `verify:dailybrief` |

**Non modifiés :** contrats, migrations Supabase, P1, P2, moteurs core.

---

## 9. Tests

| Suite | Tests | Couverture |
|-------|:-----:|------------|
| `buildDailyBrief.test.ts` | 21 | Parcours complet + frontières |

Scénarios :
- Première vs deuxième ouverture (localStorage)
- 0 / 1 / 3 recommandations
- Ordre par priorité
- RecommendationEngine + DecisionEngine + ReasoningEngine sollicités
- UI sans logique métier
- Flag OFF par défaut
- Non-régression P1/P2 (fichiers intacts)
- Absence nouveaux événements outcome

Commande : `npm run verify:dailybrief`

---

## 10. Protocole validation manuelle

**Prérequis :** `VITE_DAILY_BRIEF=true`, planning généré pour aujourd'hui.

| Cas | Setup | Résultat attendu |
|-----|-------|------------------|
| **A — journée vide** | Pas de planning généré | Synthèse « à composer », 0 carte |
| **B — journée chargée** | Nombreux blocs / tâches | Synthèse « chargée », carte Temps possible |
| **C — créneau libre** | free_slot ≥ 15 min + études actives | Carte Études + bouton Voir |
| **D — plusieurs reco** | Études + sport + après-midi dense | Max 3 cartes, études en premier |
| **E — réouverture** | Fermer modal, recharger page | Modal absent, section Accueil visible |

**Résultats manuels :** non exécutés (en attente validation humaine).

**Captures :** non produites dans ce sprint (environnement headless).

---

## 11. Résultats des commandes

| Commande | Résultat |
|----------|:--------:|
| `npm run build` | ✅ |
| `npm run lint` | ✅ (warnings préexistants) |
| `npm test` | ✅ **977** tests (+21) |
| `npm run verify:contracts` | ✅ |
| `npm run verify:p1` | ✅ 5 tests |
| `npm run verify:p2` | ✅ 24 tests |
| `npm run verify:dailybrief` | ✅ 21 tests |

---

## 12. Dette technique

| Dette | Impact |
|-------|--------|
| Modal déclenché sur Accueil (route par défaut), pas sur toutes les routes | Faible — documenté |
| Pas d'événements outcome Daily Brief (contrat absent) | Attendu — spec respectée |
| Cartes sport/temps sans ReasoningEngine complet | Faible — messages déterministes suffisants MVP |
| Pas de widget Accueil configurable (section fixe) | Faible |

| Dette évitée | |
|--------------|--|
| Nouveau moteur #21 | ✅ |
| Nouveau contrat / migration | ✅ |
| Appels LLM | ✅ |
| Apprentissage Universal / HumanModel | ✅ |

---

## 13. Améliorations futures

1. Étendre le modal à `AuthenticatedAppLayout` pour couvrir toute première ouverture app.
2. Ajouter `dailybrief.*` au contrat outcome si le produit valide la traçabilité.
3. Enrichir catégories (spiritual, famille) via mêmes pipelines P1-like.
4. Tests e2e Playwright cas A–E.
5. Widget Accueil optionnel dans `homePreferences`.

---

## 14. Verdict Architecture Guardian

| Critère | Statut |
|---------|:------:|
| Aucun nouveau moteur | ✅ |
| Aucun nouveau contrat | ✅ |
| ADR-0006 — UI sans décision métier | ✅ |
| Réutilisation moteurs existants | ✅ |
| Non-régression P1/P2 | ✅ |
| Fail-open (brief null si contexte absent) | ✅ |
| Feature flag OFF par défaut | ✅ |
| Pas de LLM | ✅ |
| Max 3 recommandations | ✅ |

### Verdict : **APPROVED**

Recommandation mineure : valider manuellement le ton des synthèses sur journées réelles avant activation progressive du flag.

---

*Aucun commit, merge ou déploiement effectué — en attente validation humaine.*
