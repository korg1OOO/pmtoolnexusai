import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ChatChannel {
    id: string;
    project_id: string;
    name: string;
    type: 'public' | 'private' | 'dm';
    created_by?: string;
    created_at?: string;
}

export const useChatChannels = (projectId: string) => {
    return useQuery({
        queryKey: ["chat-channels", projectId],
        queryFn: async (): Promise<ChatChannel[]> => {
            if (!projectId) return [];

            try {
                const { data, error } = await (supabase as any)
                    .from("chat_channels")
                    .select("*")
                    .eq("project_id", projectId)
                    .order("name");

                if (error) {
                    console.error("Error fetching channels:", error);
                    return [];
                }
                return data || [];
            } catch (e) {
                console.warn("chat_channels table not available");
                return [];
            }
        },
        enabled: !!projectId
    });
};

export const useCreateChannel = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ projectId, name, type }: { projectId: string, name: string, type: 'public' | 'private' | 'dm' }) => {
            const { data, error } = await (supabase as any)
                .from("chat_channels")
                .insert({
                    project_id: projectId,
                    name,
                    type,
                    created_by: (await supabase.auth.getUser()).data.user?.id
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ["chat-channels", variables.projectId] });
            toast.success("Channel created");
        },
        onError: (e: Error) => {
            toast.error("Failed to create channel: " + e.message);
        }
    });
};
