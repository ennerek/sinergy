-- =============================================
-- 001_initial.sql — Makers Synergy Charity
-- =============================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================
-- PROFILES
-- =============================================
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name       TEXT,
  company_name    TEXT,
  role_title      TEXT,
  sector          TEXT,
  bio             TEXT,
  avatar_url      TEXT,
  lang            TEXT DEFAULT 'es' CHECK (lang IN ('es','en')),
  deal_ticket_min TEXT DEFAULT '<10k',
  deal_ticket_max TEXT DEFAULT '<10k',
  usual_roles     TEXT[] DEFAULT '{}',
  access_level    SMALLINT DEFAULT 1 CHECK (access_level IN (1,2,3)),
  synergy_interests TEXT[] DEFAULT '{}',
  offerings       TEXT[] DEFAULT '{}',
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_answers   JSONB DEFAULT '{}',
  is_mentor       BOOLEAN DEFAULT false,
  mentor_rating   DECIMAL(3,2),
  mentor_bio      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_own"          ON profiles FOR ALL      USING (auth.uid() = id);
CREATE POLICY "profiles_read_others"  ON profiles FOR SELECT   USING (true);

-- =============================================
-- GROUPS
-- =============================================
CREATE TABLE groups (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug          TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  icon          TEXT NOT NULL,
  description   TEXT,
  color         TEXT DEFAULT '#1A4731',
  tier_required SMALLINT DEFAULT 1,
  member_count  INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO groups (slug, name, icon, description, color, tier_required) VALUES
  ('rotary',        'Rotary Club',               '★', 'Red internacional de empresarios con vocación social', '#B8922E', 1),
  ('smart-meeting', 'Smart Meeting',             '◆', 'Comunidad de fundadores y directivos tech',           '#1A4731', 2),
  ('bni',           'BNI',                       '▲', 'Referral marketing entre empresarios locales',        '#1A4731', 2),
  ('aje',           'AJE / Jóvenes empresarios', '✦', 'Asociación de empresarios menores de 41',            '#C8BBA0', 2),
  ('circulo',       'Círculo Empresarios',       '◇', 'Ex-CEOs, consejeros, operadores senior',              '#C8BBA0', 2),
  ('inner-circle',  'Inner Circle — Global',     '◆', 'Lo mejor de cada grupo · 500 miembros seleccionados', '#3C2F5A', 3);

-- =============================================
-- USER GROUPS
-- =============================================
CREATE TABLE user_groups (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  group_id    UUID REFERENCES groups(id)   ON DELETE CASCADE,
  is_direct   BOOLEAN DEFAULT true,
  via_user_id UUID REFERENCES profiles(id),
  joined_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, group_id)
);

ALTER TABLE user_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_groups_own"  ON user_groups FOR ALL    USING (auth.uid() = user_id);
CREATE POLICY "user_groups_read" ON user_groups FOR SELECT USING (true);

