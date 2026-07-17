# Déploiement Netlify — Équilibre IA

Guide pas à pas pour publier la version **0.1.0-beta** sur Netlify avec Supabase.

---

## 1. Prérequis

- Compte [Netlify](https://www.netlify.com/)
- Projet Supabase configuré (migrations appliquées)
- Dépôt Git avec le code à jour **ou** dossier `dist` buildé localement
- Fichier `netlify.toml` présent à la racine (déjà inclus)

---

## 2. Build local (vérification)

Avant tout déploiement :

```bash
npm install
npm run build
npm run preview
```

Ouvrir l’URL affichée (souvent `http://localhost:4173`) et tester :

- connexion ;
- F5 sur `/home`, `/planning`, `/calendar` ;
- profil, tâches, calendrier, planning.

---

## 3. Créer ou sélectionner un site Netlify

### Option A — Depuis Git (recommandé)

1. Netlify → **Add new site** → **Import an existing project**
2. Connecter GitHub / GitLab / Bitbucket
3. Sélectionner le dépôt `equilibre-ia-v2`
4. Netlify détecte `netlify.toml` automatiquement

### Option B — Déploiement manuel du dossier `dist`

1. `npm run build`
2. Netlify → **Add new site** → **Deploy manually**
3. Glisser-déposer le dossier `dist`

---

## 4. Configuration build (si non lue depuis netlify.toml)

| Paramètre | Valeur |
|-----------|--------|
| Build command | `npm run build` |
| Publish directory | `dist` |
| Node version | 20 ou 22 (via variable `NODE_VERSION` si besoin) |

Le fichier `netlify.toml` contient déjà :

```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

Cela garantit que **toutes les routes React survivent au F5**.

---

## 5. Variables d’environnement Netlify

**Site settings → Environment variables → Add a variable**

| Variable | Valeur | Obligatoire |
|----------|--------|-------------|
| `VITE_SUPABASE_URL` | `https://<PROJECT_REF>.supabase.co` | ✅ |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Clé **anon / publishable** Supabase | ✅ |
| `VITE_GOOGLE_CALENDAR_ENABLED` | `false` | ✅ (V1 bêta) |

Copier les noms depuis `.env.example` — **jamais** de vraies clés dans Git.

> Les variables `VITE_*` sont injectées **au moment du build**. Après modification, relancer un déploiement.

---

## 6. Déployer

1. **Deploy site** (Git) ou upload `dist` (manuel)
2. Attendre la fin du build (logs Netlify)
3. Récupérer l’URL : `https://<nom-du-site>.netlify.app`

---

## 7. Configurer Supabase Auth

Dans **Supabase Dashboard → Authentication → URL Configuration** :

### Site URL

```
https://<nom-du-site>.netlify.app
```

### Redirect URLs (ajouter toutes les URLs utilisées)

```
http://localhost:5173/**
http://localhost:4173/**
https://<nom-du-site>.netlify.app/**
```

Pour la **réinitialisation de mot de passe**, ajouter aussi les URLs exactes :

```
http://localhost:5173/reset-password
http://localhost:4173/reset-password
https://<nom-du-site>.netlify.app/reset-password
```

Conserver **localhost** pour le développement local.

### Email templates

Aucun changement obligatoire pour la bêta. Vérifier que les liens de confirmation pointent vers le bon domaine si personnalisés.

---

## 8. Test après déploiement

Checklist sur l’URL Netlify :

- [ ] Inscription / connexion
- [ ] Mot de passe oublié → e-mail → `/reset-password` → nouveau mot de passe
- [ ] F5 sur `/home`, `/planning`, `/calendar`, `/profile`
- [ ] Ajout tâche et rendez-vous
- [ ] Génération planning
- [ ] Vacances et contexte familial
- [ ] Menu mobile ☰
- [ ] Profil → section Google affiche **« Bientôt disponible »** (flag désactivé)
- [ ] Aucune page blanche en cas d’erreur (ErrorBoundary)

---

## 9. Rollback en cas de problème

### Depuis Git

1. Netlify → **Deploys**
2. Sélectionner le dernier déploiement stable
3. **Publish deploy** (rollback)

### Déploiement manuel

1. Rebuild local d’un commit stable : `git checkout <tag>` puis `npm run build`
2. Redéployer le dossier `dist`

---

## 10. Google Calendar (plus tard)

Pour activer Google Calendar en production :

1. Déployer les Edge Functions Supabase (voir `Docs/GOOGLE_CALENDAR_SETUP.md`)
2. Configurer les secrets Google côté Supabase
3. Passer `VITE_GOOGLE_CALENDAR_ENABLED=true` sur Netlify
4. Redéployer le site

---

## 11. Sécurité

- ✅ Clés Supabase **publishable** uniquement côté client
- ✅ `client_secret` Google **uniquement** dans Supabase Edge Functions
- ✅ Headers de sécurité dans `netlify.toml`
- ✅ Cache long sur `/assets/*` (fichiers hashés Vite)

---

## 12. Domaine personnalisé (optionnel)

1. Netlify → **Domain management**
2. Ajouter votre domaine
3. Mettre à jour **Site URL** et **Redirect URLs** dans Supabase Auth
4. Redéployer si variables d’environnement changent
