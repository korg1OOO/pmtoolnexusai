import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BudgetItem {
    id: string;
    project_id: string;
    name?: string;
    category: string;
    planned: number;
    actual: number;
    forecast: number;
    variance: number;
    created_at: string;
    updated_at: string;
}

export interface Invoice {
    id: string;
    project_id: string;
    invoice_number: string;
    date: string;
    amount: number;
    status: 'paid' | 'sent' | 'pending' | 'cancelled';
    milestone?: string;
    created_at: string;
    updated_at: string;
}

export function useFinancials(projectId: string | null) {
    const budgetQuery = useQuery({
        queryKey: ['project_budget_items', projectId],
        queryFn: async (): Promise<BudgetItem[]> => {
            if (!projectId) return [];
            try {
                const { data, error } = await supabase
                    .from('project_budget_items')
                    .select('*')
                    .eq('project_id', projectId)
                    .order('category', { ascending: true });

                if (error) throw error;

                // Map database fields to interface
                return (data || []).map((item: any) => ({
                    ...item,
                    planned: item.budgeted_amount ?? item.planned ?? 0,
                    actual: item.actual_amount ?? item.actual ?? 0,
                    forecast: item.forecast ?? item.budgeted_amount ?? 0,
                }));
            } catch (e) {
                console.warn('Budget items fetch error:', e);
                return [];
            }
        },
        enabled: !!projectId,
    });

    const invoicesQuery = useQuery({
        queryKey: ['project_invoices', projectId],
        queryFn: async (): Promise<Invoice[]> => {
            if (!projectId) return [];
            try {
                const { data, error } = await supabase
                    .from('project_invoices')
                    .select('*')
                    .eq('project_id', projectId)
                    .order('created_at', { ascending: false });

                if (error) throw error;

                // Map database fields to interface
                return (data || []).map((inv: any) => ({
                    ...inv,
                    date: inv.date ?? inv.due_date ?? inv.created_at,
                }));
            } catch (e) {
                console.warn('Invoices fetch error:', e);
                return [];
            }
        },
        enabled: !!projectId,
    });

    return {
        budget: budgetQuery.data || [],
        invoices: invoicesQuery.data || [],
        isLoading: budgetQuery.isLoading || invoicesQuery.isLoading,
        error: budgetQuery.error || invoicesQuery.error,
    };
}

export function useCreateBudgetItem() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (item: Partial<BudgetItem>) => {
            // Map interface fields to database fields
            const dbItem: any = {
                project_id: item.project_id,
                name: item.name ?? item.category,
                category: item.category,
                budgeted_amount: item.planned ?? 0,
                // actual_amount: item.actual ?? 0,
                // variance: item.variance ?? 0,
            };

            const { data, error } = await supabase
                .from('project_budget_items')
                .insert(dbItem)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['project_budget_items', variables.project_id] });
            toast.success('Budget item created');
        },
        onError: (error: Error) => {
            toast.error('Failed to create budget item: ' + error.message);
        },
    });
}

export function useCreateInvoice() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (invoice: Partial<Invoice>) => {
            // Map interface fields to database fields
            const dbInvoice: any = {
                project_id: invoice.project_id,
                invoice_number: invoice.invoice_number,
                amount: invoice.amount,
                status: invoice.status,
                due_date: invoice.date,
            };

            const { data, error } = await supabase
                .from('project_invoices')
                .insert(dbInvoice)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['project_invoices', variables.project_id] });
            toast.success('Invoice created');
        },
        onError: (error: Error) => {
            toast.error('Failed to create invoice: ' + error.message);
        },
    });
}
