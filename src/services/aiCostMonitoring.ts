/**
 * Weekly AI Cost Review Scheduler
 * Automated weekly cost optimization reports
 */

import { CostOptimizationAnalyzer, CostOptimizationReport } from '@/lib/ai-cost-optimizer';
import { supabase as _supabase } from '@/integrations/supabase/client';
const supabase = _supabase as any;

export interface WeeklyReviewReport {
    week_start: string;
    week_end: string;
    generated_at: string;
    optimization_report: CostOptimizationReport;
    implemented_recommendations: string[];
    notes?: string;
}

export class WeeklyReviewScheduler {
    /**
     * Generate and save weekly review
     */
    static async generateWeeklyReview(): Promise<WeeklyReviewReport> {
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);

        const report = await CostOptimizationAnalyzer.generateReport();

        const review: WeeklyReviewReport = {
            week_start: weekStart.toISOString(),
            week_end: now.toISOString(),
            generated_at: now.toISOString(),
            optimization_report: report,
            implemented_recommendations: [],
        };

        // Save to database
        await this.saveReview(review);

        // Send notifications if significant savings found
        if (report.potential_savings > 100) {
            await this.sendNotification(report);
        }

        return review;
    }

    /**
     * Save review to database
     */
    private static async saveReview(review: WeeklyReviewReport) {
        try {
            const { error } = await supabase
                .from('ai_cost_reviews')
                .insert({
                    week_start: review.week_start,
                    week_end: review.week_end,
                    report_data: review.optimization_report,
                    implemented_recommendations: review.implemented_recommendations,
                });

            if (error) console.error('Failed to save review:', error);
        } catch (error) {
            console.error('Error saving review:', error);
        }
    }

    /**
     * Send notification about optimization opportunities
     */
    private static async sendNotification(report: CostOptimizationReport) {
        try {
            const topRecommendations = report.recommendations.slice(0, 3);

            // Log admin activity
            await supabase.rpc('log_admin_activity', {
                p_activity_type: 'ai_cost_review',
                p_resource_type: 'cost_optimization',
                p_resource_id: null,
                p_action: 'weekly_review_generated',
                p_details: {
                    potential_savings: report.potential_savings,
                    savings_percentage: report.savings_percentage,
                    top_recommendations: topRecommendations,
                },
            });

            console.log('📊 Weekly AI Cost Review:', {
                potential_savings: `$${report.potential_savings.toFixed(2)}`,
                percentage: `${report.savings_percentage.toFixed(1)}%`,
                top_recommendations: topRecommendations,
            });
        } catch (error) {
            console.error('Failed to send notification:', error);
        }
    }

    /**
     * Get all weekly reviews
     */
    static async getReviews(limit: number = 10) {
        const { data, error } = await supabase
            .from('ai_cost_reviews')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data;
    }

    /**
     * Mark recommendation as implemented
     */
    static async markImplemented(reviewId: string, recommendation: string) {
        const { data: review } = await supabase
            .from('ai_cost_reviews')
            .select('implemented_recommendations')
            .eq('id', reviewId)
            .single();

        if (!review) return;

        const implemented = [...(review.implemented_recommendations || []), recommendation];

        await supabase
            .from('ai_cost_reviews')
            .update({ implemented_recommendations: implemented })
            .eq('id', reviewId);
    }
}

// =============================================
// RECOMMENDATION IMPLEMENTATION TRACKER
// =============================================

export class RecommendationTracker {
    /**
     * Get minimal-impact alternatives ready for implementation
     */
    static async getMinimalImpactAlternatives() {
        const report = await CostOptimizationAnalyzer.generateReport();

        return report.model_alternatives.filter(
            alt => alt.performance_tradeoff === 'minimal' && alt.potential_monthly_savings > 50
        );
    }

    /**
     * Implement model switch recommendation
     */
    static async implementModelSwitch(
        currentProvider: string,
        currentModel: string,
        newProvider: string,
        newModel: string
    ) {
        // Log the change
        await supabase.rpc('log_admin_activity', {
            p_activity_type: 'model_switch',
            p_resource_type: 'ai_configuration',
            p_resource_id: null,
            p_action: 'model_updated',
            p_details: {
                from: `${currentProvider}/${currentModel}`,
                to: `${newProvider}/${newModel}`,
                reason: 'cost_optimization',
            },
        });

        console.log(`✅ Model switched: ${currentProvider}/${currentModel} → ${newProvider}/${newModel}`);
    }

    /**
     * Track implemented optimizations
     */
    static async trackImplementation(
        optimizationType: string,
        description: string,
        estimatedSavings: number
    ) {
        await supabase.from('ai_optimizations').insert({
            optimization_type: optimizationType,
            description,
            estimated_savings: estimatedSavings,
            implementation_date: new Date().toISOString(),
            status: 'active',
        });
    }
}

// =============================================
// BUDGET MONITORING
// =============================================

export class BudgetMonitor {
    /**
     * Check budget and send alerts
     */
    static async checkAndAlert() {
        const { data: budgets } = await supabase
            .from('ai_budget_status')
            .select('*')
            .in('status', ['warning', 'exceeded']);

        if (!budgets || budgets.length === 0) return;

        for (const budget of budgets) {
            await this.sendBudgetAlert(budget);
        }
    }

    /**
     * Send budget alert
     */
    private static async sendBudgetAlert(budget: any) {
        const severity = budget.status === 'exceeded' ? 'critical' : 'warning';

        await supabase.rpc('log_admin_activity', {
            p_activity_type: 'budget_alert',
            p_resource_type: 'ai_budget',
            p_resource_id: budget.budget_id,
            p_action: severity === 'critical' ? 'budget_exceeded' : 'budget_warning',
            p_details: {
                budget_name: budget.budget_name,
                spent: budget.spent_usd,
                limit: budget.limit_usd,
                utilization: budget.utilization,
            },
        });

        console.warn(`⚠️ ${severity.toUpperCase()}: ${budget.budget_name}`, {
            spent: `$${budget.spent_usd.toFixed(2)}`,
            limit: `$${budget.limit_usd.toFixed(2)}`,
            utilization: `${(budget.utilization * 100).toFixed(1)}%`,
        });
    }

    /**
     * Get current month spending summary
     */
    static async getSpendingSummary() {
        const { data: usage } = await supabase
            .from('ai_cost_by_provider')
            .select('*');

        const { data: budgets } = await supabase
            .from('ai_budget_status')
            .select('*');

        return {
            total_spent: usage?.reduce((sum, u) => sum + u.total_cost, 0) || 0,
            by_provider: usage || [],
            budgets: budgets || [],
        };
    }
}
