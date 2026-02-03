-- Seed Scenarios and Strategic Insights
DO $$ 
DECLARE
    project_id uuid;
BEGIN
    -- Get the first project
    SELECT id INTO project_id FROM public.projects LIMIT 1;

    IF project_id IS NOT NULL THEN
        -- Seed Scenarios
        INSERT INTO public.scenarios (project_id, name, description, data)
        VALUES 
        (project_id, 'Baseline Plan', 'Current approved project timeline - the reference point for all comparisons', '{"status": "active", "createdDate": "2024-01-15", "modifiedDate": "2024-01-15", "author": "Sarah Mitchell", "adjustments": [], "impact": {"endDateChange": 0, "costChange": 0, "riskLevel": "medium", "criticalPathAffected": false, "tasksAffected": 0}}'::jsonb),
        (project_id, 'Accelerated Delivery', 'Fast-track Wave 2 migration with additional resources to meet Q3 deadline', '{"status": "draft", "createdDate": "2024-08-01", "modifiedDate": "2024-08-05", "author": "John Doe", "adjustments": [{"id": "adj-1", "type": "acceleration", "taskId": "T-012", "taskName": "Wave 2 Migration", "field": "duration", "originalValue": 61, "newValue": 45, "unit": "days"}, {"id": "adj-2", "type": "resource", "taskId": "T-012", "taskName": "Wave 2 Migration", "field": "resources", "originalValue": 3, "newValue": 5, "unit": "FTEs"}, {"id": "adj-3", "type": "acceleration", "taskId": "T-013", "taskName": "Data Migration", "field": "duration", "originalValue": 77, "newValue": 60, "unit": "days"}], "impact": {"endDateChange": -16, "costChange": 150000, "riskLevel": "high", "criticalPathAffected": true, "tasksAffected": 3}}'::jsonb),
        (project_id, 'Risk Mitigation', 'Extended testing phase to reduce go-live risks and improve quality', '{"status": "draft", "createdDate": "2024-08-05", "modifiedDate": "2024-08-10", "author": "Emily Brown", "adjustments": [{"id": "adj-1", "type": "delay", "taskId": "T-015", "taskName": "Testing & Validation", "field": "duration", "originalValue": 90, "newValue": 120, "unit": "days"}, {"id": "adj-2", "type": "resource", "taskId": "T-015", "taskName": "Testing & Validation", "field": "resources", "originalValue": 2, "newValue": 3, "unit": "FTEs"}], "impact": {"endDateChange": 30, "costChange": 75000, "riskLevel": "low", "criticalPathAffected": true, "tasksAffected": 2}}'::jsonb)
        ON CONFLICT DO NOTHING;

        -- Seed Strategic Insights
        -- Context
        INSERT INTO public.strategic_insights (project_id, type, data)
        VALUES (project_id, 'context', '{
            "aiReadiness": 0.78,
            "contextQuality": "good",
            "businessCase": {
                "objectives": [
                    "Reduce infrastructure costs by 30% within 2 years",
                    "Improve system reliability to 99.9% uptime",
                    "Enable faster feature deployment (2 weeks vs 2 months)",
                    "Meet regulatory compliance for data sovereignty"
                ],
                "successCriteria": [
                    {"id": "SC-001", "description": "Infrastructure cost reduction", "status": "on-track", "target": "30% reduction", "currentValue": "5% reduction"},
                    {"id": "SC-002", "description": "System uptime", "status": "at-risk", "target": "99.9%", "currentValue": "99.2%"},
                    {"id": "SC-003", "description": "Deployment frequency", "status": "on-track", "target": "4/month", "currentValue": "1/month"}
                ],
                "benefits": [
                    {"id": "B-001", "type": "financial", "description": "Annual infrastructure savings", "quantified": true, "value": 750000},
                    {"id": "B-002", "type": "operational", "description": "Reduced downtime impact", "quantified": true, "value": 200000},
                    {"id": "B-003", "type": "strategic", "description": "Market competitiveness", "quantified": false}
                ],
                "assumptions": [
                    {"id": "A-001", "status": "valid", "description": "Cloud provider pricing will remain stable", "impact": "Budget accuracy"},
                    {"id": "A-002", "status": "uncertain", "description": "Team will have adequate cloud skills", "impact": "Timeline and quality"}
                ]
            },
            "regulatoryFrameworks": [
                {"id": "REG-001", "name": "GDPR", "jurisdiction": "EU", "complianceStatus": "partially-compliant", "requirements": ["Data residency", "Right to erasure"], "deadline": "2024-12-31"},
                {"id": "REG-002", "name": "SOC 2", "jurisdiction": "US", "complianceStatus": "not-assessed", "requirements": ["Security controls", "Availability"]}
            ],
            "operatingConstraints": [
                {"id": "OC-001", "flexibility": "fixed", "description": "Q4 code freeze (Nov 15 - Dec 31)", "type": "timeline", "impact": "schedule"},
                {"id": "OC-002", "flexibility": "negotiable", "description": "Senior cloud architects limited to 2 FTEs", "type": "resource", "impact": "scope"}
            ],
            "stakeholderPowerMap": {
                "stakeholders": [
                    {"id": "STK-001", "name": "CEO", "role": "Executive Sponsor", "power": "high", "interest": "medium", "attitude": "supporter", "engagementStrategy": "Monthly briefings"},
                    {"id": "STK-002", "name": "CTO", "role": "Technical Sponsor", "power": "high", "interest": "high", "attitude": "champion", "engagementStrategy": "Weekly steering committee"}
                ],
                "relationships": [
                    {"from": "STK-002", "to": "STK-001", "type": "reports-to", "strength": "strong"}
                ]
            }
        }'::jsonb)
        ON CONFLICT DO NOTHING;

        -- Risk Discovery
        INSERT INTO public.strategic_insights (project_id, type, data)
        VALUES (project_id, 'risk-discovery', '{
            "discoveredRisks": [
                {
                    "id": "AI-RISK-001",
                    "title": "Q4 Code Freeze Creates Compressed Testing Window",
                    "description": "Insufficient buffer for post-go-live issues due to Nov 15 freeze.",
                    "confidence": 0.87,
                    "probability": "high",
                    "impact": "high",
                    "source": "pattern-matching",
                    "explanation": "Analysis indicates only 2 weeks for stabilization.",
                    "dataSupport": [
                        {"description": "Historical stabilization avg", "value": "4 weeks"},
                        {"description": "Current buffer", "value": "2 weeks"}
                    ]
                }
            ],
            "hiddenRisks": [
                {
                    "id": "HIDDEN-001",
                    "title": "Knowledge Concentration Risk",
                    "confidence": 0.75,
                    "inference": "Critical knowledge in 2 members only.",
                    "indicators": ["80% tasks to Mike Johnson"],
                    "recommendation": "Knowledge transfer sessions."
                }
            ],
            "timingRisks": [
                {
                    "id": "TIME-001",
                    "type": "seasonal",
                    "period": "Dec 15 - Jan 5",
                    "description": "Holiday period reduces capacity by 40%.",
                    "impact": "Significant cascade if delayed.",
                    "mitigation": "Build 2-week buffer."
                }
            ]
        }'::jsonb)
        ON CONFLICT DO NOTHING;

        -- Value Engineering
        INSERT INTO public.strategic_insights (project_id, type, data)
        VALUES (project_id, 'value-engineering', '{
            "options": [
                {
                    "id": "OPT-001",
                    "name": "Standard Phased Migration",
                    "description": "Existing plan with sequential wave approach.",
                    "cost": 2500000,
                    "roi": 0.28,
                    "riskScore": 4,
                    "timeImpact": 0,
                    "pros": ["Proven methodology", "Balanced workload"],
                    "cons": ["Slower ROI realization"]
                },
                {
                    "id": "OPT-002",
                    "name": "Accelerated Wave 2",
                    "description": "Parallelize Wave 2 tasks with additional FTEs.",
                    "cost": 2850000,
                    "roi": 0.35,
                    "riskScore": 6,
                    "timeImpact": -25,
                    "pros": ["Faster time-to-market", "Higher total ROI"],
                    "cons": ["Increased burn rate", "Resource contention risk"]
                }
            ],
            "recommendation": {
                "selectedOption": "OPT-001",
                "justification": "Provides best balance of risk and reward given current skill levels.",
                "confidence": 0.85
            },
            "tradeoffAnalysis": {
                "optimalPoint": "Phased Approach",
                "costVsTime": {
                    "points": [{"label": "Standard", "y": 0, "isOptimal": true}, {"label": "Accelerated", "y": -25, "isOptimal": false}],
                    "recommendation": "Standard approach avoids critical path volatility."
                },
                "costVsRisk": {
                    "points": [{"label": "Standard", "y": 4, "isOptimal": true}, {"label": "Accelerated", "y": 6, "isOptimal": false}],
                    "recommendation": "Lower risk score preferred for initial cloud transition."
                }
            }
        }'::jsonb)
        ON CONFLICT DO NOTHING;

    END IF;
END $$;
