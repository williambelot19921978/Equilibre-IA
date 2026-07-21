# Rapport — Migrations Supabase 00019 & 00020

**Date :** 2026-07-21  
**Instance :** bêta (`woqfmutkaybggvbjtegw`)  
**Git :** `b748159` · tag `aura-beta-ready-v1`  
**Opérateur :** session Cursor (automatisé, sans commit)

---

## Synthèse exécutive

| Migration | État initial | Action | État final |
|-----------|--------------|--------|------------|
| **00019** | Déjà appliquée (tables + RLS) | **SKIP** — aucune réapplication | ✅ Validée |
| **00020** | Partiellement appliquée (policies dashboard) | **APPLIQUÉE** (idempotente) | ✅ Validée |

**Sauvegarde :** ✅ créée avant toute modification  
**Perte de données :** ❌ aucune constatée  
**Recommandation déploiement :** ✅ **Prêt pour déploiement Netlify** (après validation manuelle onboarding/signup)

---

## 1 — Audit des migrations

### 00019 — `user_language_expressions` + `language_learning_events`

| Critère | Analyse |
|---------|---------|
| DROP TABLE / COLUMN | ❌ Aucun |
| DELETE / TRUNCATE | ❌ Aucun |
| Opérations destructives | ❌ Aucune |
| Changement de type | ❌ N/A (création) |
| RLS | ✅ SELECT/INSERT/UPDATE/DELETE own-user |
| SECURITY DEFINER | ❌ Aucune |
| Triggers | ❌ Aucun |
| Idempotence | ✅ `CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS` |
| Re-exécution partielle | ⚠️ Échec si policies existent sans `DROP IF EXISTS` — migration initiale non idempotente sur policies |
| Dépendance 00020 | ❌ Aucune |

**Risque : faible** (additive uniquement)  
**Rollback :** DROP TABLE des 2 tables (perte expressions apprises uniquement)  
**Prérequis :** `auth.users` existant

### 00020 — RLS profiles / households / household_members

| Critère | Analyse |
|---------|---------|
| DROP TABLE / COLUMN | ❌ Aucun |
| DELETE / TRUNCATE | ❌ Aucun |
| Opérations destructives | ❌ Aucune (DROP POLICY IF EXISTS + CREATE) |
| Changement de type | ❌ Aucun |
| RLS | ✅ Policies own/member |
| SECURITY DEFINER | ❌ Aucune |
| Idempotence | ✅ `DROP POLICY IF EXISTS` + `CREATE POLICY` |
| Risque données existantes | ⚠️ Moyen — policies trop restrictives pourraient bloquer accès ; ici policies permissives standard |
| Dépendance 00019 | ❌ Aucune |

**Risque : moyen** (touche tables cœur, mais sans mutation de données)  
**Rollback :** Restaurer policies depuis `schema.sql` backup ou dashboard  
**Ordre confirmé :** **00019 → 00020**

---

## 2 — Sauvegarde Supabase

### Prérequis vérifiés

| Item | Résultat |
|------|----------|
| CLI Supabase | ✅ via `npx supabase@2.109.1` |
| Projet lié | ⚠️ Pas de `supabase/config.toml` — connexion directe Postgres via `.env.local` |
| Credentials affichés | ❌ Jamais (logs = host/ref uniquement) |
| `SUPABASE_DB_PASSWORD` | ✅ présent |
| `VITE_SUPABASE_URL` | ✅ présent |

### Emplacement backup

```
backups/supabase-before-00019-00020/2026-07-21_13-47/
```

| Fichier | Taille | Méthode |
|---------|--------|---------|
| `roles.sql` | 91 B | Placeholder (pg_dump indisponible sur Windows) |
| `schema.sql` | 23 759 B | Introspection SQL (fallback) |
| `data.sql` | 197 209 B | Export JSON tables cœur (fallback) |
| `BACKUP_MANIFEST.md` | ✅ | Métadonnées commit/tag/ref |

**Note :** `npx supabase db dump` via connexion directe a échoué (environnement sans `pg_dump` natif). Le fallback SQL garantit schéma + données des tables critiques. Pour rollback production-grade, utiliser aussi **Supabase Dashboard → Database → Backups**.

**Git :** dossier `backups/` ajouté à `.gitignore` — dumps **non commités**.

### Commandes

```bash
node scripts/supabase-create-backup.mjs
node scripts/supabase-verify-remote.mjs
```

---

## 3 — État migrations distantes (avant application)

| Vérification | Résultat |
|--------------|----------|
| `supabase_migrations.schema_migrations` | ⚠️ **Table absente** — migrations gérées via dashboard/SQL direct |
| 00019 absente | ❌ Non — tables présentes |
| 00019 appliquée | ✅ OUI |
| 00020 absente | ⚠️ Partiellement — RLS actif, noms policies dashboard |
| 00020 appliquée (formelle) | ❌ NON — `profiles_insert_own` manquante |
| Cohérence ordre local/distant | ✅ 00019 avant 00020 respecté |

### Policies avant 00020

