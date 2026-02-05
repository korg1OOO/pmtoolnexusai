import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MonthlyFinancials {
    month: string;
    actual: number;
    projected: number;
}

export function useOrgFinancials() {
    return useQuery({
        queryKey: ['org_financials'],
        queryFn: async () => {
            try {
                // Fetch all invoices visible to user
                const { data: invoices, error: invError } = await supabase
                    .from('project_invoices')
                    .select('amount, due_date, status');

                if (invError) throw invError;

                // Group by month
                const months: Record<string, number> = {};
                const now = new Date();

                // Initialize last 12 months with 0
                for (let i = 11; i >= 0; i--) {
                    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    const key = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                    months[key] = 0;
                }

                (invoices || []).forEach((inv: any) => {
                    if (inv.status === 'paid' || inv.status === 'sent') {
                        const d = new Date(inv.due_date || inv.created_at);
                        const key = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                        if (months[key] !== undefined) {
                            months[key] += Number(inv.amount) || 0;
                        }
                    }
                });

                const trendData = Object.entries(months).map(([month, actual]) => ({
                    month: month.split(' ')[0],
                    fullMonth: month,
                    actual,
                    budget: 0
                }));

                // Fetch total budget
                const { data: budgetItems } = await supabase
                    .from('project_budget_items')
                    .select('budgeted_amount');

                const totalBudget = (budgetItems || []).reduce((sum, item: any) => sum + (Number(item.budgeted_amount) || 0), 0);
                const monthlyBudget = totalBudget / 12;

                trendData.forEach(d => d.budget = monthlyBudget);

                return {
                    trendData,
                    totalBudget,
                    totalActual: (invoices || []).reduce((sum, inv: any) => 
                        sum + ((inv.status === 'paid' || inv.status === 'sent') ? (Number(inv.amount) || 0) : 0), 0)
                };
            } catch (e) {
                console.warn('Org financials error:', e);
                return { trendData: [], totalBudget: 0, totalActual: 0 };
            }
        }
    });
}
