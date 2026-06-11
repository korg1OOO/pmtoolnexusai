import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { ProjectNode } from '@/types/project-hierarchy';

export const useProjectHierarchy = (megaProjectId: string) => {
  return useQuery({
    queryKey: ['project-hierarchy', megaProjectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('project_nodes')
        .select('*')
        .eq('mega_project_id', megaProjectId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Converte flat list para árvore recursiva
      const buildTree = (nodes: any[], parentId: string | null = null): ProjectNode[] => {
        return nodes
          .filter(node => node.parent_id === parentId)
          .map(node => ({
            ...node,
            children: buildTree(nodes, node.id),
            tasks: [], // por enquanto vazio, vamos conectar actions depois
          }));
      };

      return buildTree(data || []);
    },
    enabled: !!megaProjectId,
  });
};