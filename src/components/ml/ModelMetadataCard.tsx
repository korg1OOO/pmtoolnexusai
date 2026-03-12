import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, Check, X } from "lucide-react";
import { MLModel, useActivateModel, useDeactivateModel } from "@/hooks/useMLModels";
import { useToast } from "@/hooks/use-toast";

interface ModelMetadataCardProps {
    model: MLModel;
}

/**
 * Displays ML model information in a card format
 */
export const ModelMetadataCard = ({ model }: ModelMetadataCardProps) => {
    const { toast } = useToast();
    const activateMutation = useActivateModel();
    const deactivateMutation = useDeactivateModel();

    const handleToggleActive = () => {
        if (model.is_active) {
            deactivateMutation.mutate(model.id, {
                onSuccess: () => {
                    toast({
                        title: "Model Deactivated",
                        description: `${model.model_type} model v${model.model_version} has been deactivated`,
                    });
                },
                onError: () => {
                    toast({
                        title: "Error",
                        description: "Failed to deactivate model",
                        variant: "destructive",
                    });
                },
            });
        } else {
            activateMutation.mutate({ id: model.id, modelType: model.model_type }, {
                onSuccess: () => {
                    toast({
                        title: "Model Activated",
                        description: `${model.model_type} model v${model.model_version} is now active`,
                    });
                },
                onError: () => {
                    toast({
                        title: "Error",
                        description: "Failed to activate model",
                        variant: "destructive",
                    });
                },
            });
        }
    };

    const getModelTypeColor = (type: string) => {
        switch (type) {
            case 'risk': return 'text-red-600 bg-red-50';
            case 'cost': return 'text-green-600 bg-green-50';
            case 'schedule': return 'text-blue-600 bg-blue-50';
            default: return 'text-gray-600 bg-gray-50';
        }
    };

    const accuracy = model.accuracy_metrics?.precision ||
        model.accuracy_metrics?.accuracy ||
        model.accuracy_metrics?.f1;

    return (
        <Card className="p-4 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Brain className={`h-6 w-6 ${getModelTypeColor(model.model_type)}`} />
                    <div>
                        <h3 className="font-semibold capitalize">{model.model_type} Model</h3>
                        <p className="text-xs text-muted-foreground">v{model.model_version}</p>
                    </div>
                </div>
                <Badge variant={model.is_active ? "default" : "secondary"}>
                    {model.is_active ? "Active" : "Inactive"}
                </Badge>
            </div>

            <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Algorithm</span>
                    <span className="font-medium">{model.algorithm}</span>
                </div>

                {accuracy && (
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Accuracy</span>
                        <span className="font-medium">{(accuracy * 100).toFixed(1)}%</span>
                    </div>
                )}

                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Trained</span>
                    <span className="font-medium">
                        {new Date(model.training_date).toLocaleDateString()}
                    </span>
                </div>

                {model.training_data_size && (
                    <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Training Samples</span>
                        <span className="font-medium">{model.training_data_size.toLocaleString()}</span>
                    </div>
                )}
            </div>

            <Button
                size="sm"
                variant={model.is_active ? "outline" : "default"}
                className="w-full"
                onClick={handleToggleActive}
                disabled={activateMutation.isPending || deactivateMutation.isPending}
            >
                {model.is_active ? (
                    <>
                        <X className="mr-2 h-3 w-3" />
                        Deactivate
                    </>
                ) : (
                    <>
                        <Check className="mr-2 h-3 w-3" />
                        Activate
                    </>
                )}
            </Button>
        </Card>
    );
};
