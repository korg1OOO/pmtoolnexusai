import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database } from "@/integrations/supabase/types";

export type UserPreferenceValue = string | number | boolean | null | { [key: string]: any };

export interface UserPreferences {
    theme?: 'light' | 'dark' | 'system';
    notifications?: {
        email: {
            taskAssignments: boolean;
            dueReminders: boolean;
            meetingInvites: boolean;
            slaWarnings: boolean;
            weeklyDigest: boolean;
        };
        push: {
            desktop: boolean;
            mobile: boolean;
            sound: boolean;
        };
    };
    region?: {
        language: string;
        timezone: string;
    };
    profile_extended?: {
        phone_number?: string;
        department?: string;
        title?: string;
        bio?: string;
    };
    dashboard_layout?: any;
}

export const useUserPreferences = () => {
    const queryClient = useQueryClient();

    const { data: preferences, isLoading } = useQuery({
        queryKey: ["user_preferences"],
        queryFn: async (): Promise<UserPreferences> => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return {};

            const { data, error } = await supabase
                .from("user_preferences")
                .select("preference_key, preference_value")
                .eq("user_id", user.id);

            if (error) {
                console.error("Error fetching preferences:", error);
                return {};
            }

            const prefs: UserPreferences = {};
            data?.forEach(row => {
                if (row.preference_key === "theme") prefs.theme = row.preference_value as any;
                if (row.preference_key === "notifications") prefs.notifications = row.preference_value as any;
                if (row.preference_key === "region") prefs.region = row.preference_value as any;
                if (row.preference_key === "profile_extended") prefs.profile_extended = row.preference_value as any;
                if (row.preference_key === "dashboard_layout") prefs.dashboard_layout = row.preference_value as any;
            });

            return prefs;
        },
    });

    const updatePreference = useMutation({
        mutationFn: async ({ key, value }: { key: keyof UserPreferences; value: UserPreferenceValue }) => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user");

            const { error } = await supabase
                .from("user_preferences")
                .upsert({
                    user_id: user.id,
                    preference_key: key,
                    preference_value: value as any
                }, { onConflict: 'user_id, preference_key' });

            if (error) throw error;
            return { key, value };
        },
        onSuccess: (data) => {
            queryClient.setQueryData(["user_preferences"], (old: UserPreferences | undefined) => ({
                ...old,
                [data.key]: data.value
            }));
            // toast.success(`Updated ${data.key}`);
        },
        onError: (error: Error) => {
            toast.error("Failed to update preference: " + error.message);
        }
    });

    return {
        preferences,
        isLoading,
        updatePreference
    };
};
