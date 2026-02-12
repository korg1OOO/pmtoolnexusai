/**
 * AI Cost Optimization Analyzer
 * Identifies cost savings opportunities and model alternatives
 */

import { supabase } from '@/integrations/supabase/client';

// =============================================
// TYPES
// =============================================

export interface ModelAlternative {
    current_model: string;
    current_provider: string;
    alternative_model: string;
    alternative_provider: string;
    current_cost_per_request: number;
    alternative_cost_per_request: number;
    potential_savings_per_request: number;
    potential_monthly_savings: number;
    savings_percentage: number;
    performance_tradeoff: 'minimal' | 'moderate' | 'significant';
    recommendation: string;
}

export interface UsagePattern {
    pattern_type: string;
    description: string;
    current_cost: number;
    optimized_cost: number;
    savings: number;
    action_items: string[];
}

export interface CostOptimizationReport {
    total_monthly_cost: number;
    potential_savings: number;
    savings_percentage: number;
    model_alternatives: ModelAlternative[];
    usage_patterns: UsagePattern[];
    recommendations: string[];
    generated_at: string;
}

// =============================================
// MODEL COMPARISON DATABASE
// =============================================

const MODEL_ALTERNATIVES = {
    'openai/gpt-4': [
        {
            model: 'openai/gpt-4-turbo',
            performance_tradeoff: 'minimal' as const,
            use_case: 'Most GPT-4 tasks can use GPT-4 Turbo',
        },
        {
            model: 'anthropic/claude-3-opus',
            performance_tradeoff: 'minimal' as const,
            use_case: 'Complex reasoning and analysis',
        },
        {
            model: 'anthropic/claude-3-sonnet',
            performance_tradeoff: 'moderate' as const,
            use_case: 'Balanced performance and cost',
        },
    ],
    'openai/gpt-4-turbo': [
        {
            model: 'anthropic/claude-3-sonnet',
            performance_tradeoff: 'minimal' as const,
            use_case: 'Similar performance, lower cost',
        },
        {
            model: 'openai/gpt-3.5-turbo',
            performance_tradeoff: 'moderate' as const,
            use_case: 'Simple tasks and high volume',
        },
    ],
    'anthropic/claude-3-opus': [
        {
            model: 'anthropic/claude-3-sonnet',
            performance_tradeoff: 'minimal' as const,
            use_case: 'Most tasks work well with Sonnet',
        },
        {
            model: 'anthropic/claude-3-haiku',
            performance_tradeoff: 'moderate' as const,
            use_case: 'Fast responses and simple tasks',
        },
    ],
    'anthropic/claude-3-sonnet': [
        {
            model: 'anthropic/claude-3-haiku',
            performance_tradeoff: 'minimal' as const,
            use_case: 'Quick responses and lower cost',
        },
        {
            model: 'google/gemini-pro',
            performance_tradeoff: 'moderate' as const,
            use_case: 'Cost-effective alternative',
        },
    ],
};

// =============================================
// COST ANALYZER
// =============================================

export class CostOptimizationAnalyzer {
    /**
     * Generate comprehensive cost optimization report
     */
    static async generateReport(): Promise<CostOptimizationReport> {
        const [modelAlternatives, usagePatterns, totalCost] = await Promise.all([
            this.analyzeModelAlternatives(),
            this.analyzeUsagePatterns(),
            this.getTotalMonthlyCost(),
        ]);

        const potentialSavings =
            modelAlternatives.reduce((sum, alt) => sum + alt.potential_monthly_savings, 0) +
            usagePatterns.reduce((sum, pattern) => sum + pattern.savings, 0);

        const recommendations = this.generateRecommendations(
            modelAlternatives,
            usagePatterns,
            totalCost
        );

        return {
            total_monthly_cost: totalCost,
            potential_savings: potentialSavings,
            savings_percentage: (potentialSavings / totalCost) * 100,
            model_alternatives: modelAlternatives,
            usage_patterns: usagePatterns,
            recommendations,
            generated_at: new Date().toISOString(),
        };
    }

