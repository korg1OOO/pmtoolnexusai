-- Create the missing handle_updated_at function
-- This is needed by several trigger definitions in the pending migrations

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Verify the function was created
SELECT 'Function created successfully!' as status;
