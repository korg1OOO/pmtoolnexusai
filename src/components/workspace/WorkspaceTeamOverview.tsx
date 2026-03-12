import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Props {
  workspaceId: string;
}

export function WorkspaceTeamOverview({ workspaceId }: Props) {
  const { data: members } = useQuery({
    queryKey: ['workspace-team-overview', workspaceId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('workspace_members')
        .select('id, role')
        .eq('workspace_id', workspaceId)
        .eq('is_active', true);
      if (error) throw error;
      return data as { id: string; role: string }[];
    },
    enabled: !!workspaceId,
  });

  const roleCounts = (members || []).reduce<Record<string, number>>((acc, m) => {
    const role = m.role || 'Member';
    acc[role] = (acc[role] || 0) + 1;
    return acc;
  }, {});

  const entries = Object.entries(roleCounts);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold">Team Overview</h2>
        <Button variant="ghost" size="sm">Manage Team</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {entries.length === 0 && (
          <div className="border rounded-lg p-4">
            <div className="text-sm text-muted-foreground">Total Members</div>
            <div className="text-2xl font-bold mt-1">0</div>
          </div>
        )}
        {entries.map(([role, count]) => (
          <div key={role} className="border rounded-lg p-4">
            <div className="text-sm text-muted-foreground">{role}s</div>
            <div className="text-2xl font-bold mt-1">{count}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