    /**
     * Analyze model alternatives for cost savings
     */
    static async analyzeModelAlternatives(): Promise<ModelAlternative[]> {
        // Get usage by model from current month
        const { data: usage, error } = await supabase
            .from('ai_cost_by_provider')
            .select('*');

        if (error || !usage) return [];

        // Get pricing data
        const { data: pricing } = await supabase
            .from('ai_provider_costs')
            .select('*');

        if (!pricing) return [];

        const alternatives: ModelAlternative[] = [];

        for (const providerUsage of usage) {
            const currentKey = `${providerUsage.provider}/${providerUsage.model || 'default'}`;
            const alternativeModels = MODEL_ALTERNATIVES[currentKey as keyof typeof MODEL_ALTERNATIVES];

            if (!alternativeModels) continue;

            for (const alt of alternativeModels) {
                const [altProvider, altModel] = alt.model.split('/');

                const currentPricing = pricing.find(
                    p => p.provider === providerUsage.provider && p.model === (providerUsage.model || 'default')
                );

                const altPricing = pricing.find(
                    p => p.provider === altProvider && p.model === altModel
                );

                if (!currentPricing || !altPricing) continue;

                const currentCost = providerUsage.avg_cost_per_request;
                const estimatedAltCost = this.estimateAlternativeCost(
                    providerUsage,
                    currentPricing,
                    altPricing
                );

                const savingsPerRequest = currentCost - estimatedAltCost;
                const monthlySavings = savingsPerRequest * providerUsage.request_count;

                if (monthlySavings > 0) {
                    alternatives.push({
                        current_model: providerUsage.model || 'default',
                        current_provider: providerUsage.provider,
                        alternative_model: altModel,
                        alternative_provider: altProvider,
                        current_cost_per_request: currentCost,
                        alternative_cost_per_request: estimatedAltCost,
                        potential_savings_per_request: savingsPerRequest,
                        potential_monthly_savings: monthlySavings,
                        savings_percentage: (savingsPerRequest / currentCost) * 100,
                        performance_tradeoff: alt.performance_tradeoff,
                        recommendation: alt.use_case,
                    });
                }
            }
        }

        return alternatives.sort((a, b) => b.potential_monthly_savings - a.potential_monthly_savings);
    }

    /**
     * Analyze usage patterns for optimization
     */
    static async analyzeUsagePatterns(): Promise<UsagePattern[]> {
        const patterns: UsagePattern[] = [];

        // Pattern 1: High error rate (wasted costs)
        const errorPattern = await this.analyzeErrorRate();
        if (errorPattern) patterns.push(errorPattern);

        // Pattern 2: Inefficient prompt sizes
        const promptPattern = await this.analyzePromptEfficiency();
        if (promptPattern) patterns.push(promptPattern);

        // Pattern 3: Batch opportunities
        const batchPattern = await this.analyzeBatchOpportunities();
        if (batchPattern) patterns.push(batchPattern);

        return patterns;
    }

    /**
     * Analyze error rates
     */
    static async analyzeErrorRate(): Promise<UsagePattern | null> {
        const { data: logs } = await supabase
            .from('ai_usage_logs')
            .select('success, cost_usd')
            .gte('created_at', this.getMonthStart());

        if (!logs) return null;

        const failedCosts = logs
            .filter(l => !l.success)
            .reduce((sum, l) => sum + l.cost_usd, 0);

        const errorRate = (logs.filter(l => !l.success).length / logs.length) * 100;

        if (errorRate > 5) {
            return {
                pattern_type: 'high_error_rate',
                description: `${errorRate.toFixed(1)}% of requests are failing`,
                current_cost: failedCosts,
                optimized_cost: 0,
                savings: failedCosts,
                action_items: [
                    'Implement retry logic with exponential backoff',
                    'Add input validation before API calls',
                    'Monitor rate limits and implement queuing',
                ],
            };
        }

        return null;
    }

