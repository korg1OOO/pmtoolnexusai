import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Database, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function DatabaseMigrationPanel() {
    const [isRunning, setIsRunning] = useState(false);
    const [results, setResults] = useState<{ success: boolean; message: string; details?: string }[]>([]);

    const runMigrations = async () => {
        setIsRunning(true);
        setResults([]);
        const newResults: typeof results = [];

        // Migration SQL - support_tickets table
        const migrationSQL = `
-- Create support_tickets table
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new'::text,
  CONSTRAINT support_tickets_pkey PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.support_tickets;
DROP POLICY IF EXISTS "Enable insert for anon users (Simulated Public)" ON public.support_tickets;
DROP POLICY IF EXISTS "Enable read for authenticated users only" ON public.support_tickets;

-- Create policies
CREATE POLICY "Enable insert for authenticated users only"
ON public.support_tickets
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable insert for anon users (Simulated Public)"
ON public.support_tickets
AS PERMISSIVE
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "Enable read for authenticated users only"
ON public.support_tickets
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);
    `.trim();

        try {
            // Execute SQL directly using Supabase client
            // Note: This uses the SQL editor approach via the REST API
            const { data, error } = await supabase.rpc('exec_sql', {
                query: migrationSQL
            });

            if (error) {
                // If exec_sql RPC doesn't exist, we'll need to use the dashboard
                newResults.push({
                    success: false,
                    message: 'support_tickets migration',
                    details: `Direct SQL execution not available. Error: ${error.message}. Please use the Supabase Dashboard SQL Editor to run this migration manually.`
                });
                toast.error('Migration requires manual execution', {
                    description: 'Copy the SQL from the console and run it in Supabase Dashboard'
                });
                console.log('=== MIGRATION SQL TO RUN MANUALLY ===');
                console.log(migrationSQL);
                console.log('=== END MIGRATION SQL ===');
            } else {
                newResults.push({
                    success: true,
                    message: 'support_tickets migration',
                    details: 'Table created successfully with RLS policies'
                });
                toast.success('Migration completed successfully!');
            }
        } catch (err: any) {
            newResults.push({
                success: false,
                message: 'support_tickets migration',
                details: err.message
            });
            toast.error('Migration failed', {
                description: err.message
            });
            console.log('=== MIGRATION SQL TO RUN MANUALLY ===');
            console.log(migrationSQL);
            console.log('=== END MIGRATION SQL ===');
        }

        setResults(newResults);
        setIsRunning(false);
    };

    const copySQL = () => {
        const sql = `
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  name text NOT NULL,
  email text NOT NULL,
  subject text NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new'::text,
  CONSTRAINT support_tickets_pkey PRIMARY KEY (id)
);

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.support_tickets;
DROP POLICY IF EXISTS "Enable insert for anon users (Simulated Public)" ON public.support_tickets;
DROP POLICY IF EXISTS "Enable read for authenticated users only" ON public.support_tickets;

CREATE POLICY "Enable insert for authenticated users only"
ON public.support_tickets AS PERMISSIVE FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Enable insert for anon users (Simulated Public)"
ON public.support_tickets AS PERMISSIVE FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Enable read for authenticated users only"
ON public.support_tickets AS PERMISSIVE FOR SELECT TO authenticated USING (true);
    `.trim();

        navigator.clipboard.writeText(sql);
        toast.success('SQL copied to clipboard!', {
            description: 'Paste it into Supabase Dashboard SQL Editor'
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Database Migrations
                </CardTitle>
                <CardDescription>
                    Apply the support_tickets table migration
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        <strong>Recommended:</strong> Use the "Copy SQL" button and run it manually in the{' '}
                        <a
                            href="https://supabase.com/dashboard/project/wmnfuwmjauslyqqucmov/sql"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                        >
                            Supabase Dashboard SQL Editor
                        </a>
                    </AlertDescription>
                </Alert>

                <div className="flex gap-2">
                    <Button
                        onClick={copySQL}
                        variant="outline"
                        className="flex-1"
                    >
                        <Database className="mr-2 h-4 w-4" />
                        Copy SQL to Clipboard
                    </Button>

                    <Button
                        onClick={runMigrations}
                        disabled={isRunning}
                        className="flex-1"
                    >
                        {isRunning ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Running...
                            </>
                        ) : (
                            <>
                                <Database className="mr-2 h-4 w-4" />
                                Try Auto-Run
                            </>
                        )}
                    </Button>
                </div>

                {results.length > 0 && (
                    <div className="space-y-2 mt-4">
                        <h4 className="text-sm font-medium">Results</h4>
                        {results.map((result, idx) => (
                            <Alert key={idx} variant={result.success ? 'default' : 'destructive'}>
                                {result.success ? (
                                    <CheckCircle2 className="h-4 w-4" />
                                ) : (
                                    <AlertCircle className="h-4 w-4" />
                                )}
                                <AlertDescription>
                                    <div className="font-medium">{result.message}</div>
                                    {result.details && (
                                        <div className="text-xs mt-1 opacity-80">{result.details}</div>
                                    )}
                                </AlertDescription>
                            </Alert>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