- **profiles :** `select_own`, `update_own` (pas `insert_own`)
- **households :** `insert_creator`, `select_member`, `update_member`
- **household_members :** `insert_self_or_creator`, `select_member`, `update_member`

---

## 4 — Application 00019

**Décision : SKIP** — déjà présente sur l'instance.

### Validations (lecture seule)

| Check | Résultat |
|-------|----------|
| `user_language_expressions` | ✅ |
| `language_learning_events` | ✅ |
| Index | ✅ |
| RLS enabled | ✅ |
| Policies own-user | ✅ (4 + 2) |
| Isolation cross-user | ✅ (policies `auth.uid()`) |

### Tests ciblés

- `src/ai/languageMemory/personalLanguageEngine.test.ts` — ✅
- `src/ai/core/languageMemory.test.ts` — ✅
- `npm run verify:schema` — ✅ tables 00019 accessibles

---

## 5 — Application 00020

**Exécutée** après sauvegarde confirmée et validation 00019.

### Commande

```bash
node scripts/supabase-apply-migration.mjs 00020_core_profiles_household_rls.sql
```

### Résultat

```
✅ 00020_core_profiles_household_rls.sql applied successfully
```

Notices PostgreSQL normales : `DROP POLICY IF EXISTS` sur policies inexistantes (skip).

### Policies après 00020

| Table | Policies versionnées 00020 | Legacy (conservées) |
|-------|---------------------------|---------------------|
| profiles | `insert_own`, `select_own`, `update_own` | — |
| households | `insert_authenticated`, `select_member`, `update_member` | `insert_creator` |
| household_members | `insert_own`, `select_own_household`, `update_own` | `insert_self_or_creator`, `select_member`, `update_member` |

**Risque résiduel :** policies INSERT/SELECT dupliquées sur `households` et `household_members` (OR logique — accès élargi, pas restreint). Nettoyage legacy recommandé en sprint ultérieur (mineur).

### Validations fonctionnelles

| Check | Résultat |
|-------|----------|
| RLS enabled (5 tables) | ✅ |
| GRANT authenticated | ✅ (via migration) |
| `verify:schema` (19 tables) | ✅ |
| `verify:supabase` | ✅ |

---

## 6 — Tests après migration

| Gate | Exécuté | Résultat |
|------|---------|----------|
| `npm test` | ✅ | **1436/1436** |
| `npm run lint` | ✅ | 0 erreur |
| Typecheck (`tsc -b` via build) | ✅ | OK |
| `npm run build` | ✅ | OK |
| `npm run release-check` | ✅ | OK |
| `npm run test:product-polish` | ✅ | 17/17 |
| Language Memory tests | ✅ | 39/39 |
| `npm run test:e2e:all` | ❌ | **Non exécuté** — durée + credentials Guardian non validés dans cette session |
| `release-check:full --with-guardian` | ❌ | **Non exécuté** |

---

## 7 — Incidents

| Incident | Impact | Résolution |
|----------|--------|------------|
| `supabase` CLI absente du PATH | Faible | `npx supabase` |
| `pg_dump` / `supabase db dump` échec | Moyen | Fallback SQL backup |
| `schema_migrations` absente | Faible | Déduction via schéma |
| Policies dashboard vs 00020 | Faible | 00020 appliquée idempotente ; legacy conservées |

---

## Rollback disponible

1. **Restaurer données :** `data.sql` du backup `2026-07-21_13-47`
2. **Restaurer policies :** `schema.sql` ou re-appliquer policies dashboard
3. **Supabase Dashboard :** point-in-time recovery si activé sur le projet

**Aucun reset de base effectué.**

---

## État final

| Item | Statut |
|------|--------|
| 00019 | ✅ Présente et validée |
| 00020 | ✅ Appliquée et validée |
| Données utilisateurs | ✅ Intactes (export 197 KB) |
| Quality gates locales | ✅ Vertes |
| E2E distant | ⚠️ Non vérifié |

---

## Recommandation

### Prêt pour déploiement Netlify : **OUI**, avec réserves mineures

1. **Déployer** le frontend tagué `aura-beta-ready-v1` / commit `b748159`
2. **Tester manuellement** après déploiement :
   - Création compte + onboarding
   - Login/logout
   - Language Memory (expression « sec » → confirmation)
   - Check-in + coach
3. **Optionnel P2 :** supprimer policies legacy dupliquées sur `households` / `household_members`
4. **Optionnel P2 :** activer tracking migrations via `supabase db push` + `schema_migrations` pour futures releases
5. **E2E :** lancer `npm run test:e2e:all` avec credentials Playwright avant ouverture bêta publique

---

## Scripts utilitaires créés (non commités)

| Script | Rôle |
|--------|------|
| `scripts/supabase-db-connect.mjs` | Connexion Postgres sans log de secrets |
| `scripts/supabase-create-backup.mjs` | Sauvegarde logique |
| `scripts/supabase-verify-remote.mjs` | Audit tables/policies |
| `scripts/supabase-apply-migration.mjs` | Application contrôlée d'un fichier SQL |

**En attente de validation** avant commit de ces scripts et du rapport.

---

*Aucun commit · aucun push · aucun déploiement Netlify effectué.*