-- =============================================
-- SYNERGIES
-- =============================================
CREATE TABLE synergies (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type         TEXT NOT NULL CHECK (type IN ('busco', 'ofrezco')),
  description  TEXT NOT NULL,
  categories   TEXT[] DEFAULT '{}',
  budget_range TEXT,
  match_count  INT DEFAULT 0,
  is_active    BOOLEAN DEFAULT true,
  expires_at   TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE synergies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "synergies_own"          ON synergies FOR ALL    USING (auth.uid() = user_id);
CREATE POLICY "synergies_read_active"  ON synergies FOR SELECT USING (is_active = true);

-- =============================================
-- MATCHES
-- =============================================
CREATE TABLE matches (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id_a      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user_id_b      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  score          SMALLINT NOT NULL CHECK (score BETWEEN 0 AND 100),
  score_reasons  TEXT[],
  synergy_id_a   UUID REFERENCES synergies(id),
  synergy_id_b   UUID REFERENCES synergies(id),
  requires_level SMALLINT DEFAULT 1,
  status         TEXT DEFAULT 'pending' CHECK (status IN ('pending','proposed','accepted','declined','connected','expired')),
  generated_at   TIMESTAMPTZ DEFAULT NOW(),
  expires_at     TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  UNIQUE(user_id_a, user_id_b)
);

ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "matches_own" ON matches FOR SELECT USING (auth.uid() = user_id_a OR auth.uid() = user_id_b);

-- =============================================
-- CONNECTION REQUESTS
-- =============================================
CREATE TABLE connection_requests (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  to_user_id      UUID REFERENCES profiles(id) ON DELETE CASCADE,
  match_id        UUID REFERENCES matches(id),
  message         TEXT,
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','expired')),
  to_responded_at TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  expires_at      TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

ALTER TABLE connection_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "conn_req_own" ON connection_requests FOR ALL
  USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- =============================================
-- CONNECTIONS
-- =============================================
CREATE TABLE connections (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id_a   UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user_id_b   UUID REFERENCES profiles(id) ON DELETE CASCADE,
  request_id  UUID REFERENCES connection_requests(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id_a, user_id_b)
);

ALTER TABLE connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "connections_own" ON connections FOR SELECT
  USING (auth.uid() = user_id_a OR auth.uid() = user_id_b);

-- =============================================
-- REFLECTIONS
-- =============================================
CREATE TABLE reflections (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES profiles(id) ON DELETE CASCADE,
  content     TEXT NOT NULL CHECK (char_length(content) <= 280),
  reply_count INT DEFAULT 0,
  save_count  INT DEFAULT 0,
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reflections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reflections_all"        ON reflections FOR SELECT USING (is_active = true);
CREATE POLICY "reflections_own"        ON reflections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reflections_own_update" ON reflections FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- REFLECTION REPLIES
-- =============================================
CREATE TABLE reflection_replies (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reflection_id UUID REFERENCES reflections(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES profiles(id)    ON DELETE CASCADE,
  content       TEXT NOT NULL CHECK (char_length(content) <= 280),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE reflection_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "replies_read"   ON reflection_replies FOR SELECT USING (true);
CREATE POLICY "replies_insert" ON reflection_replies FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =============================================
-- REFLECTION SAVES
-- =============================================
CREATE TABLE reflection_saves (
  user_id       UUID REFERENCES profiles(id)    ON DELETE CASCADE,
  reflection_id UUID REFERENCES reflections(id) ON DELETE CASCADE,
  saved_at      TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, reflection_id)
);

ALTER TABLE reflection_saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saves_own" ON reflection_saves FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- NGO PROJECTS
-- =============================================
CREATE TABLE ngo_projects (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title            TEXT NOT NULL,
  subtitle         TEXT,
  location         TEXT,
  description      TEXT,
  target_amount    DECIMAL(10,2) NOT NULL,
  collected_amount DECIMAL(10,2) DEFAULT 0,
  month            DATE NOT NULL,
  is_active        BOOLEAN DEFAULT false,
  image_url        TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE ngo_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ngo_read" ON ngo_projects FOR SELECT USING (true);

INSERT INTO ngo_projects (title, subtitle, location, target_amount, collected_amount, month, is_active)
VALUES ('Escuela rural en Senegal', 'Educación primaria en zona rural', 'Senegal, África',
        6200.00, 4240.00, DATE_TRUNC('month', NOW()), true);

-- =============================================
-- SUBSCRIPTIONS
-- =============================================
CREATE TABLE subscriptions (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id                UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  level                  SMALLINT DEFAULT 1,
  price_monthly          DECIMAL(8,2) DEFAULT 29.00,
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT,
  status                 TEXT DEFAULT 'active' CHECK (status IN ('active','paused','cancelled','trialing')),
  current_period_end     TIMESTAMPTZ,
  ngo_project_id         UUID REFERENCES ngo_projects(id),
  started_at             TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at           TIMESTAMPTZ
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions_own" ON subscriptions FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- NOTIFICATIONS
-- =============================================
CREATE TABLE notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type       TEXT NOT NULL CHECK (type IN (
               'new_match','connection_request','connection_accepted',
               'reflection_reply','mentor_response','system')),
  title      TEXT NOT NULL,
  body       TEXT,
  is_read    BOOLEAN DEFAULT false,
  related_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notif_own" ON notifications FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- SISI MESSAGES
-- =============================================
CREATE TABLE sisi_messages (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE sisi_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sisi_own" ON sisi_messages FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- INVITATIONS
-- =============================================
CREATE TABLE invitations (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invited_by       UUID REFERENCES profiles(id) ON DELETE CASCADE,
  invitee_email    TEXT NOT NULL,
  invitee_name     TEXT,
  invitee_phone    TEXT,
  group_hint       TEXT,
  company_role     TEXT,
  personal_message TEXT,
  token            TEXT UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status           TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','expired')),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  accepted_at      TIMESTAMPTZ,
  expires_at       TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days')
);

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "invitations_own" ON invitations FOR ALL USING (auth.uid() = invited_by);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Auto-create profile on registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, avatar_url, lang)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    COALESCE(NEW.raw_user_meta_data->>'lang', 'es')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Match score calculation
CREATE OR REPLACE FUNCTION calculate_match_score(user_a UUID, user_b UUID)
RETURNS SMALLINT LANGUAGE plpgsql AS $$
DECLARE
  score INT := 0;
  a profiles%ROWTYPE;
  b profiles%ROWTYPE;
  shared_count INT;
BEGIN
  SELECT * INTO a FROM profiles WHERE id = user_a;
  SELECT * INTO b FROM profiles WHERE id = user_b;

  -- Interests vs offerings (40 pts)
  SELECT COUNT(*) INTO shared_count
  FROM unnest(a.synergy_interests) AS ai
  INNER JOIN unnest(b.offerings) AS bo ON ai = bo;
  score := score + LEAST(shared_count * 10, 40);

  -- Shared groups (20 pts)
  SELECT COUNT(*) INTO shared_count
  FROM user_groups uga
  INNER JOIN user_groups ugb ON uga.group_id = ugb.group_id
  WHERE uga.user_id = user_a AND ugb.user_id = user_b;
  score := score + LEAST(shared_count * 10, 20);

  -- Ticket compatibility (20 pts)
  IF a.deal_ticket_min = b.deal_ticket_min OR a.deal_ticket_max = b.deal_ticket_max THEN
    score := score + 20;
  END IF;

  -- Complementary sectors (10 pts)
  IF a.sector IS NOT NULL AND b.sector IS NOT NULL AND a.sector != b.sector THEN
    score := score + 10;
  END IF;

  -- Complementary roles (10 pts)
  IF ('proveedor' = ANY(a.usual_roles) AND 'cliente' = ANY(b.usual_roles))
  OR ('cliente' = ANY(a.usual_roles) AND 'proveedor' = ANY(b.usual_roles))
  OR ('inversor' = ANY(b.usual_roles) AND 'busca_inversion' = ANY(a.usual_roles))
  OR ('inversor' = ANY(a.usual_roles) AND 'busca_inversion' = ANY(b.usual_roles)) THEN
    score := score + 10;
  END IF;

  RETURN LEAST(score + 50, 100)::SMALLINT;
END;
$$;

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

CREATE TRIGGER profiles_updated_at  BEFORE UPDATE ON profiles  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER synergies_updated_at BEFORE UPDATE ON synergies FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Weekly pulse view
CREATE OR REPLACE VIEW user_weekly_pulse AS
SELECT
  p.id AS user_id,
  COUNT(DISTINCT m.id)  FILTER (WHERE m.status IN ('pending','proposed')) AS matches_count,
  COUNT(DISTINCT cr.id) FILTER (WHERE cr.status = 'pending' AND cr.created_at > NOW() - '7 days'::INTERVAL) AS open_requests,
  COUNT(DISTINCT c.id)  AS network_count
FROM profiles p
LEFT JOIN matches m  ON (m.user_id_a = p.id OR m.user_id_b = p.id) AND m.expires_at > NOW()
LEFT JOIN connection_requests cr ON (cr.from_user_id = p.id OR cr.to_user_id = p.id)
LEFT JOIN connections c ON (c.user_id_a = p.id OR c.user_id_b = p.id)
GROUP BY p.id;
