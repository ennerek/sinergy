-- Allow users to delete their own reflections
CREATE POLICY "reflections_own_delete"
  ON reflections FOR DELETE USING (auth.uid() = user_id);

-- Allow users to delete their own replies
CREATE POLICY "replies_own_delete"
  ON reflection_replies FOR DELETE USING (auth.uid() = user_id);

-- Allow users to update their own replies
CREATE POLICY "replies_own_update"
  ON reflection_replies FOR UPDATE USING (auth.uid() = user_id);
