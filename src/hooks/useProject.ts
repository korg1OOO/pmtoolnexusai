import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useProject = (projectId?: string) => {
    return useQuery({
        queryKey: ["project", projectId],
        queryFn: async () => {
            if (!projectId) return null;

            const { data, error } = await supabase
                .from("projects")
                .select("*")
                .eq("id", projectId)
                .single();

            if (error) throw error;
            return data;
        },
        enabled: !!projectId,
    });
};
