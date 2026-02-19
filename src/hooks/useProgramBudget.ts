import { useQuery } from '@tanstack/react-query';
import { supabase as _supabase } from '@/integrations/supabase/client';

const supabase = _supabase as any;

export interface ProjectBudgetRow {
    project_id: string;
    project_name: string;
    allocated: number;
    spent: number;
    forecast: number;
    variance: number;
}

export interface CostBreakdownRow {
    category: string;
    amount: number;
    actual: number;
}

export interface SpendTrendRow {
    month: string;
    budget: number;
    actual: number;
    forecast: number;
}

export interface ProgramBudgetResult {
    total_budget: number;
    total_spent: number;
    total_forecast: number;
    total_variance: number;
    projects: ProjectBudgetRow[];
    costBreakdown: CostBreakdownRow[];
    spendTrend: SpendTrendRow[];
}

async function fetchProgramBudget(programId: string): Promise<ProgramBudgetResult> {
    // 1. Get program itself
    const { data: program } = await supabase
        .from('programs')
        .select('id, name, budget, spent')
        .eq('id', programId)
        .single();

    // 2. Get projects in this program
    const { data: projects = [] } = await supabase
        .from('projects')
        .select('id, name, budget, spent, progress')
        .eq('program_id', programId);

    // 3. Get all budget items for these projects
    const projectIds = projects.map((p: any) => p.id);
    let budgetItems: any[] = [];
    if (projectIds.length > 0) {
        const { data: items = [] } = await supabase
            .from('project_budget_items')
            .select('project_id, name, category, budgeted_amount, actual_amount')
            .in('project_id', projectIds);
        budgetItems = items;
    }

    // Build per-project rows
    const projectRows: ProjectBudgetRow[] = projects.map((p: any) => {
        const items = budgetItems.filter((b: any) => b.project_id === p.id);
        const allocated = items.reduce((s: number, b: any) => s + (b.budgeted_amount || 0), 0) || p.budget || 0;
        const spent = items.reduce((s: number, b: any) => s + (b.actual_amount || 0), 0) || p.spent || 0;
        // Simple linear forecast: extrapolate spent by progress
        const progress = p.progress || 0;
        const forecast = progress > 0 ? Math.round(spent / (progress / 100)) : allocated;
        const variance = allocated - forecast;
        return {
            project_id: p.id,
            project_name: p.name,
            allocated,
            spent,
            forecast,
            variance,
        };
    });

    // Cost breakdown by category across all projects
    const catMap = new Map<string, { amount: number; actual: number }>();
    for (const item of budgetItems) {
        const cat = item.category || 'other';
        const cur = catMap.get(cat) || { amount: 0, actual: 0 };
        cur.amount += item.budgeted_amount || 0;
        cur.actual += item.actual_amount || 0;
        catMap.set(cat, cur);
    }
    const costBreakdown: CostBreakdownRow[] = Array.from(catMap.entries()).map(([category, v]) => ({
        category: category.charAt(0).toUpperCase() + category.slice(1),
        amount: v.amount,
        actual: v.actual,
    }));

    // Spend trend: generate 6 monthly buckets from program start to today
    const totalBudget = program?.budget || projectRows.reduce((s, p) => s + p.allocated, 0);
    const totalSpent = program?.spent || projectRows.reduce((s, p) => s + p.spent, 0);
    const totalForecast = projectRows.reduce((s, p) => s + p.forecast, 0) || totalBudget;

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const spendTrend: SpendTrendRow[] = months.map((m, i) => {
        const fraction = (i + 1) / 6;
        return {
            month: m,
            budget: Math.round(totalBudget * fraction),
            actual: Math.round(totalSpent * Math.min(fraction, 1)),
            forecast: Math.round(totalForecast * fraction),
        };
    });

    return {
        total_budget: totalBudget,
        total_spent: totalSpent,
        total_forecast: totalForecast,
        total_variance: totalBudget - totalForecast,
        projects: projectRows,
        costBreakdown,
        spendTrend,
    };
}

export function useProgramBudget(programId: string | null | undefined) {
    return useQuery({
        queryKey: ['program-budget-live', programId],
        queryFn: () => fetchProgramBudget(programId!),
        enabled: !!programId,
    });
}
