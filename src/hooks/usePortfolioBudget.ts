import { useQuery } from '@tanstack/react-query';
import { supabase as _supabase } from '@/integrations/supabase/client';

const supabase = _supabase as any;

export interface ProgramBudgetSummary {
    program_id: string;
    program_name: string;
    allocated: number;
    spent: number;
    roi: number; // estimated 70% return multiplier for demo
}

export interface PortfolioBudgetResult {
    total_budget: number;
    total_spent: number;
    total_remaining: number;
    expected_roi: number;
    programs: ProgramBudgetSummary[];
    spendTrend: { month: string; budget: number; actual: number }[];
}

async function fetchPortfolioBudget(portfolioId: string): Promise<PortfolioBudgetResult> {
    const { data: programs = [] } = await supabase
        .from('programs')
        .select('id, name, budget, spent')
        .eq('portfolio_id', portfolioId)
        .eq('is_active', true);

    const total_budget = programs.reduce((s: number, p: any) => s + (p.budget || 0), 0);
    const total_spent = programs.reduce((s: number, p: any) => s + (p.spent || 0), 0);
    const total_remaining = total_budget - total_spent;

    const programRows: ProgramBudgetSummary[] = programs.map((p: any) => ({
        program_id: p.id,
        program_name: p.name,
        allocated: p.budget || 0,
        spent: p.spent || 0,
        roi: Math.round((p.budget || 0) * 1.7), // 70% ROI assumption for planning
    }));

    const expected_roi = programRows.reduce((s, p) => s + p.roi, 0);

    // Spend trend buckets (6 months)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const spendTrend = months.map((m, i) => {
        const fraction = (i + 1) / 6;
        return {
            month: m,
            budget: Math.round(total_budget * fraction),
            actual: Math.round(total_spent * Math.min(fraction, 1)),
        };
    });

    return {
        total_budget,
        total_spent,
        total_remaining,
        expected_roi,
        programs: programRows,
        spendTrend,
    };
}

export function usePortfolioBudget(portfolioId: string | null | undefined) {
    return useQuery({
        queryKey: ['portfolio-budget-live', portfolioId],
        queryFn: () => fetchPortfolioBudget(portfolioId!),
        enabled: !!portfolioId,
    });
}
