# Sprint 2.8 — Espace spirituel personnel

> **Date :** 15 juillet 2026  
> **Statut :** ✅ Code livré — migration `00009` à appliquer sur Supabase  
> **Objectif :** page dédiée `/spiritual`, contenus locaux validés, ajout au planning, favoris

---

## 1. Résumé

| Capacité | Livraison |
|----------|-----------|
| Route `/spiritual` protégée | ✅ `SpiritualSpacePage.tsx` |
| Menu latéral | ✅ `✦ Espace spirituel` → `/spiritual` (plus de redirect `/home`) |
| Bibliothèque locale | ✅ `src/content/spiritualContent.ts` (Louis Segond 1910) |
| Moteur de suggestions | ✅ `spiritualSuggestionEngine.ts` |
| Ajout au planning | ✅ `spiritualPlanningService.ts` + replan |
| Favoris | ✅ migration `00009_spiritual_favorites.sql` |
| Préférences | ✅ `profile_facts` étendus + section page |
| Accueil | ✅ `MotivationCard` compacte conditionnelle |

**189 tests** — build/lint OK. `spiritual_favorites` absent en prod tant que migration non appliquée.

---

## 2. Routage

- `AppRoutes.SPIRITUAL = "/spiritual"`
- Enregistré dans `AppRouter`, `POST_ONBOARDING_ROUTES`
- F5 conserve la page (SPA + route protégée)
- `faith_importance = disabled` : page accessible, contenus neutres, pas de propositions religieuses automatiques ailleurs

---

## 3. Page Espace spirituel

Sections livrées :

| Section | Contenu |
|---------|---------|
| **Aujourd'hui** | Motivation, verset/citation si activé, réflexion, « Afficher une autre proposition » |
| **Prendre un temps pour moi** | Chips + suggestions moteur (respiration, silence, gratitude, etc.) |
| **Me recentrer** | Guides texte (2–15 min), pas de voix artificielle |
| **Prier** | 11 catégories, favoris, ajout journée |
| **Mes préférences** | `faith_importance`, durée, moment, carte accueil |
| **Mes favoris** | Table `spiritual_favorites` |
| **Historique récent** | `localStorage` — anti-répétition |

---

## 4. Contenu local

Fichier : `src/content/spiritualContent.ts`

- Types : verset, motivation, prière, réflexion, gratitude, encouragement, invitation calme
- Champs : id, type, title, text, reference, tags, contexts, durationMinutes, faithLevel, source
- Versets : **Louis Segond 1910** — références exactes documentées
- **Aucune citation inventée**

Compatibilité : `spiritualContentLibrary.ts` réexporte l'ancienne API.

---

## 5. Moteur de suggestions

`src/ai/spiritualSuggestionEngine.ts`

Entrées : heure, durée, fatigue, préférences, historique, `faith_importance`, contexte.

Règles :

- Toujours « Ne rien prévoir » en premier
- `disabled` → contenu neutre uniquement
- `discreet` → chrétien surtout le soir
- `important` → propositions quotidiennes facultatives
- Fatigue / parent seul → formats ≤ 10 min
- Soir tardif → silence, prière courte

---

## 6. Ajout au planning

Service : `addSpiritualActivityToPlanning`

- `calendar_item` : `source=user`, `locked=true`, `item_type=event`
- `details` : `spiritualActivityType`, `contentId`, `generatedContent`, `duration`, `sourceReason`
- Options : maintenant, prochain temps libre, heure personnalisée, durée
- `deleteAutoProposalsForDate` + `generateAndSaveDayPlan`

Modal : `AddToDayModal.tsx` (page spirituelle + accueil)

---

## 7. Favoris

Migration : `supabase/migrations/00009_spiritual_favorites.sql`

| Champ | Type |
|-------|------|
| id | uuid |
| user_id | uuid |
| household_id | uuid |
| content_id | text |
| content_type | text |
| custom_text | text nullable |
| created_at | timestamptz |

RLS : SELECT/INSERT/DELETE par `user_id = auth.uid()`

---

## 8. Préférences (`profile_facts`)

Nouvelles clés :

- `spiritual_frequency`
- `spiritual_preferred_duration`
- `spiritual_preferred_moment`
- `spiritual_themes_avoid`
- `spiritual_show_on_home`

Éditables sur `/spiritual` et `/profile`.

---

## 9. Accueil

`MotivationCard` :

- Phrase du jour (neutre si `disabled`)
- « Ouvrir mon espace spirituel » → `/spiritual`
- « Ajouter un temps calme » → modal + planning
- Masquée si `spiritual_show_on_home = no`

---

## 10. Tests automatisés (A–P)

Fichier : `src/lib/spiritual/sprint28.test.ts`

---

## 11. Tests manuels (§14)

**Non exécutés par l'agent** — checklist :

1. Menu → Espace spirituel → `/spiritual`
2. F5
3. Phrase, prière, relaxation 5 min
4. Ajout planning + vérification timeline
5. Favori + préférences + accueil

---

## 12. Quality gate

| Commande | Résultat |
|----------|----------|
| `npm run build` | ✅ |
| `npm run lint` | ✅ |
| `npm test` | ✅ 189 tests |
| `npm run verify:schema` | ⚠️ `spiritual_favorites` absent (migration non déployée) |
| `npm run verify:supabase` | ✅ connexion OK |

**Action prod :** appliquer `00009_spiritual_favorites.sql` sur Supabase.

---

## 13. Fichiers principaux

| Fichier | Rôle |
|---------|------|
| `src/pages/SpiritualSpacePage.tsx` | Page principale |
| `src/content/spiritualContent.ts` | Bibliothèque |
| `src/ai/spiritualSuggestionEngine.ts` | Moteur |
| `src/services/spiritualPlanningService.ts` | Planning |
| `src/services/spiritualService.ts` | Favoris |
| `src/components/spiritual/AddToDayModal.tsx` | Modal ajout |
| `supabase/migrations/00009_spiritual_favorites.sql` | Migration |

---

## 14. Limites restantes

- Migration favoris non déployée sur l'instance Supabase distante
- Pas de lien Spotify dynamique (bouton musique douce = suggestion texte)
- Tests navigateur manuels requis
- Chat IA payant / notifications / mode couple : hors scope
