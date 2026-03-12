-- Phase 5.1: Meeting Analytics
-- Migration: 20260214_phase5_meeting_analytics.sql

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- MEETING ANALYTICS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS meeting_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    meeting_id UUID NOT NULL REFERENCES meetings(id) ON DELETE CASCADE,
    
    -- Attendance metrics
    total_invites INTEGER DEFAULT 0,
    total_accepted INTEGER DEFAULT 0,
    total_declined INTEGER DEFAULT 0,
    total_tentative INTEGER DEFAULT 0,
    total_attended INTEGER DEFAULT 0,
    total_no_shows INTEGER DEFAULT 0,
    attendance_rate DECIMAL(5,2),
    
    -- Engagement metrics
    action_items_created INTEGER DEFAULT 0,
    action_items_completed INTEGER DEFAULT 0,
    action_items_pending INTEGER DEFAULT 0,
    completion_rate DECIMAL(5,2),
    notes_count INTEGER DEFAULT 0,
    
    -- Time metrics
    scheduled_duration INTEGER, -- minutes
    actual_duration INTEGER,    -- minutes
    duration_efficiency DECIMAL(5,2), -- actual/scheduled * 100
    
    -- Effectiveness score (0-100)
    effectiveness_score DECIMAL(5,2),
    
    -- Calculated at meeting end
    calculated_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(meeting_id)
);

-- =====================================================
-- ATTENDANCE PATTERNS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS attendance_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Attendance stats
    total_meetings_invited INTEGER DEFAULT 0,
    total_meetings_accepted INTEGER DEFAULT 0,
    total_meetings_declined INTEGER DEFAULT 0,
    total_meetings_tentative INTEGER DEFAULT 0,
    total_meetings_attended INTEGER DEFAULT 0,
    total_no_shows INTEGER DEFAULT 0,
    
    -- Response patterns
    avg_response_time_hours DECIMAL(10,2),
    acceptance_rate DECIMAL(5,2),
    attendance_rate DECIMAL(5,2),
    
    -- Time period
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, period_start, period_end)
);

-- =====================================================
-- MEETING TRENDS TABLE (for aggregated data)
-- =====================================================
CREATE TABLE IF NOT EXISTS meeting_trends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    program_id UUID,
    portfolio_id UUID,
    workspace_id UUID,
    
    -- Aggregation period
    period_type VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly'
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Meeting counts
    total_meetings INTEGER DEFAULT 0,
    meetings_by_type JSONB, -- { "standup": 10, "planning": 5, ... }
    meetings_by_scope JSONB, -- { "project": 15, "program": 5, ... }
    
    -- Aggregate metrics
    avg_attendance_rate DECIMAL(5,2),
    avg_completion_rate DECIMAL(5,2),
    avg_effectiveness_score DECIMAL(5,2),
    total_action_items INTEGER DEFAULT 0,
    completed_action_items INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(tenant_id, program_id, period_type, period_start, period_end)
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Meeting analytics indexes
CREATE INDEX IF NOT EXISTS idx_meeting_analytics_tenant 
    ON meeting_analytics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_meeting_analytics_meeting 
    ON meeting_analytics(meeting_id);
CREATE INDEX IF NOT EXISTS idx_meeting_analytics_calculated 
    ON meeting_analytics(calculated_at);

-- Attendance patterns indexes
CREATE INDEX IF NOT EXISTS idx_attendance_patterns_tenant 
    ON attendance_patterns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_attendance_patterns_user 
    ON attendance_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_patterns_period 
    ON attendance_patterns(period_start, period_end);

-- Meeting trends indexes
CREATE INDEX IF NOT EXISTS idx_meeting_trends_tenant 
    ON meeting_trends(tenant_id);
CREATE INDEX IF NOT EXISTS idx_meeting_trends_program 
    ON meeting_trends(program_id);
CREATE INDEX IF NOT EXISTS idx_meeting_trends_period 
    ON meeting_trends(period_type, period_start, period_end);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to calculate meeting analytics
CREATE OR REPLACE FUNCTION calculate_meeting_analytics(p_meeting_id UUID)
RETURNS UUID AS $$
DECLARE
    v_analytics_id UUID;
    v_tenant_id UUID;
    v_scheduled_duration INTEGER;
    v_actual_duration INTEGER;
    v_total_invites INTEGER;
    v_total_accepted INTEGER;
    v_total_declined INTEGER;
    v_total_tentative INTEGER;
    v_total_attended INTEGER;
    v_action_items_created INTEGER;
    v_action_items_completed INTEGER;
    v_notes_count INTEGER;
    v_attendance_rate DECIMAL(5,2);
    v_completion_rate DECIMAL(5,2);
    v_duration_efficiency DECIMAL(5,2);
    v_effectiveness_score DECIMAL(5,2);
