import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Define types locally since tables may not exist
export interface Profile {
    id: string;
    full_name?: string;
    email?: string;
    avatar_url?: string;
    role?: string;
    status?: string;
}

export interface Organization {
    id: string;
    name: string;
    plan?: string;
    status?: string;
    created_at?: string;
    user_count?: number;
    project_count?: number;
}

export interface AuditLog {
    id: string;
    action: string;
    resource?: string;
    user_id?: string;
    ip_address?: string;
    created_at: string;
    status?: string;
    profiles?: { email?: string; full_name?: string };
}

export interface ApiKey {
    id: string;
    name: string;
    prefix?: string;
    created_at: string;
    last_used_at?: string;
    status?: string;
}

export const useAdminUsers = () => {
    return useQuery({
        queryKey: ["admin-users"],
        queryFn: async (): Promise<Profile[]> => {
            try {
                // Try to fetch from profiles table (may not exist)
                const { data, error } = await (supabase as any)
                    .from("profiles")
                    .select("*")
                    .order("full_name");
                if (error) throw error;
                return data || [];
            } catch (e) {
                // Fallback: fetch users from auth metadata
                console.warn("profiles table not available, returning empty array");
                return [];
            }
        },
    });
};

export const useAdminOrganizations = () => {
    return useQuery({
        queryKey: ["admin-organizations"],
        queryFn: async (): Promise<Organization[]> => {
            try {
                const { data: orgs, error } = await (supabase as any)
                    .from("organizations")
                    .select("*")
                    .order("name");
                if (error) throw error;

                if (!orgs || orgs.length === 0) return [];

                // Fetch counts for each organization
                const orgsWithCounts = await Promise.all(
                    orgs.map(async (org: Organization) => {
                        // Count users
                        const { count: userCount } = await (supabase as any)
                            .from("profiles")
                            .select("id", { count: 'exact', head: true })
                            .eq("organization_id", org.id);

                        // Count projects
                        const { count: projectCount } = await (supabase as any)
                            .from("projects")
                            .select("id", { count: 'exact', head: true })
                            .eq("organization_id", org.id);

                        return {
                            ...org,
                            user_count: userCount || 0,
                            project_count: projectCount || 0,
                        };
                    })
                );

                return orgsWithCounts;
            } catch (e) {
                console.warn("organizations table not available", e);
                return [];
            }
        },
    });
};

export const useAdminAuditLogs = () => {
    return useQuery({
        queryKey: ["admin-audit-logs"],
        queryFn: async (): Promise<AuditLog[]> => {
            try {
                const { data, error } = await (supabase as any)
                    .from("audit_logs")
                    .select("*, profiles(email, full_name)")
                    .order("created_at", { ascending: false })
                    .limit(100);
                if (error) throw error;
                return data || [];
            } catch (e) {
                console.warn("audit_logs table not available");
                return [];
            }
        },
    });
};

export const useAdminApiKeys = () => {
    return useQuery({
        queryKey: ["admin-api-keys"],
        queryFn: async (): Promise<ApiKey[]> => {
            try {
                const { data, error } = await (supabase as any)
                    .from("api_keys")
                    .select("*")
                    .order("created_at", { ascending: false });
                if (error) throw error;
                return data || [];
            } catch (e) {
                console.warn("api_keys table not available");
                return [];
            }
        },
    });
};

// Mutations

export const useUpdateUserRole = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, role, status }: { id: string; role?: string; status?: string }) => {
            const { data, error } = await (supabase as any)
                .from("profiles")
                .update({ role, status })
                .eq("id", id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-users"] });
        },
    });
};

export const useCreateOrganization = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (org: { name: string; plan?: string }) => {
            const { data, error } = await (supabase as any)
                .from("organizations")
                .insert(org)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-organizations"] });
        },
    });
};

export const useRevokeApiKey = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { error } = await (supabase as any)
                .from("api_keys")
                .update({ status: 'revoked' })
                .eq("id", id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["admin-api-keys"] });
        },
    });
};
