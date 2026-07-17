# Configuration Google Calendar — Équilibre IA

Guide pas à pas pour connecter Google Calendar en **lecture seule** via OAuth 2.0 et Supabase Edge Functions.

---

## 1. Prérequis

- Projet Supabase avec Edge Functions activées
- Migration `supabase/migrations/00008_google_calendar.sql` appliquée
- Compte Google Cloud avec droits administrateur

---

## 2. Google Cloud — créer le projet

1. Ouvrir [Google Cloud Console](https://console.cloud.google.com/)
2. **Créer un projet** (ex. `equilibre-ia-calendar`)
3. Noter l’ID du projet

---

## 3. Activer l’API Calendar

1. **APIs & Services → Bibliothèque**
2. Rechercher **Google Calendar API**
3. Cliquer **Activer**

---

## 4. Écran de consentement OAuth

1. **APIs & Services → Écran de consentement OAuth**
2. Type : **Externe** (ou Interne si Google Workspace)
3. Renseigner :
   - Nom de l’application : `Équilibre IA`
   - E-mail assistance utilisateur
   - Domaines autorisés (production) : votre domaine Netlify
4. **Scopes** : ajouter manuellement  
   `https://www.googleapis.com/auth/calendar.readonly`
5. Utilisateurs test : ajouter votre compte Google de test

---

## 5. Créer les identifiants OAuth

1. **APIs & Services → Identifiants → Créer des identifiants → ID client OAuth**
2. Type : **Application Web**

### Origines JavaScript autorisées

| Environnement | URL |
|---------------|-----|
| Local Vite | `http://localhost:5173` |
| Local alt. | `http://localhost:5174`, `http://localhost:5175` |
| Production Netlify | `https://votre-app.netlify.app` |

### URI de redirection autorisés

| Environnement | URI |
|---------------|-----|
| Supabase local | `http://127.0.0.1:54321/functions/v1/google-calendar-callback` |
| Supabase prod | `https://<PROJECT_REF>.supabase.co/functions/v1/google-calendar-callback` |

3. Copier **Client ID** et **Client secret** — ne jamais les committer dans Git

---

## 6. Secrets Supabase

Dans **Project Settings → Edge Functions → Secrets** :

```bash
supabase secrets set GOOGLE_CLIENT_ID="..."
supabase secrets set GOOGLE_CLIENT_SECRET="..."
supabase secrets set GOOGLE_REDIRECT_URI="https://<PROJECT_REF>.supabase.co/functions/v1/google-calendar-callback"
supabase secrets set GOOGLE_TOKEN_SECRET="une-cle-secrete-32-caracteres-minimum"
supabase secrets set APP_ORIGIN="http://localhost:5173"
```

Pour la production :

```bash
supabase secrets set APP_ORIGIN="https://votre-app.netlify.app"
```

Variables déjà présentes côté Supabase (automatiques dans Edge Functions) :

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

---

## 7. Déployer les Edge Functions

```bash
supabase functions deploy google-calendar-auth
supabase functions deploy google-calendar-callback
supabase functions deploy google-calendar-sync
supabase functions deploy google-calendar-disconnect
```

---

## 8. Test localhost

1. Appliquer la migration `00008` :  
   `supabase db push` ou SQL Editor
2. Lancer l’app : `npm run dev`
3. Se connecter à Équilibre IA
4. Aller sur **`/profile` → Calendriers connectés**
5. **Connecter Google Calendar**
6. Autoriser l’accès lecture seule
7. Revenir sur l’app (`?google=connected`)
8. Sélectionner un calendrier → **Synchroniser maintenant**
9. Vérifier le calendrier mensuel et le planning journalier

---

## 9. Test production

1. Mettre à jour `APP_ORIGIN` et les URI OAuth Google
2. Redéployer les fonctions
3. Répéter le flux connexion + sync
4. F5 → aucun doublon d’événements

---

## 10. Révocation et suppression

### Côté utilisateur (Équilibre IA)

- **Profil → Déconnecter** : supprime connexion, calendriers sélectionnés et événements importés locaux

### Côté Google

1. [Compte Google → Sécurité → Accès tiers](https://myaccount.google.com/permissions)
2. Retirer l’accès à **Équilibre IA**

---

## 11. Scope minimal

Ce sprint utilise uniquement :

```
https://www.googleapis.com/auth/calendar.readonly
```

Pas d’écriture dans Google Calendar. Une autorisation d’export séparée pourra être ajoutée plus tard.

---

## 12. Dépannage

| Problème | Cause probable | Action |
|----------|----------------|--------|
| `redirect_uri_mismatch` | URI callback incorrect | Vérifier Google Console + `GOOGLE_REDIRECT_URI` |
| Refresh token absent | Reconnexion sans `prompt=consent` | Révoquer accès Google et reconnecter |
| Tables absentes | Migration non appliquée | Exécuter `00008_google_calendar.sql` |
| Sync vide | Aucun calendrier coché | Profil → cocher calendriers → sync |

---

## 13. Sécurité

- `client_secret` **uniquement** dans les secrets Supabase
- Refresh token chiffré AES-GCM (`GOOGLE_TOKEN_SECRET`)
- Access token jamais stocké durablement côté client
- RLS : un utilisateur ne voit que ses connexions ; les événements restent scoped `household_id`
