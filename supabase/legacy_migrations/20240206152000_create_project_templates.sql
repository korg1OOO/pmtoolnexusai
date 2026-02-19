-- Create project_templates table
CREATE TABLE IF NOT EXISTS public.project_templates (
    id text PRIMARY KEY,
    name text NOT NULL,
    description text,
    category text NOT NULL,
    methodology text NOT NULL,
    complexity text,
    icon text,
    color text,
    content jsonb NOT NULL DEFAULT '{}'::jsonb,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    usage_count integer DEFAULT 0,
    tags text[] DEFAULT '{}'::text[]
);

-- Enable RLS
ALTER TABLE public.project_templates ENABLE ROW LEVEL SECURITY;

-- Create policy for reading templates (allow all authenticated users)
CREATE POLICY "Allow read access for authenticated users" ON public.project_templates
    FOR SELECT
    TO authenticated
    USING (true);

-- Create RPC function to create project from template
CREATE OR REPLACE FUNCTION public.create_project_from_template(
    p_template_id text,
    p_name text,
    p_description text,
    p_owner_id uuid,
    p_organization_id uuid,
    p_start_date date DEFAULT CURRENT_DATE
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_template record;
    v_project_id uuid;
    v_phase_record jsonb;
    v_task_record jsonb;
    v_phase_id uuid;
    v_phase_start date;
    v_phase_end date;
    v_phase_idx integer := 1;
    v_task_idx integer := 1;
    v_project_end_date date;
BEGIN
    -- 1. Get Template
    SELECT * INTO v_template FROM public.project_templates WHERE id = p_template_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Template not found';
    END IF;

    -- 2. Insert Project
    INSERT INTO public.projects (
        name,
        description,
        status,
        owner_id,
        start_date,
        end_date, -- Will update later
        methodology,
        budget_status,
        schedule_status,
        scope_status,
        health_score
    ) VALUES (
        p_name,
        COALESCE(p_description, v_template.description),
        'planning',
        p_owner_id,
        p_start_date,
        p_start_date + interval '90 days', -- Default, will refine
        v_template.methodology,
        'on-track',
        'on-track',
        'on-track',
        100
    )
    RETURNING id INTO v_project_id;

    -- Update template usage count
    UPDATE public.project_templates 
    SET usage_count = usage_count + 1 
    WHERE id = p_template_id;

    -- 3. Iterate Phases (represented as summary tasks/milestones)
    -- We assume the template content has a 'phases' array
    IF v_template.content ? 'phases' THEN
        FOR v_phase_record IN SELECT * FROM jsonb_array_elements(v_template.content->'phases')
        LOOP
            v_phase_start := p_start_date + ((v_phase_idx - 1) * 7 || ' days')::interval; -- Simple staggering
            v_phase_end := v_phase_start + ((v_phase_record->>'durationDays')::int || ' days')::interval;

            -- Create Phase Task (Level 1)
            INSERT INTO public.tasks (
                project_id,
                name,
                description,
                type,
                start_date,
                end_date,
                duration,
                level,
                wbs,
                sort_order,
                status,
                priority,
                progress
            ) VALUES (
                v_project_id,
                v_phase_record->>'name',
                v_phase_record->>'description',
                'summary', -- Assuming 'summary' is a valid task_type enum value ?? Need to verify enum
                v_phase_start,
                v_phase_end,
                (v_phase_record->>'durationDays')::int,
                0, -- Top level
                v_phase_idx::text,
                v_phase_idx * 1000,
                'not_started',
                'medium',
                0
            ) RETURNING id INTO v_phase_id;

            -- 4. Iterate Tasks within Phase
            v_task_idx := 1;
            IF v_phase_record ? 'tasks' THEN
                FOR v_task_record IN SELECT * FROM jsonb_array_elements(v_phase_record->'tasks')
                LOOP
                    INSERT INTO public.tasks (
                        project_id,
                        name,
                        description,
                        type,
                        parent_id,
                        start_date,
                        end_date,
                        duration,
                        level,
                        wbs,
                        sort_order,
                        status,
                        priority,
                        progress
                    ) VALUES (
                        v_project_id,
                        v_task_record->>'name',
                        v_task_record->>'description',
                        'task', -- Verify enum
                        v_phase_id,
                        v_phase_start, -- Simplified: all start with phase
                        v_phase_start + ((v_task_record->>'durationDays')::int || ' days')::interval,
                        (v_task_record->>'durationDays')::int,
                        1,
                        v_phase_idx || '.' || v_task_idx,
                        (v_phase_idx * 1000) + (v_task_idx * 10),
                        'not_started',
                        'medium',
                        0
                    );
                    v_task_idx := v_task_idx + 1;
                END LOOP;
            END IF;

            v_phase_idx := v_phase_idx + 1;
        END LOOP;
    END IF;

    -- Return the created project ID
    RETURN jsonb_build_object('id', v_project_id, 'name', p_name);
END;
$$;
