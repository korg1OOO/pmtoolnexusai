import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MonthlyFinancials {
    month: string;
    actual: number;
    projected: number; // Placeholder for now or calculated
}

export function useOrgFinancials() {
    return useQuery({
        queryKey: ['org_financials'],
        queryFn: async () => {
            // Fetch all invoices visible to user
            const { data: invoices, error: invError } = await supabase
                .from('project_invoices')
                .select('amount, date, status');

            if (invError) throw invError;

            // Group by month
            const months: Record<string, number> = {};
            const now = new Date();

            // Initialize last 12 months with 0
            for (let i = 11; i >= 0; i--) {
                const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
                const key = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }); // e.g., "Jan 2024"
                months[key] = 0;
            }

            invoices?.forEach(inv => {
                if (inv.status === 'paid' || inv.status === 'sent') {
                    const d = new Date(inv.date);
                    // Only aggregate if within the last 12 months roughly
                    // Actually, let's just use the key format matches
                    const key = d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                    if (months[key] !== undefined) {
                        months[key] += Number(inv.amount);
                    }
                }
            });

            // Transform to array
            const trendData = Object.entries(months).map(([month, actual]) => ({
                month: month.split(' ')[0], // Just Month name for display if short
                fullMonth: month,
                actual,
                budget: 0 // We'll calculate this or mock it appropriately if no time-phased budget
            }));

            // Calculate simple linear budget burn or total budget
            // For now, let's fetch total budget to show as a context
            const { data: budgetItems, error: budError } = await supabase
                .from('project_budget_items')
                .select('planned');

            if (budError) throw budError;

            const totalBudget = budgetItems?.reduce((sum, item) => sum + Number(item.planned), 0) || 0;
            const monthlyBudget = totalBudget / 12; // Very naive linear distribution for context

            trendData.forEach(d => d.budget = monthlyBudget); // Naive 'Budget' line

            return {
                trendData,
                totalBudget,
                totalActual: invoices?.reduce((sum, inv) => sum + (inv.status === 'paid' || inv.status === 'sent' ? Number(inv.amount) : 0), 0) || 0
            };
        }
    });
}