BEGIN
    -- Get meeting details
    SELECT tenant_id, 
           EXTRACT(EPOCH FROM (end_time - start_time))/60
    INTO v_tenant_id, v_scheduled_duration
    FROM meetings
    WHERE id = p_meeting_id;
    
    -- Count attendees by status
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'accepted'),
        COUNT(*) FILTER (WHERE status = 'declined'),
        COUNT(*) FILTER (WHERE status = 'tentative'),
        COUNT(*) FILTER (WHERE status = 'attended')
    INTO v_total_invites, v_total_accepted, v_total_declined, 
         v_total_tentative, v_total_attended
    FROM meeting_attendees
    WHERE meeting_id = p_meeting_id;
    
    -- Count action items
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE status = 'completed')
    INTO v_action_items_created, v_action_items_completed
    FROM meeting_action_items
    WHERE meeting_id = p_meeting_id;
    
    -- Count notes
    SELECT COUNT(*)
    INTO v_notes_count
    FROM meeting_notes
    WHERE meeting_id = p_meeting_id;
    
    -- Calculate rates
    v_attendance_rate := CASE 
        WHEN v_total_invites > 0 
        THEN (v_total_attended::DECIMAL / v_total_invites * 100)
        ELSE 0 
    END;
    
    v_completion_rate := CASE 
        WHEN v_action_items_created > 0 
        THEN (v_action_items_completed::DECIMAL / v_action_items_created * 100)
        ELSE 100 
    END;
    
    -- For now, use scheduled duration as actual (can be updated later)
    v_actual_duration := v_scheduled_duration;
    v_duration_efficiency := 100;
    
    -- Calculate effectiveness score
    v_effectiveness_score := (
        (v_attendance_rate * 0.3) +
        (v_completion_rate * 0.4) +
        (v_duration_efficiency * 0.3)
    );
    
    -- Insert or update analytics
    INSERT INTO meeting_analytics (
        tenant_id,
        meeting_id,
        total_invites,
        total_accepted,
        total_declined,
        total_tentative,
        total_attended,
        total_no_shows,
        attendance_rate,
        action_items_created,
        action_items_completed,
        action_items_pending,
        completion_rate,
        notes_count,
        scheduled_duration,
        actual_duration,
        duration_efficiency,
        effectiveness_score,
        calculated_at
    ) VALUES (
        v_tenant_id,
        p_meeting_id,
        v_total_invites,
        v_total_accepted,
        v_total_declined,
        v_total_tentative,
        v_total_attended,
        v_total_accepted - v_total_attended,
        v_attendance_rate,
        v_action_items_created,
        v_action_items_completed,
        v_action_items_created - v_action_items_completed,
        v_completion_rate,
        v_notes_count,
        v_scheduled_duration,
        v_actual_duration,
        v_duration_efficiency,
        v_effectiveness_score,
        NOW()
    )
    ON CONFLICT (meeting_id) 
    DO UPDATE SET
        total_invites = EXCLUDED.total_invites,
        total_accepted = EXCLUDED.total_accepted,
        total_declined = EXCLUDED.total_declined,
        total_tentative = EXCLUDED.total_tentative,
        total_attended = EXCLUDED.total_attended,
        total_no_shows = EXCLUDED.total_no_shows,
        attendance_rate = EXCLUDED.attendance_rate,
        action_items_created = EXCLUDED.action_items_created,
        action_items_completed = EXCLUDED.action_items_completed,
        action_items_pending = EXCLUDED.action_items_pending,
        completion_rate = EXCLUDED.completion_rate,
        notes_count = EXCLUDED.notes_count,
        effectiveness_score = EXCLUDED.effectiveness_score,
        calculated_at = NOW(),
        updated_at = NOW()
    RETURNING id INTO v_analytics_id;
    
    RETURN v_analytics_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update attendance patterns
CREATE OR REPLACE FUNCTION update_attendance_patterns(
    p_user_id UUID,
    p_period_start DATE,
    p_period_end DATE
)
RETURNS UUID AS $$
DECLARE
    v_pattern_id UUID;
    v_tenant_id UUID;
    v_total_invited INTEGER;
    v_total_accepted INTEGER;
    v_total_declined INTEGER;
    v_total_tentative INTEGER;
    v_total_attended INTEGER;
    v_acceptance_rate DECIMAL(5,2);
    v_attendance_rate DECIMAL(5,2);
