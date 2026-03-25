-- ============================================
-- FIX: meeting_attendees RLS infinite recursion (error 42P17)
-- ============================================
-- The original SELECT policy self-references meeting_attendees,
-- causing "infinite recursion detected in policy for relation meeting_attendees".
-- Replace with simple authenticated-user policies matching the pattern used
-- for meeting_participants and all other meeting-related tables.
-- ============================================

-- Drop the broken policies
DROP POLICY IF EXISTS "Users can view attendees of meetings they are part of" ON meeting_attendees;
DROP POLICY IF EXISTS "Organizers can manage attendees" ON meeting_attendees;

-- Replace with non-recursive policies
CREATE POLICY "Users can view meeting attendees"
    ON meeting_attendees FOR SELECT
    USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can manage meeting attendees"
    ON meeting_attendees FOR ALL
    USING (auth.uid() IS NOT NULL);
