import { Client } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });
dotenv.config({ path: '.env.local' });

async function fixPostgres() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        console.error("Missing DATABASE_URL");
        process.exit(1);
    }
    const client = new Client({ connectionString });
    await client.connect();

    console.log("Connected to Postgres directly.");

    try {
        // Drop the problematic recursive policies
        await client.query(`
            DROP POLICY IF EXISTS "Admins can manage roles in their projects" ON public.user_roles;
            DROP POLICY IF EXISTS "Admins can manage AI agents" ON public.ai_agents;
        `);
        console.log("Dropped recursive policies.");

        // Create a SECURITY DEFINER function to check if user is admin
        await client.query(`
            CREATE OR REPLACE FUNCTION public.is_admin()
            RETURNS BOOLEAN
            LANGUAGE plpgsql SECURITY DEFINER
            AS $$
            BEGIN
                RETURN EXISTS (
                    SELECT 1 FROM public.user_roles
                    WHERE user_id = auth.uid()
                    AND role = 'admin'
                );
            END;
            $$;
        `);
        console.log("Created public.is_admin() function.");

        // Create new safe policy for user_roles
        await client.query(`
            CREATE POLICY "Admins can manage roles in their projects"
            ON public.user_roles FOR ALL
            TO authenticated
            USING (public.is_admin() OR EXISTS (
                SELECT 1 FROM public.user_roles ur
                WHERE ur.user_id = auth.uid()
                AND ur.project_id = user_roles.project_id
                AND ur.role IN ('admin', 'pm')
            ));
        `);
        console.log("Created fixed user_roles policy.");

        // Recreate AI agent policy using the function
        await client.query(`
            CREATE POLICY "Admins can manage AI agents"
            ON public.ai_agents FOR ALL
            USING (public.is_admin());
        `);
        console.log("Created fixed ai_agents policy.");

        console.log("All RLS policies fixed successfully!");
    } catch (e) {
        console.error("Error executing DDL:", e);
    } finally {
        await client.end();
    }
}
fixPostgres();
