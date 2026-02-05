import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { toast } from "sonner";

export type ChatChannel = Database["public"]["Tables"]["chat_channels"]["Row"];

export const useChatChannels = (projectId: string) => {
    return useQuery({
        queryKey: ["chat-channels", projectId],
        queryFn: async () => {
            if (!projectId) return [];

            // Fetch public channels and channels where user is a member
            // RLS handles the security, but we need to ensure we select right ones UI-wise
            const { data, error } = await supabase
                .from("chat_channels")
                .select("*")
                .eq("project_id", projectId)
                .order("name");

            if (error) {
                console.error("Error fetching channels:", error);
                // Return empty if error (table might not exist yet if migration not run)
                return [];
            }
            return data;
        },
        enabled: !!projectId
    });
};

export const useCreateChannel = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ projectId, name, type }: { projectId: string, name: string, type: 'public' | 'private' | 'dm' }) => {
            const { data, error } = await supabase
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
        onError: (e) => {
            toast.error("Failed to create channel: " + e.message);
        }
    });
};
