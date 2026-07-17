-- Sprint 2.5 — Google Calendar OAuth et événements externes

CREATE TABLE IF NOT EXISTS public.google_calendar_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  google_account_email text NOT NULL,
  encrypted_refresh_token text NOT NULL,
  scopes text[] NOT NULL DEFAULT ARRAY[]::text[],
  status text NOT NULL DEFAULT 'connected'
    CHECK (status IN ('connected', 'disconnected', 'error')),
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT google_calendar_connections_user_household UNIQUE (user_id, household_id)
);

CREATE INDEX IF NOT EXISTS idx_google_calendar_connections_household
  ON public.google_calendar_connections (household_id);

CREATE TABLE IF NOT EXISTS public.google_calendars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id uuid NOT NULL REFERENCES public.google_calendar_connections(id) ON DELETE CASCADE,
  google_calendar_id text NOT NULL,
  name text NOT NULL,
  color text,
  selected_for_sync boolean NOT NULL DEFAULT false,
  is_primary boolean NOT NULL DEFAULT false,
  time_zone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT google_calendars_connection_calendar UNIQUE (connection_id, google_calendar_id)
);

CREATE INDEX IF NOT EXISTS idx_google_calendars_connection
  ON public.google_calendars (connection_id, selected_for_sync);

CREATE TABLE IF NOT EXISTS public.external_calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  household_id uuid NOT NULL REFERENCES public.households(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'google'
    CHECK (provider IN ('google')),
  external_calendar_id text NOT NULL,
  external_event_id text NOT NULL,
  title text NOT NULL,
  description text,
  location text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  all_day boolean NOT NULL DEFAULT false,
  recurrence text,
  status text NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('confirmed', 'cancelled', 'tentative')),
  event_type text NOT NULL DEFAULT 'other'
    CHECK (event_type IN ('appointment', 'birthday', 'work', 'vacation', 'family', 'other')),
  raw_metadata jsonb DEFAULT '{}'::jsonb,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT external_calendar_events_provider_event UNIQUE (provider, external_event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_external_calendar_events_household_dates
  ON public.external_calendar_events (household_id, starts_at, ends_at);

CREATE INDEX IF NOT EXISTS idx_external_calendar_events_user
  ON public.external_calendar_events (user_id, status);

ALTER TABLE public.google_calendar_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "google_connections_select_own_household"
  ON public.google_calendar_connections FOR SELECT
  USING (
    user_id = auth.uid()
    AND household_id IN (
      SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "google_connections_insert_own"
  ON public.google_calendar_connections FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND household_id IN (
      SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "google_connections_update_own"
  ON public.google_calendar_connections FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "google_connections_delete_own"
  ON public.google_calendar_connections FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "google_calendars_select_via_connection"
  ON public.google_calendars FOR SELECT
  USING (
    connection_id IN (
      SELECT id FROM public.google_calendar_connections
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "google_calendars_insert_via_connection"
  ON public.google_calendars FOR INSERT
  WITH CHECK (
    connection_id IN (
      SELECT id FROM public.google_calendar_connections
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "google_calendars_update_via_connection"
  ON public.google_calendars FOR UPDATE
  USING (
    connection_id IN (
      SELECT id FROM public.google_calendar_connections
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "google_calendars_delete_via_connection"
  ON public.google_calendars FOR DELETE
  USING (
    connection_id IN (
      SELECT id FROM public.google_calendar_connections
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "external_events_select_household"
  ON public.external_calendar_events FOR SELECT
  USING (
    household_id IN (
      SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "external_events_insert_own"
  ON public.external_calendar_events FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND household_id IN (
      SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "external_events_update_own"
  ON public.external_calendar_events FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "external_events_delete_own"
  ON public.external_calendar_events FOR DELETE
  USING (user_id = auth.uid());

COMMENT ON TABLE public.google_calendar_connections IS
  'Connexion OAuth Google Calendar par utilisateur et foyer';
COMMENT ON TABLE public.google_calendars IS
  'Calendriers Google disponibles et sélectionnés pour la synchronisation';
COMMENT ON TABLE public.external_calendar_events IS
  'Événements importés en lecture seule depuis Google Calendar';
