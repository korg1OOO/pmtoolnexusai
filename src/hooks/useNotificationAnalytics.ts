/**
 * Notification Analytics Hooks
 */

import { useQuery } from '@tanstack/react-query';
import { notificationAnalyticsService } from '@/services/notificationAnalyticsService';

export function useNotificationMetrics(startDate?: string, endDate?: string) {
    return useQuery({
        queryKey: ['notification-metrics', startDate, endDate],
        queryFn: () => notificationAnalyticsService.getOverviewMetrics(startDate, endDate),
    });
}

export function useChannelPerformance(startDate?: string, endDate?: string) {
    return useQuery({
        queryKey: ['channel-performance', startDate, endDate],
        queryFn: () => notificationAnalyticsService.getChannelPerformance(startDate, endDate),
    });
}

export function useTemplatePerformance(startDate?: string, endDate?: string, limit?: number) {
    return useQuery({
        queryKey: ['template-performance', startDate, endDate, limit],
        queryFn: () => notificationAnalyticsService.getTemplatePerformance(startDate, endDate, limit),
    });
}

export function useNotificationTimeSeries(startDate?: string, endDate?: string) {
    return useQuery({
        queryKey: ['notification-timeseries', startDate, endDate],
        queryFn: () => notificationAnalyticsService.getTimeSeriesData(startDate, endDate),
    });
}
