import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { scenarioService, Scenario } from "@/services/scenarioService";
import { toast } from "sonner";

export { type Scenario };

export const useScenarios = (projectId?: string) => {
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ["scenarios", projectId],
        queryFn: async () => {
            if (!projectId) return [];
            return await scenarioService.getScenarios(projectId);
        },
        enabled: !!projectId,
    });

    const createMutation = useMutation({
        mutationFn: async ({ name, description }: { name: string; description: string }) => {
            if (!projectId) throw new Error("Project ID is required");
            return await scenarioService.createScenario(projectId, name, description);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["scenarios", projectId] });
            toast.success("Scenario created successfully");
        },
        onError: (error) => {
            console.error(error);
            toast.error("Failed to create scenario");
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            return await scenarioService.deleteScenario(id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["scenarios", projectId] });
            toast.success("Scenario deleted");
        },
        onError: (error) => {
            console.error(error);
            toast.error("Failed to delete scenario");
        }
    });

    const promoteMutation = useMutation({
        mutationFn: async (id: string) => {
            if (!projectId) throw new Error("Project ID is required");
            return await scenarioService.promoteScenario(projectId, id);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["scenarios", projectId] });
            queryClient.invalidateQueries({ queryKey: ["tasks", projectId] }); // Invalidate actuals too
            toast.success("Scenario promoted to live plan");
        },
        onError: (error) => {
            console.error(error);
            toast.error("Failed to promote scenario");
        }
    });

    return {
        data,
        isLoading,
        createScenario: createMutation.mutateAsync,
        deleteScenario: deleteMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isDeleting: deleteMutation.isPending,
        promoteScenario: promoteMutation.mutateAsync,
        isPromoting: promoteMutation.isPending
    };
};
};
