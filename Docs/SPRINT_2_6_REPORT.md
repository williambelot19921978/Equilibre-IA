# Sprint 2.6 — Préparation V1 Netlify

> **Date :** 14 juillet 2026  
> **Statut :** ✅ Code livré — prêt pour déploiement Netlify  
> **Objectif :** version stable déployable en ligne, Google Calendar désactivé proprement

---

## 1. Résumé

| Capacité | Livraison |
|----------|-----------|
| Feature flag Google Calendar | ✅ `VITE_GOOGLE_CALENDAR_ENABLED=false` |
| UI « Bientôt disponible » | ✅ Profil, sans requête OAuth/sync |
| `netlify.toml` | ✅ build, SPA redirect, headers, cache assets |
| `.env.example` | ✅ variables documentées |
| ErrorBoundary global | ✅ message + Revenir à l’accueil + Réessayer |
| Page 404 | ✅ `NotFoundPage` (plus de redirect forcé vers login) |
| Version bêta | ✅ `0.1.0-beta` + `BetaBadge` accueil + menu |
| Guide déploiement | ✅ `Docs/NETLIFY_DEPLOYMENT.md` |

---

## 2. Google Calendar désactivé

**Variable :** `VITE_GOOGLE_CALENDAR_ENABLED=false` (défaut)

Quand désactivé :

- Aucun appel Edge Function OAuth/sync
- `loadExternalEventsFor*` retourne `[]`
- Filtre « Google » masqué dans le calendrier
- Profil affiche « Google Calendar — bientôt disponible »
- Aucune erreur si tables Google vides ou fonctions non déployées

Activation future : passer la variable à `true` + configurer OAuth (Sprint 2.5 doc).

---

## 3. Déploiement Netlify

Fichier `netlify.toml` :

- `npm run build` → `dist`
- Redirection SPA `/* → /index.html 200`
- Headers sécurité (X-Frame-Options, nosniff, Referrer-Policy)
- Cache immutable sur `/assets/*`

Guide complet : **`Docs/NETLIFY_DEPLOYMENT.md`**

---

## 4. Supabase Auth production

Documenté dans `NETLIFY_DEPLOYMENT.md` :

- Site URL Netlify
- Redirect URLs Netlify + localhost
- Pas de régression dev local

---

## 5. Gestion des erreurs

| Composant | Rôle |
|-----------|------|
| `ErrorBoundary` | Erreurs React inattendues |
| `AppErrorFallback` | UI commune (accueil, réessayer, détail dev only) |
| `NotFoundPage` | Routes inconnues |

---

## 6. Version bêta

- `src/config/appVersion.ts` → `0.1.0-beta`
- `package.json` → `"version": "0.1.0-beta"`
- Badge discret sur accueil et menu ☰

---

## 7. Qualité

| Gate | Résultat |
|------|----------|
| `npm run build` | ✅ |
| `npm run lint` | ✅ |
| `npm test` | ✅ |
| `npm run verify:schema` | ✅ |
| `npm run verify:supabase` | ✅ |
| `npm run preview` | ✅ (à valider manuellement) |

---

## 8. Tests manuels preview

À exécuter sur `npm run preview` :

1. Connexion
2. F5 `/home`, `/planning`, `/calendar`
3. Tâche + RDV + génération planning
4. Modification bloc, vacances, profil
5. Menu mobile
6. Profil → Google « Bientôt disponible »
7. URL invalide → page 404 (pas de page blanche)

---

## 9. Hors périmètre (respecté)

- Google OAuth final
- IA conversationnelle
- Notifications push
- Mode couple complet
- Données de démo automatiques

---

## 10. Prochaine étape

Déployer sur Netlify en suivant `NETLIFY_DEPLOYMENT.md`, configurer Supabase Auth avec l’URL Netlify, tester la checklist post-déploiement.
