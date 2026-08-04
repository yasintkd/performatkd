-- PerformaTKD Şeması
-- Gruplar ve öğrenciler yc veritabanından okunur (training_groups, athletes).
-- group_id / student_id alanları yc kayıtlarının UUID'lerini tutar; FK yok.

CREATE TABLE IF NOT EXISTS test_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  unit TEXT NOT NULL,
  higher_is_better BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS test_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  group_id UUID NOT NULL, -- yc training_groups.id
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES test_sessions(id) ON DELETE CASCADE NOT NULL,
  student_id UUID NOT NULL, -- yc athletes.id
  test_type_id UUID REFERENCES test_types(id) ON DELETE CASCADE NOT NULL,
  value NUMERIC NOT NULL,
  notes TEXT, -- Beep test: JSON { level, shuttle, speed, category }
  created_by UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(session_id, student_id, test_type_id)
);

-- Yardımcı fonksiyon: role kontrolü (auth.jwt() metadata'dan)
CREATE OR REPLACE FUNCTION public.is_coach()
RETURNS BOOLEAN AS $$
  SELECT coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role', '') = 'coach';
$$ LANGUAGE sql STABLE;

-- RLS
ALTER TABLE test_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_results ENABLE ROW LEVEL SECURITY;

-- test_types: SELECT authenticated; yazma coach
DROP POLICY IF EXISTS test_types_select ON test_types;
CREATE POLICY test_types_select ON test_types FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS test_types_write ON test_types;
CREATE POLICY test_types_write ON test_types FOR ALL USING (public.is_coach()) WITH CHECK (public.is_coach());

-- test_sessions: SELECT authenticated; INSERT coach/assistant; UPDATE/DELETE coach
DROP POLICY IF EXISTS sessions_select ON test_sessions;
CREATE POLICY sessions_select ON test_sessions FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS sessions_insert ON test_sessions;
CREATE POLICY sessions_insert ON test_sessions FOR INSERT WITH CHECK (public.is_coach() OR coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role', '') = 'assistant');
DROP POLICY IF EXISTS sessions_update ON test_sessions;
CREATE POLICY sessions_update ON test_sessions FOR UPDATE USING (public.is_coach()) WITH CHECK (public.is_coach());
DROP POLICY IF EXISTS sessions_delete ON test_sessions;
CREATE POLICY sessions_delete ON test_sessions FOR DELETE USING (public.is_coach());

-- test_results: SELECT authenticated; INSERT coach/assistant; UPDATE/DELETE coach
DROP POLICY IF EXISTS results_select ON test_results;
CREATE POLICY results_select ON test_results FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS results_insert ON test_results;
CREATE POLICY results_insert ON test_results FOR INSERT WITH CHECK (public.is_coach() OR coalesce(auth.jwt() -> 'app_metadata' ->> 'role', auth.jwt() -> 'user_metadata' ->> 'role', '') = 'assistant');
DROP POLICY IF EXISTS results_update ON test_results;
CREATE POLICY results_update ON test_results FOR UPDATE USING (public.is_coach()) WITH CHECK (public.is_coach());
DROP POLICY IF EXISTS results_delete ON test_results;
CREATE POLICY results_delete ON test_results FOR DELETE USING (public.is_coach());