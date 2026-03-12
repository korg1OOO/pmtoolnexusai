const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();
const fs = require("fs");

const s = createClient(
    "https://rlnaylyjxjjaqzwpuhar.supabase.co",
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
    const out = [];
    function log(msg) {
        out.push(msg);
        console.log(msg);
    }

    try {
        const { data: profiles, error: pErr } = await s
            .from("profiles")
            .select("id,full_name,platform_role,project_role")
            .limit(100);
        if (pErr) throw pErr;

        log("=== PROFILES (" + profiles.length + ") ===");
        const platRoles = {};
        const projRoles = {};
        for (const p of profiles) {
            const pl = p.platform_role || "null";
            const pr = p.project_role || "null";
            platRoles[pl] = (platRoles[pl] || 0) + 1;
            projRoles[pr] = (projRoles[pr] || 0) + 1;
        }
        log("Platform roles: " + JSON.stringify(platRoles));
        log("Project roles: " + JSON.stringify(projRoles));

        // subscription plans
        const { data: plans } = await s
            .from("subscription_plans")
            .select("name,tier,price,max_projects,max_members");
        log("\n=== PLANS (" + (plans || []).length + ") ===");
        for (const p of plans || []) {
            log(
                "  " + p.name + " | " + p.tier + " | $" + p.price +
                " | proj=" + p.max_projects + " | mem=" + p.max_members
            );
        }

        // subscriptions
        const { data: subs } = await s
            .from("subscriptions")
            .select("user_id,tier,status");
        log("\n=== SUBSCRIPTIONS (" + (subs || []).length + ") ===");
        const tierCounts = {};
        for (const sub of subs || []) {
            tierCounts[sub.tier] = (tierCounts[sub.tier] || 0) + 1;
        }
        log("Tier breakdown: " + JSON.stringify(tierCounts));

        // workspace members
        const { data: wsm } = await s
            .from("workspace_members")
            .select("user_id,role");
        log("\n=== WORKSPACE MEMBERS (" + (wsm || []).length + ") ===");
        const wsRoles = {};
        for (const m of wsm || []) {
            wsRoles[m.role] = (wsRoles[m.role] || 0) + 1;
        }
        log("Roles: " + JSON.stringify(wsRoles));

        // program members
        const { data: pm } = await s
            .from("program_members")
            .select("user_id,role");
        log("\n=== PROGRAM MEMBERS (" + (pm || []).length + ") ===");
        const pmRoles = {};
        for (const m of pm || []) {
            pmRoles[m.role] = (pmRoles[m.role] || 0) + 1;
        }
        log("Roles: " + JSON.stringify(pmRoles));

        // tenant members
        const { data: tm } = await s
            .from("user_tenants")
            .select("user_id,role");
        log("\n=== TENANT MEMBERS (" + (tm || []).length + ") ===");
        const tmRoles = {};
        for (const m of tm || []) {
            tmRoles[m.role] = (tmRoles[m.role] || 0) + 1;
        }
        log("Roles: " + JSON.stringify(tmRoles));

        // test users
        const { data: testUsers } = await s
            .from("profiles")
            .select("id,full_name,platform_role,project_role")
            .like("full_name", "User%Name");
        log("\n=== TEST USERS (" + (testUsers || []).length + ") ===");
        for (const u of testUsers || []) {
            const { data: sub } = await s
                .from("subscriptions")
                .select("tier,status")
                .eq("user_id", u.id)
                .maybeSingle();
            log(
                "  " + u.full_name +
                " | platform=" + u.platform_role +
                " | project=" + u.project_role +
                " | tier=" + (sub ? sub.tier : "none")
            );
        }

        fs.writeFileSync("scripts/qa-gap-report.txt", out.join("\n"));
        log("\nDone.");
    } catch (e) {
        console.error("FATAL:", e.message || e);
        process.exit(1);
    }
}

main();
