/**
 * Notification Analytics Service
 * Service for tracking and analyzing notification performance
 */

import { supabase } from '@/integrations/supabase/client';

export interface NotificationMetrics {
    total_sent: number;
    total_delivered: number;
    total_opened: number;
    total_clicked: number;
    total_bounced: number;
    delivery_rate: number;
    open_rate: number;
    click_rate: number;
    bounce_rate: number;
}

export interface ChannelPerformance {
    channel: string;
    metrics: NotificationMetrics;
}

export interface TemplatePerformance {
    template_key: string;
    template_name: string;
    metrics: NotificationMetrics;
}

export interface TimeSeriesData {
    date: string;
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
}

export const notificationAnalyticsService = {
    // Get overview metrics
    async getOverviewMetrics(startDate?: string, endDate?: string) {
        let query = supabase
            .from('notification_analytics')
            .select('*');

        if (startDate) query = query.gte('sent_at', startDate);
        if (endDate) query = query.lte('sent_at', endDate);

        const { data, error } = await query;
        if (error) throw error;

        // Calculate aggregated metrics
        const totalSent = data?.length || 0;
        const totalDelivered = data?.filter(n => n.delivered_at).length || 0;
        const totalOpened = data?.filter(n => n.opened_at).length || 0;
        const totalClicked = data?.filter(n => n.clicked_at).length || 0;
        const totalBounced = data?.filter(n => n.bounced_at).length || 0;

        return {
            total_sent: totalSent,
            total_delivered: totalDelivered,
            total_opened: totalOpened,
            total_clicked: totalClicked,
            total_bounced: totalBounced,
            delivery_rate: totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0,
            open_rate: totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0,
            click_rate: totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0,
            bounce_rate: totalSent > 0 ? (totalBounced / totalSent) * 100 : 0,
        } as NotificationMetrics;
    },

    // Get channel performance
    async getChannelPerformance(startDate?: string, endDate?: string) {
        let query = supabase
            .from('notification_analytics_summary')
            .select('*');

        if (startDate) query = query.gte('date', startDate);
        if (endDate) query = query.lte('date', endDate);

        const { data, error } = await query;
        if (error) throw error;

        // Group by channel
        const channelMap = new Map<string, any[]>();
        data?.forEach(row => {
            if (!channelMap.has(row.channel)) {
                channelMap.set(row.channel, []);
            }
            channelMap.get(row.channel)!.push(row);
        });

        const result: ChannelPerformance[] = [];
        channelMap.forEach((rows, channel) => {
            const totalSent = rows.reduce((sum, r) => sum + (r.total_sent || 0), 0);
            const totalDelivered = rows.reduce((sum, r) => sum + (r.total_delivered || 0), 0);
            const totalOpened = rows.reduce((sum, r) => sum + (r.total_opened || 0), 0);
            const totalClicked = rows.reduce((sum, r) => sum + (r.total_clicked || 0), 0);
            const totalBounced = rows.reduce((sum, r) => sum + (r.total_bounced || 0), 0);

            result.push({
                channel,
                metrics: {
                    total_sent: totalSent,
                    total_delivered: totalDelivered,
                    total_opened: totalOpened,
                    total_clicked: totalClicked,
                    total_bounced: totalBounced,
                    delivery_rate: totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0,
                    open_rate: totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0,
                    click_rate: totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0,
                    bounce_rate: totalSent > 0 ? (totalBounced / totalSent) * 100 : 0,
                },
            });
        });

        return result;
    },

    // Get template performance
    async getTemplatePerformance(startDate?: string, endDate?: string, limit = 10) {
        let query = supabase
            .from('notification_analytics_summary')
            .select('*');

        if (startDate) query = query.gte('date', startDate);
        if (endDate) query = query.lte('date', endDate);

        const { data, error } = await query;
        if (error) throw error;

        // Group by template
        const templateMap = new Map<string, any[]>();
        data?.forEach(row => {
            if (!templateMap.has(row.template_key)) {
                templateMap.set(row.template_key, []);
            }
            templateMap.get(row.template_key)!.push(row);
        });

        const result: TemplatePerformance[] = [];
        templateMap.forEach((rows, templateKey) => {
            const totalSent = rows.reduce((sum, r) => sum + (r.total_sent || 0), 0);
            const totalDelivered = rows.reduce((sum, r) => sum + (r.total_delivered || 0), 0);
            const totalOpened = rows.reduce((sum, r) => sum + (r.total_opened || 0), 0);
            const totalClicked = rows.reduce((sum, r) => sum + (r.total_clicked || 0), 0);
            const totalBounced = rows.reduce((sum, r) => sum + (r.total_bounced || 0), 0);

            result.push({
                template_key: templateKey,
                template_name: templateKey.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
                metrics: {
                    total_sent: totalSent,
                    total_delivered: totalDelivered,
                    total_opened: totalOpened,
                    total_clicked: totalClicked,
                    total_bounced: totalBounced,
                    delivery_rate: totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0,
                    open_rate: totalDelivered > 0 ? (totalOpened / totalDelivered) * 100 : 0,
                    click_rate: totalOpened > 0 ? (totalClicked / totalOpened) * 100 : 0,
                    bounce_rate: totalSent > 0 ? (totalBounced / totalSent) * 100 : 0,
                },
            });
        });

        // Sort by open rate and limit
        return result
            .sort((a, b) => b.metrics.open_rate - a.metrics.open_rate)
            .slice(0, limit);
    },

    // Get time series data
    async getTimeSeriesData(startDate?: string, endDate?: string) {
        let query = supabase
            .from('notification_analytics_summary')
            .select('*')
            .order('date', { ascending: true });

        if (startDate) query = query.gte('date', startDate);
        if (endDate) query = query.lte('date', endDate);

        const { data, error } = await query;
        if (error) throw error;

        // Group by date
        const dateMap = new Map<string, any[]>();
        data?.forEach(row => {
            const dateStr = row.date;
            if (!dateMap.has(dateStr)) {
                dateMap.set(dateStr, []);
            }
            dateMap.get(dateStr)!.push(row);
        });

        const result: TimeSeriesData[] = [];
        dateMap.forEach((rows, date) => {
            result.push({
                date,
                sent: rows.reduce((sum, r) => sum + (r.total_sent || 0), 0),
                delivered: rows.reduce((sum, r) => sum + (r.total_delivered || 0), 0),
                opened: rows.reduce((sum, r) => sum + (r.total_opened || 0), 0),
                clicked: rows.reduce((sum, r) => sum + (r.total_clicked || 0), 0),
            });
        });

        return result.sort((a, b) => a.date.localeCompare(b.date));
    },
};
