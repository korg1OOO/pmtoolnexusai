import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Props {
  workspaceId: string;
}

export function WorkspaceProgramsList({ workspaceId }: Props) {
  const { data: programs, isLoading } = useQuery({
    queryKey: ['workspace-programs', workspaceId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('programs')
        .select('id, name, status, progress')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data as { id: string; name: string; status: string; progress: number }[];
    },
    enabled: !!workspaceId,
  });

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Recent Programs</h2>
        <Button variant="ghost" size="sm">View All</Button>
      </div>
      <div className="space-y-3">
        {isLoading && <p className="text-sm text-muted-foreground">Loading...</p>}
        {!isLoading && (!programs || programs.length === 0) && (
          <p className="text-sm text-muted-foreground">No programs yet.</p>
        )}
        {programs?.map((p) => (
          <div key={p.id} className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium">{p.name}</div>
              <span className={`text-xs px-2 py-1 rounded ${
                (p.progress || 0) >= 50 ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
              }`}>
                {p.progress || 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full"
                style={{ width: `${p.progress || 0}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
