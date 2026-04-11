-- ─── Session 21: Public Prediction Profiles ──────────────────────────────────
-- Creates user_profiles, user_predictions, profile_followers tables.
-- Idempotent: YES (CREATE TABLE IF NOT EXISTS, DROP POLICY IF EXISTS)

-- ─── user_profiles ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username      TEXT NOT NULL UNIQUE,
  display_name  TEXT,
  bio           TEXT,
  twitter_handle TEXT,
  website_url   TEXT,
  avatar_url    TEXT,
  is_public     BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id  ON public.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles(username);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_public_read"   ON public.user_profiles;
DROP POLICY IF EXISTS "profiles_owner_write"   ON public.user_profiles;
DROP POLICY IF EXISTS "profiles_service_all"   ON public.user_profiles;

CREATE POLICY "profiles_public_read"  ON public.user_profiles FOR SELECT USING (is_public = true);
CREATE POLICY "profiles_owner_write"  ON public.user_profiles FOR ALL   USING (auth.uid() = user_id);
CREATE POLICY "profiles_service_all"  ON public.user_profiles FOR ALL   USING (auth.role() = 'service_role');

-- auto-update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER trg_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── user_predictions ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_predictions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id      UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  market_id       TEXT NOT NULL,
  market_question TEXT NOT NULL,
  outcome         TEXT NOT NULL,           -- "YES" | "NO" | outcome label
  predicted_prob  INT  NOT NULL CHECK (predicted_prob BETWEEN 1 AND 99),  -- 1-99
  conviction      TEXT NOT NULL DEFAULT 'medium' CHECK (conviction IN ('low','medium','high')),
  reasoning       TEXT,
  is_resolved     BOOLEAN NOT NULL DEFAULT false,
  resolved_at     TIMESTAMPTZ,
  resolution      TEXT,                    -- "correct" | "incorrect" | null
  brier_score     NUMERIC(8,6),            -- (predicted_prob/100 - outcome_binary)^2
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_predictions_user_id    ON public.user_predictions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_predictions_profile_id ON public.user_predictions(profile_id);
CREATE INDEX IF NOT EXISTS idx_user_predictions_market_id  ON public.user_predictions(market_id);
CREATE INDEX IF NOT EXISTS idx_user_predictions_created_at ON public.user_predictions(created_at DESC);

ALTER TABLE public.user_predictions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "predictions_public_read"  ON public.user_predictions;
DROP POLICY IF EXISTS "predictions_owner_write"  ON public.user_predictions;
DROP POLICY IF EXISTS "predictions_service_all"  ON public.user_predictions;

CREATE POLICY "predictions_public_read" ON public.user_predictions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.user_profiles p
    WHERE p.id = profile_id AND p.is_public = true
  ));
CREATE POLICY "predictions_owner_write" ON public.user_predictions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "predictions_service_all" ON public.user_predictions FOR ALL USING (auth.role() = 'service_role');

DROP TRIGGER IF EXISTS trg_user_predictions_updated_at ON public.user_predictions;
CREATE TRIGGER trg_user_predictions_updated_at
  BEFORE UPDATE ON public.user_predictions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ─── profile_followers ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.profile_followers (
  follower_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  followed_profile_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_user_id, followed_profile_id)
);

CREATE INDEX IF NOT EXISTS idx_profile_followers_followed ON public.profile_followers(followed_profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_followers_follower ON public.profile_followers(follower_user_id);

ALTER TABLE public.profile_followers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "followers_public_read"   ON public.profile_followers;
DROP POLICY IF EXISTS "followers_owner_write"   ON public.profile_followers;

CREATE POLICY "followers_public_read"  ON public.profile_followers FOR SELECT USING (true);
CREATE POLICY "followers_owner_write"  ON public.profile_followers FOR ALL   USING (auth.uid() = follower_user_id);

NOTIFY pgrst, 'reload schema';
