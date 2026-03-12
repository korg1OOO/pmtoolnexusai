
import { supabase } from '@/integrations/supabase/client';

export type EnforcementAction = 'create_project' | 'invite_member' | 'upload_file';

export async function checkLimit(action: EnforcementAction, payload: any = {}): Promise<void> {
    console.log(`Checking limit for action: ${action}`);
    try {
        const { data, error } = await supabase.functions.invoke('enforce-limits', {
            body: { action, payload }
        });

        if (error) {
            // Edge Function not deployed (local dev / CORS / 404) — fail open to avoid blocking UX
            console.warn('enforce-limits function unreachable, proceeding without limit check:', error?.message);
            return;
        }

        if (data && !data.allowed) {
            throw new Error(data.error || 'Subscription limit reached.');
        }
    } catch (e: any) {
        // Re-throw only explicit limit violations; swallow network/CORS errors
        if (e?.message?.includes('Subscription limit')) {
            throw e;
        }
        console.warn('enforce-limits check skipped (function unavailable):', e?.message);
    }
}
