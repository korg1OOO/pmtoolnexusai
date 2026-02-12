/**
 * Cost Optimization Hook
 * React hook for accessing cost optimization insights
 */

import { useQuery } from '@tanstack/react-query';
import { CostOptimizationAnalyzer, CostOptimizationReport } from '@/lib/ai-cost-optimizer';

export function useCostOptimization() {
    return useQuery({
        queryKey: ['cost-optimization'],
        queryFn: async () => {
            return CostOptimizationAnalyzer.generateReport();
        },
        // Refresh every 5 minutes (expensive query)
        refetchInterval: 300000,
        staleTime: 240000, // 4 minutes
    });
}

export function useModelAlternatives() {
    return useQuery({
        queryKey: ['model-alternatives'],
        queryFn: async () => {
            return CostOptimizationAnalyzer.analyzeModelAlternatives();
        },
        refetchInterval: 300000,
    });
}
