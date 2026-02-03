import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

export interface TraceabilityLink {
    id: string;
    projectId: string;
    sourceId: string;
    sourceType: string;
    targetId: string;
    targetType: string;
    relationshipType: string;
}

export interface TraceabilityItem {
    id: string;
    type: 'sprint' | 'issue' | 'action' | 'decision' | 'risk' | 'meeting' | 'task';
    title: string;
    status: string;
    linkedTo: { type: string; id: string; title: string }[];
}

export const useTraceability = (projectId?: string) => {
    return useQuery({
        queryKey: ["traceability", projectId],
        queryFn: async () => {
            if (!projectId) return [];

            // Fetch links
            const { data: links, error: linksError } = await supabase
                .from("traceability_matrix")
                .select("*")
                .eq("project_id", projectId);

            if (linksError) throw linksError;

            // Fetch all potential entities
            const [
                { data: sprints },
                { data: issues },
                { data: actions },
                { data: decisions },
                { data: risks },
                { data: meetings },
                { data: tasks },
            ] = await Promise.all([
                supabase.from("sprints").select("id, name, status").eq("project_id", projectId),
                supabase.from("issues").select("id, title, status").eq("project_id", projectId),
                supabase.from("actions").select("id, title, status, project_id").eq("project_id", projectId),
                supabase.from("decisions").select("id, title, status, project_id").eq("project_id", projectId),
                supabase.from("risks").select("id, title, status").eq("project_id", projectId),
                supabase.from("meetings").select("id, title, status").eq("project_id", projectId),
                supabase.from("tasks").select("id, name, status").eq("project_id", projectId),
            ]);

            // Helper to find title and status
            const getEntityInfo = (id: string, type: string) => {
                switch (type) {
                    case 'sprint': return { title: sprints?.find(s => s.id === id)?.name || id, status: sprints?.find(s => s.id === id)?.status || 'unknown' };
                    case 'issue': return { title: issues?.find(i => i.id === id)?.title || id, status: issues?.find(i => i.id === id)?.status || 'unknown' };
                    case 'action': return { title: actions?.find(a => a.id === id)?.title || id, status: actions?.find(a => a.id === id)?.status || 'unknown' };
                    case 'decision': return { title: decisions?.find(d => d.id === id)?.title || id, status: decisions?.find(d => d.id === id)?.status || 'unknown' };
                    case 'risk': return { title: risks?.find(r => r.id === id)?.title || id, status: risks?.find(r => r.id === id)?.status || 'unknown' };
                    case 'meeting': return { title: meetings?.find(m => m.id === id)?.title || id, status: meetings?.find(m => m.id === id)?.status || 'unknown' };
                    case 'task': return { title: tasks?.find(t => t.id === id)?.name || id, status: tasks?.find(t => t.id === id)?.status || 'unknown' };
                    default: return { title: id, status: 'unknown' };
                }
            };

            // Collect all entities that have links
            const entityIds = new Set<string>();
            links.forEach(link => {
                entityIds.add(`${link.source_type}:${link.source_id}`);
                entityIds.add(`${link.target_type}:${link.target_id}`);
            });

            const result: TraceabilityItem[] = [];

            entityIds.forEach(compositeId => {
                const [type, id] = compositeId.split(':');
                const info = getEntityInfo(id, type);

                const linkedTo = links
                    .filter(link =>
                        (link.source_id === id && link.source_type === type) ||
                        (link.target_id === id && link.target_type === type)
                    )
                    .map(link => {
                        const isSource = link.source_id === id && link.source_type === type;
                        const targetId = isSource ? link.target_id : link.source_id;
                        const targetType = isSource ? link.target_type : link.source_type;
                        const targetInfo = getEntityInfo(targetId, targetType);

                        return {
                            type: targetType,
                            id: targetId,
                            title: targetInfo.title
                        };
                    });

                result.push({
                    id,
                    type: type as any,
                    title: info.title,
                    status: info.status,
                    linkedTo
                });
            });

            return result;
        },
    });
};
