/**
 * Script de vérification de la connexion Supabase (infrastructure uniquement).
 * Usage : node scripts/verify-supabase.mjs
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), '.env.local')
  const content = readFileSync(envPath, 'utf8')
  const vars = {}

  for (const line of content.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const [key, ...rest] = trimmed.split('=')
    vars[key] = rest.join('=')
  }

  return vars
}

const env = loadEnvLocal()
const url = env.VITE_SUPABASE_URL
const key = env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  console.error('❌ Variables VITE_SUPABASE_URL ou VITE_SUPABASE_PUBLISHABLE_KEY manquantes.')
  process.exit(1)
}

const supabase = createClient(url, key)
const { data, error } = await supabase.auth.getSession()

if (error) {
  console.error('❌ Erreur Supabase:', error.message)
  process.exit(1)
}

console.log('✅ Connexion Supabase OK')
console.log(`   URL     : ${url}`)
console.log(`   Session : ${data.session ? 'active' : 'aucune (normal au démarrage)'}`)
