-- Create the handle_updated_at function that is needed by several triggers
-- This function automatically updates the updated_at column when a row is modified

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON FUNCTION public.handle_updated_at() IS 'Trigger function to automatically update updated_at timestamp';
