import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { ProjectContext, AIRiskDiscovery, ValueEngineering } from "@/types/ai-pm";

export interface StrategicInsight {
    id: string;
    project_id: string;
    type: 'context' | 'risk-discovery' | 'value-engineering';
    data: any;
    created_at: string;
    updated_at: string;
}

export interface StrategicData {
    context: ProjectContext | null;
    riskDiscovery: AIRiskDiscovery | null;
    valueEngineering: ValueEngineering | null;
}

export const useStrategicInsights = (projectId?: string) => {
    return useQuery({
        queryKey: ["strategic_insights", projectId],
        queryFn: async (): Promise<StrategicData> => {
            if (!projectId) return { context: null, riskDiscovery: null, valueEngineering: null };
            // @ts-ignore
            const { data, error } = await supabase
                .from("strategic_insights")
                .select("*")
                .eq("project_id", projectId);

            if (error) throw error;

            // Organize data by type for easier consumption
            const organizedData = {
                context: (data?.find(i => i.type === 'context')?.data as unknown as ProjectContext) || null,
                riskDiscovery: (data?.find(i => i.type === 'risk-discovery')?.data as unknown as AIRiskDiscovery) || null,
                valueEngineering: (data?.find(i => i.type === 'value-engineering')?.data as unknown as ValueEngineering) || null,
            };

            return organizedData;
        },
        enabled: !!projectId,
    });
};