    /**
     * Analyze prompt efficiency
     */
    static async analyzePromptEfficiency(): Promise<UsagePattern | null> {
        const { data: logs } = await supabase
            .from('ai_usage_logs')
            .select('prompt_tokens, completion_tokens, cost_usd')
            .gte('created_at', this.getMonthStart());

        if (!logs) return null;

        const avgRatio = logs.reduce((sum, l) =>
            sum + (l.prompt_tokens / (l.prompt_tokens + l.completion_tokens)), 0
        ) / logs.length;

        // If prompts are >70% of tokens, there's inefficiency
        if (avgRatio > 0.7) {
            const estimatedSavings = logs.reduce((sum, l) => sum + l.cost_usd, 0) * 0.3;

            return {
                pattern_type: 'inefficient_prompts',
                description: 'Prompts are using excessive tokens',
                current_cost: logs.reduce((sum, l) => sum + l.cost_usd, 0),
                optimized_cost: logs.reduce((sum, l) => sum + l.cost_usd, 0) - estimatedSavings,
                savings: estimatedSavings,
                action_items: [
                    'Optimize prompt templates for conciseness',
                    'Remove redundant instructions',
                    'Use few-shot examples more efficiently',
                    'Consider fine-tuning for repeated tasks',
                ],
            };
        }

        return null;
    }

    /**
     * Analyze batch opportunities
     */
    static async analyzeBatchOpportunities(): Promise<UsagePattern | null> {
        // Check for small, frequent requests that could be batched
        const { data: logs } = await supabase
            .from('ai_usage_logs')
            .select('total_tokens, cost_usd, created_at')
            .gte('created_at', this.getMonthStart())
            .order('created_at');

        if (!logs) return null;

        const smallRequests = logs.filter(l => l.total_tokens < 500);
        const batchableCount = smallRequests.length;

        if (batchableCount > 100) {
            const currentCost = smallRequests.reduce((sum, l) => sum + l.cost_usd, 0);
            const estimatedSavings = currentCost * 0.4; // ~40% savings from batching

            return {
                pattern_type: 'batch_opportunities',
                description: `${batchableCount} small requests could be batched`,
                current_cost: currentCost,
                optimized_cost: currentCost - estimatedSavings,
                savings: estimatedSavings,
                action_items: [
                    'Implement request batching for small operations',
                    'Use background job queues for non-urgent tasks',
                    'Combine multiple small prompts into single requests',
                ],
            };
        }

        return null;
    }

    /**
     * Generate recommendations
     */
    static generateRecommendations(
        alternatives: ModelAlternative[],
        patterns: UsagePattern[],
        totalCost: number
    ): string[] {
        const recommendations: string[] = [];

        // Top model alternatives
        if (alternatives.length > 0) {
            const topAlt = alternatives[0];
            recommendations.push(
                `💡 Switch from ${topAlt.current_provider}/${topAlt.current_model} to ` +
                `${topAlt.alternative_provider}/${topAlt.alternative_model} to save ` +
                `$${topAlt.potential_monthly_savings.toFixed(2)}/month (${topAlt.savings_percentage.toFixed(1)}%)`
            );
        }

        // Usage patterns
        patterns.forEach(pattern => {
            recommendations.push(
                `🔧 ${pattern.description}: Potential savings of $${pattern.savings.toFixed(2)}/month`
            );
        });

        // Budget recommendations
        if (totalCost > 5000) {
            recommendations.push(
                `📊 Consider setting department-level budgets to distribute the $${totalCost.toFixed(2)} monthly cost`
            );
        }

        // General best practices
        recommendations.push(
            '⚙️ Implement caching for repeated queries to reduce API calls',
            '🎯 Use streaming responses for long-form content to improve UX',
            '📈 Monitor cost trends weekly to catch anomalies early'
        );

        return recommendations;
    }

    /**
     * Helper: Estimate alternative model cost
     */
    static estimateAlternativeCost(
        usage: any,
        currentPricing: any,
        altPricing: any
    ): number {
        const avgPromptTokens = usage.total_tokens / usage.request_count * 0.3; // Estimate 30% prompt
        const avgCompletionTokens = usage.total_tokens / usage.request_count * 0.7;

        return (
            avgPromptTokens * altPricing.prompt_token_cost +
            avgCompletionTokens * altPricing.completion_token_cost
        );
    }

    /**
     * Helper: Get total monthly cost
     */
    static async getTotalMonthlyCost(): Promise<number> {
        const { data } = await supabase
            .from('ai_usage_logs')
            .select('cost_usd')
            .gte('created_at', this.getMonthStart());

        return data?.reduce((sum, l) => sum + l.cost_usd, 0) || 0;
    }

    /**
     * Helper: Get month start date
     */
    static getMonthStart(): string {
        const date = new Date();
        date.setDate(1);
        date.setHours(0, 0, 0, 0);
        return date.toISOString();
    }
}
