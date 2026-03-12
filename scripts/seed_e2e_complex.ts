import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

async function seed() {
    console.log("Starting E2E via Supabase JS Client...");

    try {
        const { data: adminUsers, error: adminErr } = await supabase.from('users').select('id').limit(1); // Usually public.users or profiles
        let adminId;

        // If public.users fails, we can assume the admin ID from the previous task, or we can use the admin credential.
        if (adminErr || !adminUsers || adminUsers.length === 0) {
            adminId = "3a6889fe-2932-4004-9bfb-65a4b34a93ea";
            console.log("Admin fallback ID:", adminId);
        } else {
            adminId = adminUsers[0].id;
        }

        const projectConfigs = [
            { name: "Monolith Infrastructure Upgrade (E2E)", prefix: "MONO", budget: 5000000 },
            { name: "Agile Software Transformation (E2E)", prefix: "AGILE", budget: 1500000 },
            { name: "Regulatory Compliance Rollout (E2E)", prefix: "COMP", budget: 750000 }
        ];

        for (const pConfig of projectConfigs) {
            const projectId = generateUUID();
            console.log(`Creating project: ${pConfig.name} (${projectId})`);

            const { error: projectErr } = await supabase.from('projects').insert({
                id: projectId,
                name: pConfig.name,
                code: pConfig.prefix,
                description: 'E2E Testing Project covering all non-admin modules.',
                status: 'active',
                owner_id: adminId
            });

            if (projectErr) {
                console.error(`Project insert failed for ${pConfig.name}:`, projectErr.message);
                continue;
            }

            await supabase.from('project_members').insert({
                project_id: projectId,
                user_id: adminId,
                role: 'admin'
            });

            // 5 Phases and 50 Tasks
            for (let i = 1; i <= 5; i++) {
                const phaseId = generateUUID();
                const numStr = i.toString();
                await supabase.from('tasks').insert({
                    id: phaseId,
                    project_id: projectId,
                    title: 'Phase ' + numStr,
                    name: 'Phase ' + numStr,
                    description: 'Project Phase',
                    status: 'not-started',
                    priority: 'high',
                    assignee_id: adminId
                });

                const activities = [];
                for (let j = 1; j <= 10; j++) {
                    activities.push({
                        id: generateUUID(),
                        project_id: projectId,
                        title: 'Activity ' + numStr + '.' + j.toString(),
                        name: 'Activity ' + numStr + '.' + j.toString(),
                        parent_id: phaseId,
                        status: 'not-started',
                        priority: 'medium',
                        assignee_id: adminId
                    });
                }
                const { error: taskErr } = await supabase.from('tasks').insert(activities);
                if (taskErr) console.error("Tasks Error:", taskErr.message);
            }

            // 30 Issues
            const issues = [];
            for (let i = 1; i <= 30; i++) {
                issues.push({
                    id: generateUUID(),
                    project_id: projectId,
                    title: 'E2E Issue ' + i.toString(),
                    description: 'Test issue for E2E validation. Requires immediate triage.',
                    status: 'open',
                    severity: 'moderate',
                    priority: 'medium',
                    type: 'bug'
                });
            }
            await supabase.from('issues').insert(issues);

            // 10 Risks
            const risks = [];
            for (let i = 1; i <= 10; i++) {
                risks.push({
                    id: generateUUID(),
                    project_id: projectId,
                    title: 'E2E Risk ' + i.toString(),
                    status: 'identified',
                    probability: 'medium',
                    impact: 'medium'
                });
            }
            await supabase.from('risks').insert(risks);

            // Budgets (project_budget_items)
            const budgetId = generateUUID();
            const { error: budgetErr } = await supabase.from('project_budget_items').insert({
                id: budgetId,
                project_id: projectId,
                name: 'Master Capital Budget',
                category: 'CAPEX'
            });
            if (budgetErr) console.error("Budget insert error", budgetErr.message);

            // Meetings
            const { error: meetingErr } = await supabase.from('meetings').insert({
                id: generateUUID(),
                project_id: projectId,
                title: 'Kickoff Steerco',
                status: 'scheduled',
                date: new Date().toISOString().split('T')[0],
                start_time: '09:00:00'
            });
            if (meetingErr) console.error("Meeting insert error", meetingErr.message);

            console.log(`Fully populated project ${pConfig.name}`);
        }

        console.log("E2E Seed complete.");

    } catch (e) {
        console.error("Seeding failed:", e);
    }
}

seed();
