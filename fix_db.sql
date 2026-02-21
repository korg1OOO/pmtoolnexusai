ALTER TABLE ai_credits DROP CONSTRAINT IF EXISTS unique_user;
-- Delete duplicates
DELETE FROM ai_credits a USING (
  SELECT MIN(ctid) as ctid, user_id FROM ai_credits GROUP BY user_id HAVING COUNT(*) > 1
) b
WHERE a.user_id = b.user_id AND a.ctid <> b.ctid;
-- Add constraint
ALTER TABLE ai_credits ADD CONSTRAINT unique_user UNIQUE (user_id);
