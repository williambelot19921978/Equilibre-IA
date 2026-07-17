# Sprint 3.1 — Natural Language Engine

> **Date :** 15 juillet 2026  
> **Statut :** ✅ Code livré — aucune nouvelle page  
> **Objectif :** modifier l'application entièrement en langage naturel, sans IA externe

---

## 1. Résumé

| Capacité | Livraison |
|----------|-----------|
| Moteur NLP déterministe | ✅ `src/ai/nlp/` |
| Barre flottante globale | ✅ `FloatingConversationBar.tsx` |
| Interprétation intentions | ✅ 16 intentions |
| Extraction entités | ✅ dates, durées, enfants, lieux… |
| Actions typées | ✅ vacances, travail, sport, prière… |
| Confirmation sécurité | ✅ suppressions + changements durables |
| Proposition mémoire | ✅ rythme récurrent (« tous les mercredis ») |
| Replan Life Engine | ✅ après chaque action |
| Tests | ✅ 60 scénarios (`nlpEngine.test.ts`) |

**269 tests** — build/lint OK. Moteur 100 % déterministe (regex + règles).

---

## 2. Architecture

```
Phrase utilisateur
       │
       ▼
entityExtractor.ts ──► dates, durées, enfants, scope…
       │
       ▼
intentEngine.ts ──► intention + confiance
       │
       ▼
actionResolver.ts ──► Action[] (+ confirmation / mémoire)
       │
       ▼
conversationEngine.ts ──► dialogue, pending, réponses
       │
       ▼
nlpActionService.ts ──► services Supabase + generateAndSaveDayPlan
       │
       ▼
Life Engine recalculé
```

---

## 3. Fichiers créés

| Fichier | Rôle |
|---------|------|
| `src/types/nlp.ts` | Types Intent, Entity, Action, Conversation |
| `src/ai/nlp/entityExtractor.ts` | Extraction entités FR |
| `src/ai/nlp/intentEngine.ts` | Détection intentions |
| `src/ai/nlp/actionResolver.ts` | Résolution → actions + réponses |
| `src/ai/nlp/conversationEngine.ts` | Orchestration dialogue |
| `src/services/nlpActionService.ts` | Exécution + replan |
| `src/contexts/ConversationProvider.tsx` | État conversation global |
| `src/components/conversation/FloatingConversationBar.tsx` | UI flottante |
| `src/ai/nlp/nlpEngine.test.ts` | 60 tests |

---

## 4. Exemples supportés

| Phrase | Résultat |
|--------|----------|
| « Je travaille demain » | Journée travail exceptionnelle + replan |
| « Vacances du 10 au 18 août » | Période `user_vacation` |
| « Peter dort chez mamie vendredi » | Période `child_absent` |
| « Courir 45 minutes demain » | Tâche sport + replan |
| « Je finis une heure plus tard » | Override fin travail ponctuel |
| « Je suis fatigué » | Charge réduite (maxFillRatio 40 %) |
| « Soirée tranquille » | Propositions exigeantes retirées |
| « Prier ce soir » | Bloc spirituel + replan |
| « Lire 30 minutes » | Tâche lecture |
| « Supprime mon sport » | Confirmation → annulation tâches sport |
| « Tous les mercredis en repos » | Proposition modification rythme habituel |

---

## 5. Sécurité & mémoire

- **Confirmation** avant suppressions sport et changements durables (sommeil)
- **Mémoire récurrente** : propose « Veux-tu modifier ton rythme habituel ? » avant `saveDailyRoutine`
- Chaque action porte un `reason` explicatif

---

## 6. Intégration UI

- Monté dans `AppProviders` — visible sur toutes les pages post-onboarding
- Placeholder : « Parlez à Équilibre IA… »
- Panneau extensible avec historique des messages

---

## 7. Quality gate

| Commande | Résultat |
|----------|----------|
| `npm run test` | ✅ 269 tests |
| `npm run build` | ✅ |
| `npm run lint` | ✅ |
| `npm run verify:supabase` | ✅ |

---

## 8. Critères de fin — validés

- [x] Modification par phrase naturelle sans passer par les pages
- [x] Life Engine relancé après chaque action
- [x] Confirmations sur actions importantes
- [x] Aucune IA externe
- [x] Aucune nouvelle page
