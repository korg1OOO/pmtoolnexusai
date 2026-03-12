import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase as _supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
const supabase = _supabase as any;
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

export interface TraceabilityAvailableItem {
    id: string;
    type: 'sprint' | 'issue' | 'action' | 'decision' | 'risk' | 'meeting' | 'task' | 'deliverable' | 'milestone' | 'backlog_item';
    title: string;
    status: string;
}

export interface TraceabilityItem {
    id: string;
    type: 'sprint' | 'issue' | 'action' | 'decision' | 'risk' | 'meeting' | 'task' | 'deliverable' | 'milestone' | 'backlog_item';
    title: string;
    status: string;
    linkedTo: { type: string; id: string; title: string }[];
}

export const useTraceability = (projectId?: string) => {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ["traceability", projectId],
        queryFn: async (): Promise<{ linkedItems: TraceabilityItem[], availableItems: TraceabilityAvailableItem[] }> => {
            if (!projectId) return { linkedItems: [], availableItems: [] };

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
                { data: deliverables },
                { data: milestones },
                { data: backlog_items },
            ] = await Promise.all([
                supabase.from("sprints").select("id, name, status").eq("project_id", projectId),
                supabase.from("issues").select("id, title, status").eq("project_id", projectId),
                supabase.from("actions").select("id, title, status, project_id").eq("project_id", projectId),
                supabase.from("decisions").select("id, title, status, project_id").eq("project_id", projectId),
                supabase.from("risks").select("id, title, status").eq("project_id", projectId),
                supabase.from("meetings").select("id, title, status").eq("project_id", projectId),
                supabase.from("tasks").select("id, name, status").eq("project_id", projectId),
                supabase.from("deliverables").select("id, name, status").eq("project_id", projectId),
                supabase.from("project_milestones").select("id, name, status").eq("project_id", projectId),
                supabase.from("backlog_items").select("id, title, status").eq("project_id", projectId),
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
                    case 'deliverable': return { title: deliverables?.find(d => d.id === id)?.name || id, status: deliverables?.find(d => d.id === id)?.status || 'unknown' };
                    case 'milestone': return { title: milestones?.find(m => m.id === id)?.name || id, status: milestones?.find(m => m.id === id)?.status || 'unknown' };
                    case 'backlog_item': return { title: backlog_items?.find(b => b.id === id)?.title || id, status: backlog_items?.find(b => b.id === id)?.status || 'unknown' };
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
                    type: type as TraceabilityItem['type'],
                    title: info.title,
                    status: info.status,
                    linkedTo
                });
            });

            const availableItems: TraceabilityAvailableItem[] = [];

            const addAvailable = (list: any[] | null, type: TraceabilityAvailableItem['type'], getTitle: (item: any) => string) => {
                if (!list) return;
                list.forEach(item => {
                    availableItems.push({
                        id: item.id,
                        type,
                        title: getTitle(item),
                        status: item.status || 'unknown'
                    });
                });
            };

            addAvailable(sprints, 'sprint', s => s.name);
            addAvailable(issues, 'issue', i => i.title);
            addAvailable(actions, 'action', a => a.title);
            addAvailable(decisions, 'decision', d => d.title);
            addAvailable(risks, 'risk', r => r.title);
            addAvailable(meetings, 'meeting', m => m.title);
            addAvailable(tasks, 'task', t => t.name);
            addAvailable(deliverables, 'deliverable', d => d.name);
            addAvailable(milestones, 'milestone', m => m.name);
            addAvailable(backlog_items, 'backlog_item', b => b.title);

            return { linkedItems: result, availableItems };
        },
    });

    const createLink = useMutation({
        mutationFn: async (link: { sourceId: string; sourceType: string; targetId: string; targetType: string; relationshipType: string }) => {
            if (!projectId) throw new Error("Project ID is required");
            const { data, error } = await supabase
                .from("traceability_matrix")
                .insert([{
                    project_id: projectId,
                    source_id: link.sourceId,
                    source_type: link.sourceType,
                    target_id: link.targetId,
                    target_type: link.targetType,
                    relationship_type: link.relationshipType
                }]);

            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["traceability", projectId] });
            toast.success("Relationship linked successfully");
        },
        onError: (err: any) => {
            toast.error(err.message || "Failed to link items");
        }
    });

    const removeLink = useMutation({
        mutationFn: async ({ sourceId, targetId }: { sourceId: string; targetId: string }) => {
            if (!projectId) throw new Error("Project ID is required");
            const { error } = await supabase
                .from("traceability_matrix")
                .delete()
                .match({ project_id: projectId, source_id: sourceId, target_id: targetId });

            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["traceability", projectId] });
            toast.success("Relationship removed");
        }
    });

    return {
        ...query,
        createLink,
        removeLink
    };
};
