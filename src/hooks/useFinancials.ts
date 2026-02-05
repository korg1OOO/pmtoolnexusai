import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BudgetItem {
    id: string;
    project_id: string;
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
        queryFn: async () => {
            if (!projectId) return [];
            const { data, error } = await supabase
                .from('project_budget_items')
                .select('*')
                .eq('project_id', projectId)
                .order('category', { ascending: true });

            if (error) throw error;
            return data as BudgetItem[];
        },
        enabled: !!projectId,
    });

    const invoicesQuery = useQuery({
        queryKey: ['project_invoices', projectId],
        queryFn: async () => {
            if (!projectId) return [];
            const { data, error } = await supabase
                .from('project_invoices')
                .select('*')
                .eq('project_id', projectId)
                .order('date', { ascending: false });

            if (error) throw error;
            return data as Invoice[];
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
            const { data, error } = await supabase
                .from('project_budget_items')
                .insert(item)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['project_budget_items', variables.project_id] });
            toast.success('Budget item created');
        },
        onError: (error) => {
            toast.error('Failed to create budget item: ' + error.message);
        },
    });
}

export function useCreateInvoice() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (invoice: Partial<Invoice>) => {
            const { data, error } = await supabase
                .from('project_invoices')
                .insert(invoice)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['project_invoices', variables.project_id] });
            toast.success('Invoice created');
        },
        onError: (error) => {
            toast.error('Failed to create invoice: ' + error.message);
        },
    });
}
