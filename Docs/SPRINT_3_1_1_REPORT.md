# Sprint 3.1.1 — Shell global et conversation visible

> **Date :** 15 juillet 2026  
> **Statut :** ✅ Correctif structurel livré  
> **Objectif :** shell unique + barre conversation visible sur toutes les routes applicatives

---

## 1. Causes exactes des bugs observés

### Barre conversation absente

**Le composant était monté** dans `AppProviders`, mais **retournait `null`** dans la majorité des cas :

1. **Condition trop stricte (Sprint 3.1)** — `canShowConversationBar(progress)` exigeait `onboarding_completed`, `discoveryComplete`, `hasBaseProfile`, etc. Alors que la navigation autorise déjà `/home` sans ce flag.
2. **Mauvais emplacement** — barre en dehors du layout applicatif, sans lien avec la route courante.
3. **Silence total** — `return null` sans feedback visuel en cas de blocage.

**Ce n'était pas un problème CSS** : les styles `.floating-conversation` étaient présents (`position: fixed`, `z-index`, ombre). Rien ne masquait la barre — elle n'était simplement pas rendue.

### Menu ☰ absent sur Mon quotidien (et autres)

**Architecture fragmentée** : chaque page gérait son propre shell.

| Page | AppShell / menu ☰ |
|------|-------------------|
| HomePage, Planning, Calendar, Profile, Spiritual | ✅ AppShell local |
| **DailyRoutinePage**, **FamilyContextPage**, **TasksPage** | ❌ **Aucun AppShell** |

→ Le menu disparaissait dès qu'on quittait une page « équipée ».

---

## 2. Architecture finale

```
AppProviders (Auth + UserProgress)
└── AppRouter
    ├── Routes publiques (/login, /signup)
    ├── Routes onboarding (/onboarding/*, /discovery)
    └── ProtectedRoute
        └── AuthenticatedAppLayout  ← NOUVEAU
            ├── AppShell (header + ☰ + AppDrawer)
            ├── Outlet (contenu page)
            └── FloatingConversationBar
                └── ConversationProvider
```

**Fichiers clés :**

- `src/app/layouts/AuthenticatedAppLayout.tsx`
- `src/app/router/AppRouter.tsx` (routes imbriquées)
- `src/lib/navigation/conversationAccess.ts` → `shouldShowConversationBar()`
- `src/lib/navigation/routes.ts` → `APPLICATION_ROUTES`, `ONBOARDING_ROUTES`

---

## 3. Règle d'affichage barre conversation

```typescript
shouldShowConversationBar({ isAuthenticated, pathname, progressLoading })
```

| Contexte | Barre |
|----------|-------|
| Non connecté | Masquée |
| `/login`, `/signup` | Masquée |
| `/onboarding/*`, `/discovery` | Masquée |
| Routes applicatives (`/home`, `/planning`, …) | **Visible** |
| `progressLoading` sur route app | Visible (état loading) |

**Plus de dépendance** à `onboarding_completed` / `discoveryComplete` / `hasBaseProfile`.

---

## 4. États visuels barre

| État | Comportement |
|------|--------------|
| `loading` | Placeholder « Chargement de l'assistant… » |
| `ready` | Champ actif + envoi NLP |
| `error` | Message « Assistant indisponible — réessayer » |
| `disabled` | Barre visible mais champ désactivé |

**Dev only** : log `[ConversationBar debug]` + bandeau debug (≥900px).

---

## 5. Pages refactorisées

AppShell **retiré** de :

- HomePage, PlanningPage, CalendarPage, ProfilePage, SpiritualSpacePage

Toutes les routes applicatives passent par `AuthenticatedAppLayout` — **DailyRoutinePage** et **FamilyContextPage** héritent automatiquement du menu et de la barre.

---

## 6. Tests automatisés

**288 tests** passent, dont **17 nouveaux** (`sprint311.test.ts`) couvrant A–Q du cahier des charges.

---

## 7. Tests navigateur réels

| Étape | Statut |
|-------|--------|
| Build + preview local | ✅ Exécuté |
| Parcours authentifié /home → /daily-routine → F5 | ⚠️ **Non automatisé** — nécessite session Supabase (pas de credentials `VERIFY_TEST_*` configurés dans cet environnement) |
| Saisie « Je suis fatigué » + réponse | ⚠️ Idem — requiert connexion manuelle |

**Pour valider en local :**

1. `npm run dev`
2. Se connecter
3. Vérifier menu + barre sur `/home`, `/daily-routine`, `/profile`, `/spiritual`
4. F5 sur chaque page
5. Écrire « Je suis fatigué aujourd'hui » → réponse attendue dans le panneau

---

## 8. Quality gate

| Commande | Résultat |
|----------|----------|
| `npm run test` | ✅ 288 |
| `npm run build` | ✅ |
| `npm run lint` | ✅ |
| `npm run verify:schema` | ✅ |
| `npm run verify:supabase` | ✅ |
| `npm run preview` | ✅ |

---

## 9. Limites restantes

- Tests navigateur authentifiés à exécuter manuellement ou via Playwright + credentials
- `NotFoundPage` (`*`) hors layout applicatif — pas de menu/barre (comportement voulu)
- Bandeau debug visible uniquement en dev et grands écrans

---

## 10. Critères de fin

- [x] Layout global unique (`AuthenticatedAppLayout`)
- [x] Menu ☰ sur toutes les routes applicatives
- [x] Barre conversation visible par route (plus par flags profil)
- [x] Jamais de `null` silencieux sur route applicative
- [x] Routes imbriquées React Router
- [x] Tests automatisés A–Q
- [ ] Validation navigateur authentifiée (manuelle)
