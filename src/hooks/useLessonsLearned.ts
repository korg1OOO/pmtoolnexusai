import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Tables } from '@/integrations/supabase/types';

export type LessonLearned = Tables<'lessons_learned'>;

export function useLessonsLearned(projectId: string | null) {
    return useQuery({
        queryKey: ['lessons_learned', projectId],
        queryFn: async () => {
            let query = supabase.from('lessons_learned').select('*');
            if (projectId) {
                query = query.eq('project_id', projectId);
            }
            const { data, error } = await query.order('created_at', { ascending: false });
            if (error) throw error;
            return data as LessonLearned[];
        },
    });
}

export function useCreateLessonLearned() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (lesson: Omit<LessonLearned, 'id' | 'created_at' | 'updated_at'>) => {
            const { data, error } = await supabase
                .from('lessons_learned')
                .insert(lesson)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['lessons_learned'] });
            toast.success('Lesson learned added successfully');
        },
        onError: (error) => {
            toast.error('Failed to add lesson learned: ' + error.message);
        },
    });
}
