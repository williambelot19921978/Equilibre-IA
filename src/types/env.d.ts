/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_PUBLISHABLE_KEY: string
  readonly VITE_GOOGLE_CALENDAR_ENABLED?: string
  /** URL publique de l'app (ex. https://equilibre-ia.netlify.app) — requis en prod Netlify pour les e-mails Auth. */
  readonly VITE_APP_ORIGIN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
