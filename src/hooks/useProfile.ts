import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Profile {
    id: string;
    full_name?: string | null;
    email?: string | null;
    avatar_url?: string | null;
    phone_number?: string | null;
    department?: string | null;
    title?: string | null;
}

export const useProfile = () => {
    return useQuery({
        queryKey: ["profile"],
        queryFn: async (): Promise<Profile | null> => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return null;

            try {
                const { data, error } = await (supabase as any)
                    .from("profiles")
                    .select("*")
                    .eq("id", user.id)
                    .single();

                if (error) {
                    // Fallback to auth user metadata if profiles table doesn't exist
                    return {
                        id: user.id,
                        full_name: user.user_metadata?.full_name || null,
                        email: user.email || null,
                        avatar_url: user.user_metadata?.avatar_url || null,
                    };
                }
                return data as Profile;
            } catch (e) {
                // Fallback to auth user metadata
                return {
                    id: user.id,
                    full_name: user.user_metadata?.full_name || null,
                    email: user.email || null,
                    avatar_url: user.user_metadata?.avatar_url || null,
                };
            }
        },
    });
};

export const useUpdateProfile = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (profile: Partial<Profile>) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user");

            try {
                const { data, error } = await (supabase as any)
                    .from("profiles")
                    .update(profile)
                    .eq("id", user.id)
                    .select()
                    .single();

                if (error) throw error;
                return data;
            } catch (e) {
                // Try updating auth metadata as fallback
                const { error: authError } = await supabase.auth.updateUser({
                    data: { full_name: profile.full_name, avatar_url: profile.avatar_url }
                });
                if (authError) throw authError;
                return profile;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["profile"] });
            toast.success("Profile updated successfully");
        },
        onError: (error: Error) => {
            toast.error("Failed to update profile: " + error.message);
        }
    });
};
