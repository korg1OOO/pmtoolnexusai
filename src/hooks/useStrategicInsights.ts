import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface StrategicInsight {
    id: string;
    project_id: string;
    type: 'context' | 'risk-discovery' | 'value-engineering';
    data: any;
    created_at: string;
    updated_at: string;
}

export const useStrategicInsights = (projectId?: string) => {
    return useQuery({
        queryKey: ["strategic_insights", projectId],
        queryFn: async () => {
            if (!projectId) return { context: null, riskDiscovery: null, valueEngineering: null };
            const { data, error } = await supabase
                .from("strategic_insights")
                .select("*")
                .eq("project_id", projectId);

            if (error) throw error;

            // Organize data by type for easier consumption
            const organizedData = {
                context: data?.find(i => i.type === 'context')?.data || null,
                riskDiscovery: data?.find(i => i.type === 'risk-discovery')?.data || null,
                valueEngineering: data?.find(i => i.type === 'value-engineering')?.data || null,
            };

            return organizedData;
        },
        enabled: !!projectId,
    });
};
