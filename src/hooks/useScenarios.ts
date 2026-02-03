import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Scenario {
    id: string;
    project_id: string;
    name: string;
    description: string;
    data: any;
    created_at: string;
    updated_at: string;
}

export const useScenarios = (projectId?: string) => {
    return useQuery({
        queryKey: ["scenarios", projectId],
        queryFn: async () => {
            if (!projectId) return [];
            const { data, error } = await supabase
                .from("scenarios")
                .select("*")
                .eq("project_id", projectId)
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data as Scenario[];
        },
        enabled: !!projectId,
    });
};
