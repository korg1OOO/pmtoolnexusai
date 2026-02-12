/**
 * React hooks for AI cost monitoring and optimization
 */

import { useQuery } from '@tantml:function_query';
import {
    WeeklyReviewScheduler,
    RecommendationTracker,
    BudgetMonitor,
} from '@/services/aiCostMonitoring';

/**
 * Get weekly reviews
 */
export function useWeeklyReviews(limit: number = 10) {
    return useQuery({
        queryKey: ['weekly-reviews', limit],
        queryFn: () => WeeklyReviewScheduler.getReviews(limit),
        refetchInterval: 3600000, // 1 hour
    });
}

/**
 * Get minimal impact alternatives ready to implement
 */
export function useMinimalImpactAlternatives() {
    return useQuery({
        queryKey: ['minimal-impact-alternatives'],
        queryFn: () => RecommendationTracker.getMinimalImpactAlternatives(),
        refetchInterval: 300000, // 5 minutes
    });
}

/**
 * Get spending summary
 */
export function useSpendingSummary() {
    return useQuery({
        queryKey: ['spending-summary'],
        queryFn: () => BudgetMonitor.getSpendingSummary(),
        refetchInterval: 60000, // 1 minute
    });
}

/**
 * Budget status with real-time alerts
 */
export function useBudgetAlerts() {
    return useQuery({
        queryKey: ['budget-alerts'],
        queryFn: async () => {
            // Check and send alerts
            await BudgetMonitor.checkAndAlert();
            // Return summary
            return BudgetMonitor.getSpendingSummary();
        },
        refetchInterval: 30000, // 30 seconds (for real-time alerts)
    });
}