BEGIN
    -- Get tenant_id from user's first meeting
    SELECT DISTINCT ma.tenant_id
    INTO v_tenant_id
    FROM meeting_attendees ma
    JOIN meetings m ON ma.meeting_id = m.id
    WHERE ma.user_id = p_user_id
    LIMIT 1;
    
    -- Count meetings by status
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE ma.status = 'accepted'),
        COUNT(*) FILTER (WHERE ma.status = 'declined'),
        COUNT(*) FILTER (WHERE ma.status = 'tentative'),
        COUNT(*) FILTER (WHERE ma.status = 'attended')
    INTO v_total_invited, v_total_accepted, v_total_declined,
         v_total_tentative, v_total_attended
    FROM meeting_attendees ma
    JOIN meetings m ON ma.meeting_id = m.id
    WHERE ma.user_id = p_user_id
      AND m.date BETWEEN p_period_start AND p_period_end;
    
    -- Calculate rates
    v_acceptance_rate := CASE 
        WHEN v_total_invited > 0 
        THEN (v_total_accepted::DECIMAL / v_total_invited * 100)
        ELSE 0 
    END;
    
    v_attendance_rate := CASE 
        WHEN v_total_accepted > 0 
        THEN (v_total_attended::DECIMAL / v_total_accepted * 100)
        ELSE 0 
    END;
    
    -- Insert or update pattern
    INSERT INTO attendance_patterns (
        tenant_id,
        user_id,
        total_meetings_invited,
        total_meetings_accepted,
        total_meetings_declined,
        total_meetings_tentative,
        total_meetings_attended,
        total_no_shows,
        acceptance_rate,
        attendance_rate,
        period_start,
        period_end
    ) VALUES (
        v_tenant_id,
        p_user_id,
        v_total_invited,
        v_total_accepted,
        v_total_declined,
        v_total_tentative,
        v_total_attended,
        v_total_accepted - v_total_attended,
        v_acceptance_rate,
        v_attendance_rate,
        p_period_start,
        p_period_end
    )
    ON CONFLICT (user_id, period_start, period_end)
    DO UPDATE SET
        total_meetings_invited = EXCLUDED.total_meetings_invited,
        total_meetings_accepted = EXCLUDED.total_meetings_accepted,
        total_meetings_declined = EXCLUDED.total_meetings_declined,
        total_meetings_tentative = EXCLUDED.total_meetings_tentative,
        total_meetings_attended = EXCLUDED.total_meetings_attended,
        total_no_shows = EXCLUDED.total_no_shows,
        acceptance_rate = EXCLUDED.acceptance_rate,
        attendance_rate = EXCLUDED.attendance_rate,
        updated_at = NOW()
    RETURNING id INTO v_pattern_id;
    
    RETURN v_pattern_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE meeting_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_trends ENABLE ROW LEVEL SECURITY;

-- Meeting analytics policies
CREATE POLICY meeting_analytics_select ON meeting_analytics
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM workspace_members 
            WHERE user_id = auth.uid()
        )
    );

-- Attendance patterns policies (users can see their own data)
CREATE POLICY attendance_patterns_select ON attendance_patterns
    FOR SELECT USING (
        user_id = auth.uid() OR
        tenant_id IN (
            SELECT tenant_id FROM workspace_members 
            WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
        )
    );

-- Meeting trends policies
CREATE POLICY meeting_trends_select ON meeting_trends
    FOR SELECT USING (
        tenant_id IN (
            SELECT tenant_id FROM workspace_members 
            WHERE user_id = auth.uid()
        )
    );

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update timestamp on meeting_analytics
CREATE OR REPLACE FUNCTION update_meeting_analytics_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER meeting_analytics_updated
    BEFORE UPDATE ON meeting_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_meeting_analytics_timestamp();

-- Auto-update timestamp on attendance_patterns
CREATE TRIGGER attendance_patterns_updated
    BEFORE UPDATE ON attendance_patterns
    FOR EACH ROW
    EXECUTE FUNCTION update_meeting_analytics_timestamp();

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE meeting_analytics IS 'Analytics data for individual meetings';
COMMENT ON TABLE attendance_patterns IS 'User attendance patterns over time periods';
COMMENT ON TABLE meeting_trends IS 'Aggregated meeting trends by period';
COMMENT ON FUNCTION calculate_meeting_analytics IS 'Calculate analytics for a specific meeting';
COMMENT ON FUNCTION update_attendance_patterns IS 'Update attendance patterns for a user over a period';
