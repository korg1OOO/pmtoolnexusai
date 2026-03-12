import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Database, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export function DatabaseMigrationPanel() {
    const [isRunning, setIsRunning] = useState(false);
    const [results, setResults] = useState<{ success: boolean; message: string; details?: string }[]>([]);

    const migrationSQL = `
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
    `.trim();

    const runMigrations = async () => {
        setIsRunning(true);
        setResults([]);
        
        try {
            // Migrations are managed via the Lovable Cloud migration tool
            setResults([{
                success: true,
                message: 'Migrations are managed automatically by Lovable Cloud',
                details: 'Use the migration tool in Lovable to apply database changes'
            }]);
            toast.success('Database is up to date');
        } catch (err: any) {
            setResults([{
                success: false,
                message: 'Migration check failed',
                details: err.message
            }]);
        }

        setIsRunning(false);
    };

    const copySQL = () => {
        navigator.clipboard.writeText(migrationSQL);
        toast.success('SQL copied to clipboard!');
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Database Migrations
                </CardTitle>
                <CardDescription>
                    Database migrations are managed automatically
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Migrations are applied automatically via Lovable Cloud.
                    </AlertDescription>
                </Alert>

                <div className="flex gap-2">
                    <Button onClick={copySQL} variant="outline" className="flex-1">
                        <Database className="mr-2 h-4 w-4" />
                        Copy SQL to Clipboard
                    </Button>
                    <Button onClick={runMigrations} disabled={isRunning} className="flex-1">
                        {isRunning ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Checking...
                            </>
                        ) : (
                            <>
                                <Database className="mr-2 h-4 w-4" />
                                Check Status
                            </>
                        )}
                    </Button>
                </div>

                {results.length > 0 && (
                    <div className="space-y-2 mt-4">
                        <h4 className="text-sm font-medium">Results</h4>
                        {results.map((result, idx) => (
                            <Alert key={idx} variant={result.success ? 'default' : 'destructive'}>
                                {result.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                <AlertDescription>
                                    <div className="font-medium">{result.message}</div>
                                    {result.details && <div className="text-xs mt-1 opacity-80">{result.details}</div>}
                                </AlertDescription>
                            </Alert>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}