-- Create database function for FAQ feedback tracking
-- This enables the PublicFAQs page to track user feedback

CREATE OR REPLACE FUNCTION increment_faq_feedback(faq_id UUID, is_helpful BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF is_helpful THEN
        UPDATE faqs
        SET helpful_count = helpful_count + 1
        WHERE id = faq_id;
    ELSE
        UPDATE faqs
        SET not_helpful_count = not_helpful_count + 1
        WHERE id = faq_id;
    END IF;
END;
$$;

-- Grant execute permission to authenticated and anonymous users
GRANT EXECUTE ON FUNCTION increment_faq_feedback(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_faq_feedback(UUID, BOOLEAN) TO anon;

COMMENT ON FUNCTION increment_faq_feedback IS 'Safely increments FAQ feedback counters for user voting';
