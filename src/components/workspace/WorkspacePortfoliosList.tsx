import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Props {
  workspaceId: string;
}

export function WorkspacePortfoliosList({ workspaceId }: Props) {
  const { data: portfolios, isLoading } = useQuery({
    queryKey: ['workspace-portfolios', workspaceId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('portfolios')
        .select('id, name, status, created_at')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data as { id: string; name: string; status: string; created_at: string }[];
    },
    enabled: !!workspaceId,
  });

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Active Portfolios</h2>
        <Button variant="ghost" size="sm">View All</Button>
      </div>
      <div className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
        {!isLoading && (!portfolios || portfolios.length === 0) && (
          <p className="text-sm text-muted-foreground">No portfolios yet.</p>
        )}
        {portfolios?.map((p) => (
          <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent cursor-pointer">
            <div className="font-medium">{p.name}</div>
            <span className={`text-xs px-2 py-1 rounded ${
              p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
            }`}>
              {p.status || 'Active'}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
