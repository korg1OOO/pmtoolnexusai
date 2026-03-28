-- Fix BUG-006: Auto-assign admin role to project creator
-- This function bypasses RLS to insert the creator's role since
-- the user_roles INSERT policy requires existing admin (chicken-and-egg).
-- NOTE: Includes role_name column required by 20260215 migration schema.

CREATE OR REPLACE FUNCTION public.assign_project_creator_role(
  p_user_id UUID,
  p_project_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $BODY$
BEGIN
  INSERT INTO user_roles (user_id, project_id, role, role_name)
  VALUES (p_user_id, p_project_id, 'admin', 'admin')
  ON CONFLICT (user_id, project_id)
  DO UPDATE SET role = 'admin', role_name = 'admin';
END;
$BODY$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.assign_project_creator_role TO authenticated;
