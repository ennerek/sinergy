-- 003_connections_write_policies.sql
-- Allow users involved in a connection to create/update it.

ALTER TABLE connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "connections_own_insert" ON connections FOR INSERT
  WITH CHECK (auth.uid() = user_id_a OR auth.uid() = user_id_b);

CREATE POLICY "connections_own_update" ON connections FOR UPDATE
  USING (auth.uid() = user_id_a OR auth.uid() = user_id_b)
  WITH CHECK (auth.uid() = user_id_a OR auth.uid() = user_id_b);
