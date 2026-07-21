/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string
  readonly VITE_GOOGLE_CALENDAR_ENABLED?: string
  /** URL publique de l'app (ex. https://equilibre-ia.netlify.app) — requis en prod Netlify pour les e-mails Auth. */
  readonly VITE_APP_ORIGIN?: string
  /** EPIC 8B — e-mails admin autorisés (séparés par virgule) pour Aura Insights. */
  readonly VITE_AURA_ADMIN_EMAILS?: string
  readonly VITE_AURA_INSIGHTS?: string
  readonly VITE_AURA_INSIGHTS_SALT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
