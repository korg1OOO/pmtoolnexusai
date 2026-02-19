
import { supabase } from '@/integrations/supabase/client';

export type EnforcementAction = 'create_project' | 'invite_member' | 'upload_file';

export async function checkLimit(action: EnforcementAction, payload: any = {}): Promise<void> {
    console.log(`Checking limit for action: ${action}`);
    const { data, error } = await supabase.functions.invoke('enforce-limits', {
        body: { action, payload }
    });

    if (error) {
        console.error('Enforcement check failed (network/function error):', error);
        // Fail open or closed? Closed for security, Open for UX resilience?
        // Let's fail closed but with a clear message.
        throw new Error('Could not verify subscription limits. Please try again.');
    }

    if (data && !data.allowed) {
        throw new Error(data.error || 'Subscription limit reached.');
    }
}
