import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { ProjectRole } from '@/types/ai-agents';

export function useUserRole(projectId: string | null) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-role', projectId, user?.id],
    queryFn: async (): Promise<ProjectRole> => {
      if (!projectId || !user?.id) {
        return 'viewer';
      }

      const { data, error } = await supabase
        .rpc('get_user_role', {
          p_user_id: user.id,
          p_project_id: projectId,
        });

      if (error) {
        console.error('Error fetching user role:', error);
        return 'viewer';
      }

      return (data as ProjectRole) || 'viewer';
    },
    enabled: !!projectId && !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useAssignUserRole() {
  const { user } = useAuth();

  const assignRole = async (projectId: string, role: ProjectRole = 'viewer') => {
    if (!user?.id) return null;

    const { data, error } = await supabase
      .from('user_roles')
      .upsert({
        user_id: user.id,
        project_id: projectId,
        role,
      }, {
        onConflict: 'user_id,project_id',
      })
      .select()
      .single();

    if (error) {
      console.error('Error assigning role:', error);
      return null;
    }

    return data;
  };

  return { assignRole };
}
