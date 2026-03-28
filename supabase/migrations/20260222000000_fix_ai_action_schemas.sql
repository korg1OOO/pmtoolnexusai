-- Fix missing created_by in tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);

-- Drop potentially recursive policies on meeting_attendees
-- Using a DO block to safely drop policies without knowing exact names, or we just drop known standard ones
DO $$
DECLARE
    pol record;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'public' AND tablename = 'meeting_attendees'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.meeting_attendees', pol.policyname);
    END LOOP;
END
$$;

-- Recreate safe policies for meeting_attendees
CREATE POLICY "Users can view meeting attendees"
ON public.meeting_attendees
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.meetings m
        WHERE m.id = meeting_attendees.meeting_id
        -- We just check if the user is in the project of the meeting. 
        -- To avoid recursion, we don't query meeting_attendees again
        AND EXISTS (
            SELECT 1 FROM public.project_members pm
            WHERE pm.project_id = m.project_id AND pm.user_id = auth.uid()
        )
    )
);

CREATE POLICY "Users can insert meeting attendees"
ON public.meeting_attendees
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.meetings m
        WHERE m.id = meeting_attendees.meeting_id
        AND m.organizer_id = auth.uid()
    )
    OR auth.uid() = user_id
);

CREATE POLICY "Users can update meeting attendees"
ON public.meeting_attendees
FOR UPDATE
TO authenticated
USING (
    auth.uid() = user_id OR
    EXISTS (
        SELECT 1 FROM public.meetings m
        WHERE m.id = meeting_attendees.meeting_id AND m.organizer_id = auth.uid()
    )
);

CREATE POLICY "Users can delete meeting attendees"
ON public.meeting_attendees
FOR DELETE
TO authenticated
USING (
    auth.uid() = user_id OR
    EXISTS (
        SELECT 1 FROM public.meetings m
        WHERE m.id = meeting_attendees.meeting_id AND m.organizer_id = auth.uid()
    )
);
