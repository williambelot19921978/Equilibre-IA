# Règles permanentes de développement

> **Version :** 1.0.0  
> **Date :** 15 juillet 2026  
> **Applicabilité :** tous les sprints futurs — humains et assistants IA

Ce document complète `Docs/AI_RULEBOOK.md` (comportement IA) et `Docs/PROJECT_BIBLE.md` (vision produit).

---

## 1. Serveur Vite

Le serveur de développement utilise **exclusivement** :

```
http://localhost:5173
```

Configuration obligatoire dans `vite.config.ts` :

```typescript
server: {
  port: 5173,
  strictPort: true,
}
```

**Interdit :** basculer automatiquement vers 5174, 5175, 5176…

**Si le port est occupé :**

1. Identifier le processus (`netstat -ano | findstr :5173` sous Windows)
2. Arrêter l'ancienne instance Vite
3. Relancer `npm run dev`

Le script `npm run predev` (`scripts/ensure-vite-port.mjs`) s'exécute automatiquement avant `npm run dev` pour libérer le port et arrêter les processus Node/Vite résiduels.

---

## 2. Une seule instance Vite

Ne jamais laisser plusieurs serveurs Vite tourner en parallèle.

Avant chaque `npm run dev` :

- vérifier les processus Vite / port 5173
- arrêter les anciennes instances
- démarrer **une seule** instance

---

## 3. Pas de modification silencieuse

Ne jamais modifier sans **annoncer explicitement** à l'utilisateur :

| Domaine | Exemples |
|---------|----------|
| Routes | ajout/suppression de paths React Router |
| Ports | Vite, Supabase local, preview |
| Variables d'environnement | `.env`, clés API |
| Supabase | migrations, RLS, Edge Functions |
| Netlify | redirects, build, env |
| Structure | déplacement de dossiers, renommages majeurs |

---

## 4. Pas de régression

Toute modification doit préserver les fonctionnalités existantes.

**Quality gate obligatoire en fin de sprint :**

```bash
npm run build
npm run lint
npm test
npm run verify:schema
npm run verify:supabase
```

---

## 5. Ne pas casser l'UX

Une nouvelle fonctionnalité ne doit **jamais** faire disparaître une ancienne.

| Élément | Exigence |
|---------|----------|
| Menu principal | Toujours visible (sidebar desktop / bottom nav mobile) |
| Conversation IA | Toujours visible sur les routes applicatives |
| Planning | Fonctionnel |
| Calendrier | Fonctionnel |

---

## 6. Ne pas dupliquer

- Réutiliser les composants existants (`src/components/ui/`, design system)
- Créer un nouveau composant **uniquement** si nécessaire
- Éviter les styles isolés par page — passer par les tokens CSS

---

## 7. Architecture

Privilégier :

```
Pages (composition)
  → Composants réutilisables
  → Hooks dédiés
  → Services (Supabase, API)
  → Moteurs IA (ai/)
```

Éviter la logique métier directement dans les pages.

---

## 8. Journal des modifications (fin de sprint)

Chaque sprint se conclut par un rapport `Docs/SPRINT_X_X_REPORT.md` contenant :

1. **Ce qui a été modifié**
2. **Pourquoi**
3. **Fichiers impactés**
4. **Migrations éventuelles** (Supabase)
5. **Points à tester manuellement**
6. **Limites connues**

---

## 9. Priorité

Ordre de décision :

1. **Stabilité**
2. **Fluidité**
3. **Expérience utilisateur**
4. **Nouvelles fonctionnalités**

> Une fonctionnalité incomplète mais stable est préférable à une fonctionnalité ambitieuse mais instable.

---

## Fichiers de référence

| Fichier | Rôle |
|---------|------|
| `vite.config.ts` | Port 5173, strictPort |
| `scripts/ensure-vite-port.mjs` | Libération port avant dev |
| `.cursor/rules/development-standards.mdc` | Règle Cursor (alwaysApply) |
| `Docs/AI_RULEBOOK.md` | Comportement IA |
| `Docs/PROJECT_BIBLE.md` | Vision et architecture produit |

---

*Equilibre IA — Règles de développement permanentes*
