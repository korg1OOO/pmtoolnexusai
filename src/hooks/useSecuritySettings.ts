/**
 * useSecuritySettings — reads/writes security settings from platform_settings table
 * Keys: mfa_enforced, sso_only, session_timeout_minutes, ip_allowlist_enabled,
 *       audit_logging_enabled, data_export_allowed
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase as _supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const supabase = _supabase as any;

export interface SecuritySettings {
    mfa_enforced: boolean;
    sso_only: boolean;
    session_timeout_minutes: number;
    ip_allowlist_enabled: boolean;
    audit_logging_enabled: boolean;
    data_export_allowed: boolean;
}

const DEFAULTS: SecuritySettings = {
    mfa_enforced: true,
    sso_only: false,
    session_timeout_minutes: 30,
    ip_allowlist_enabled: false,
    audit_logging_enabled: true,
    data_export_allowed: true,
};

const SECURITY_KEYS = Object.keys(DEFAULTS) as (keyof SecuritySettings)[];

export function useSecuritySettings() {
    return useQuery<SecuritySettings>({
        queryKey: ['security-settings'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('platform_settings')
                .select('key, value')
                .in('key', SECURITY_KEYS);

            if (error) throw error;

            const map: Partial<SecuritySettings> = {};
            for (const row of (data ?? [])) {
                const val = row.value;
                (map as any)[row.key] = typeof val === 'boolean' ? val
                    : typeof val === 'number' ? val
                        : JSON.parse(String(val));
            }
            return { ...DEFAULTS, ...map };
        },
        // Return defaults immediately while loading so UI renders instantly
        placeholderData: DEFAULTS,
    });
}

export function useUpdateSecuritySetting() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ key, value }: { key: keyof SecuritySettings; value: boolean | number }) => {
            const { error } = await supabase
                .from('platform_settings')
                .upsert({ key, value }, { onConflict: 'key' });
            if (error) throw error;
        },
        onMutate: async ({ key, value }) => {
            // Optimistic update
            await queryClient.cancelQueries({ queryKey: ['security-settings'] });
            const prev = queryClient.getQueryData<SecuritySettings>(['security-settings']);
            queryClient.setQueryData<SecuritySettings>(['security-settings'], old => ({
                ...(old ?? DEFAULTS),
                [key]: value,
            }));
            return { prev };
        },
        onError: (_err, _vars, context: any) => {
            queryClient.setQueryData(['security-settings'], context?.prev);
            toast.error('Failed to save security setting');
        },
        onSuccess: () => {
            toast.success('Security setting saved');
            queryClient.invalidateQueries({ queryKey: ['security-settings'] });
        },
    });
}
