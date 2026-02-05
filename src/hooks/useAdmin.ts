import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type AuditLog = Database["public"]["Tables"]["audit_logs"]["Row"];
export type ApiKey = Database["public"]["Tables"]["api_keys"]["Row"];

export const useAdminUsers = () => {
    return useQuery({
        queryKey: ["admin-users"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("profiles")
                .select("*")
                .order("full_name");
            if (error) throw error;
            return data;
        },
    });
};

export const useAdminOrganizations = () => {
    return useQuery({
        queryKey: ["admin-organizations"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("organizations")
                .select("*")
                .order("name");
            if (error) throw error;
            return data;
        },
    });
};

export const useAdminAuditLogs = () => {
    return useQuery({
        queryKey: ["admin-audit-logs"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("audit_logs")
                .select("*, profiles(email, full_name)")
                .order("created_at", { ascending: false })
                .limit(100);
            if (error) throw error;
            return data;
        },
    });
};

export const useAdminApiKeys = () => {
    return useQuery({
        queryKey: ["admin-api-keys"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("api_keys")
                .select("*")
                .order("created_at", { ascending: false });
            if (error) throw error;
            return data;
        },
    });
};

// Mutations

export const useUpdateUserRole = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, role, status }: { id: string; role?: string; status?: string }) => {
            const { data, error } = await supabase
                .from("profiles")
                .update({ role, status } as any) // Type casting as Supabase generated types might lag
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
            const { data, error } = await supabase
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
            const { error } = await supabase
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
