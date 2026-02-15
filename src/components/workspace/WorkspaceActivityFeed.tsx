import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';

interface Props {
  workspaceId: string;
}

export function WorkspaceActivityFeed({ workspaceId }: Props) {
  const { data: activities } = useQuery({
    queryKey: ['workspace-activity', workspaceId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('timeline_activities')
        .select('id, title, description, created_at')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) {
        // timeline_activities may not have workspace_id, fallback empty
        return [];
      }
      return data as { id: string; title: string; description: string; created_at: string }[];
    },
    enabled: !!workspaceId,
  });

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
      <div className="space-y-3">
        {(!activities || activities.length === 0) && (
          <p className="text-sm text-muted-foreground">No recent activity.</p>
        )}
        {activities?.map((a) => (
          <div key={a.id} className="flex items-start gap-3 p-3 border rounded-lg">
            <div className="w-2 h-2 bg-primary rounded-full mt-2" />
            <div className="flex-1">
              <div className="font-medium">{a.title}</div>
              <div className="text-sm text-muted-foreground">{a.description}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
