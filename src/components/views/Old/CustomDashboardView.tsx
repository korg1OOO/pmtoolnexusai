
import React, { useState, useEffect } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "react-beautiful-dnd";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    BarChart3,
    Clock,
    CheckCircle2,
    AlertCircle,
    TrendingUp,
    Calendar,
    ArrowRight,
    Plus,
    X,
    Settings,
    GripVertical
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { useProjectContext } from "@/contexts/ProjectContext";

// Types
interface WidgetConfig {
    id: string;
    type: string;
    title: string;
    size: 'small' | 'medium' | 'large';
    orderIndex: number;
    isVisible: boolean;
    config?: any;
}

interface Dashboard {
    id: string;
    name: string;
    layout: any;
    widgets: WidgetConfig[];
    userId: string;
}

const WIDGET_TYPES = [
    { id: 'burndown', name: 'Burndown Chart', icon: TrendingUp, defaultSize: 'medium' },
    { id: 'velocity', name: 'Velocity Chart', icon: BarChart3, defaultSize: 'medium' },
    { id: 'tasks', name: 'My Tasks', icon: CheckCircle2, defaultSize: 'large' },
    { id: 'risks', name: 'Risk Watch', icon: AlertCircle, defaultSize: 'small' },
    { id: 'activity', name: 'Recent Activity', icon: Clock, defaultSize: 'medium' },
    { id: 'calendar', name: 'Calendar', icon: Calendar, defaultSize: 'medium' }
];

export default function CustomDashboardView() {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { currentProject } = useProjectContext();
    const [selectedDashboardId, setSelectedDashboardId] = useState<string | null>(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [isAddWidgetOpen, setIsAddWidgetOpen] = useState(false);

    // Fetch Dashboards
    const { data: dashboards = [], isLoading } = useQuery({
        queryKey: ['/api/dashboards'],
        queryFn: async () => {
            const res = await apiRequest('GET', '/api/dashboards');
            const json = await res.json();
            return json.data || json;
        }
    });

    // Select first dashboard on load
    useEffect(() => {
        if (dashboards.length > 0 && !selectedDashboardId) {
            setSelectedDashboardId(dashboards[0].id);
        }
    }, [dashboards, selectedDashboardId]);

    const activeDashboard = dashboards.find((d: Dashboard) => d.id === selectedDashboardId) || null;
    const widgets = activeDashboard?.widgets || [];

    // Mutations
    const createDashboardMutation = useMutation({
        mutationFn: async (name: string) => {
            const res = await apiRequest('POST', '/api/dashboards', { name, layout: {} });
            const json = await res.json();
            return json.data || json;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/dashboards'] });
            toast({ title: "Dashboard created" });
        }
    });

    const updateWidgetsMutation = useMutation({
        mutationFn: async (updatedWidgets: WidgetConfig[]) => {
            if (!selectedDashboardId) return;
            // api expects { widgets: [...] }
            const res = await apiRequest('PUT', `/api/dashboards/${selectedDashboardId}/widgets`, { widgets: updatedWidgets });
            const json = await res.json();
            return json.data || json;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/dashboards'] });
        }
    });

    const addWidgetMutation = useMutation({
        mutationFn: async (type: string) => {
            if (!selectedDashboardId) return;
            const widgetDef = WIDGET_TYPES.find(w => w.id === type);
            if (!widgetDef) return;

            const res = await apiRequest('POST', `/api/dashboards/${selectedDashboardId}/widgets`, {
                type,
                title: widgetDef.name,
                config: { size: widgetDef.defaultSize }
            });
            const json = await res.json();
            return json.data || json;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/dashboards'] });
            setIsAddWidgetOpen(false);
            toast({ title: "Widget added" });
        }
    });

    const deleteWidgetMutation = useMutation({
        mutationFn: async (widgetId: string) => {
            await apiRequest('DELETE', `/api/dashboards/widgets/${widgetId}`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['/api/dashboards'] });
            toast({ title: "Widget removed" });
        }
    });


    // DND Handler
    const onDragEnd = (result: DropResult) => {
        if (!result.destination || !activeDashboard) return;

        const newWidgets = Array.from(widgets);
        const [reorderedItem] = newWidgets.splice(result.source.index, 1);
        newWidgets.splice(result.destination.index, 0, reorderedItem);

        // Update order indices
        const updatedWidgets = newWidgets.map((w: any, index) => ({
            ...w,
            orderIndex: index
        }));

        // Optimistic update could be done here, but sticking to simple refetch for now
        updateWidgetsMutation.mutate(updatedWidgets);
    };

    const renderWidgetContent = (widget: WidgetConfig) => {
        // Placeholder content based on type
        switch (widget.type) {
            case 'burndown':
                return (
                    <div className="h-full flex items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-md">
                        <TrendingUp className="h-10 w-10 text-muted-foreground opacity-20" />
                        <span className="ml-2 text-sm text-muted-foreground">Burndown Chart Placeholder</span>
                    </div>
                );
            case 'velocity':
                return (
                    <div className="h-full flex items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-md">
                        <BarChart3 className="h-10 w-10 text-muted-foreground opacity-20" />
                        <span className="ml-2 text-sm text-muted-foreground">Velocity Chart Placeholder</span>
                    </div>
                );
            default:
                return (
                    <div className="h-full flex items-center justify-center bg-slate-50 dark:bg-slate-900 rounded-md">
                        <span className="text-sm text-muted-foreground">{widget.title} Content</span>
                    </div>
                );
        }
    }

    if (isLoading) return <div className="p-8">Loading dashboards...</div>;

    return (
        <div className="flex-1 space-y-4 p-8 pt-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <h2 className="text-3xl font-bold tracking-tight">Dashboards</h2>
                    <Select value={selectedDashboardId || ''} onValueChange={setSelectedDashboardId}>
                        <SelectTrigger className="w-[200px]">
                            <SelectValue placeholder="Select dashboard" />
                        </SelectTrigger>
                        <SelectContent>
                            {dashboards.map((d: Dashboard) => (
                                <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button variant="outline" size="icon" onClick={() => createDashboardMutation.mutate(`New Dashboard ${dashboards.length + 1}`)}>
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant={isEditMode ? "secondary" : "outline"} onClick={() => setIsEditMode(!isEditMode)}>
                        {isEditMode ? "Done Editing" : "Edit Layout"}
                    </Button>
                    {isEditMode && (
                        <Dialog open={isAddWidgetOpen} onOpenChange={setIsAddWidgetOpen}>
                            <DialogTrigger asChild>
                                <Button>Add Widget</Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Add Widget</DialogTitle>
                                    <DialogDescription>Choose a widget to add to your dashboard.</DialogDescription>
                                </DialogHeader>
                                <div className="grid grid-cols-2 gap-4 py-4">
                                    {WIDGET_TYPES.map(type => (
                                        <Button
                                            key={type.id}
                                            variant="outline"
                                            className="h-24 flex flex-col gap-2 hover:bg-slate-50 dark:hover:bg-slate-800"
                                            onClick={() => addWidgetMutation.mutate(type.id)}
                                        >
                                            <type.icon className="h-6 w-6" />
                                            {type.name}
                                        </Button>
                                    ))}
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </div>

            {activeDashboard ? (
                <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="dashboard-widgets">
                        {(provided) => (
                            <div
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                            >
                                {widgets.sort((a: any, b: any) => a.orderIndex - b.orderIndex).map((widget: WidgetConfig, index: number) => (
                                    <Draggable key={widget.id} draggableId={widget.id} index={index} isDragDisabled={!isEditMode}>
                                        {(provided) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                className={`
                                                    ${widget.config?.size === 'large' ? 'md:col-span-2 lg:col-span-3' : ''}
                                                    ${widget.config?.size === 'medium' ? 'md:col-span-1 lg:col-span-1' : ''}
                                                `}
                                            >
                                                <Card className="h-full min-h-[300px] flex flex-col relative group">
                                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                        <div className="flex items-center gap-2">
                                                            {isEditMode && (
                                                                <div {...provided.dragHandleProps} className="cursor-move text-muted-foreground hover:text-foreground">
                                                                    <GripVertical className="h-4 w-4" />
                                                                </div>
                                                            )}
                                                            <CardTitle className="text-sm font-medium">
                                                                {widget.title}
                                                            </CardTitle>
                                                        </div>
                                                        {isEditMode && (
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                                                onClick={() => deleteWidgetMutation.mutate(widget.id)}
                                                            >
                                                                <X className="h-4 w-4 text-muted-foreground hover:text-red-500" />
                                                            </Button>
                                                        )}
                                                    </CardHeader>
                                                    <CardContent className="flex-1 pt-4">
                                                        {renderWidgetContent(widget)}
                                                    </CardContent>
                                                </Card>
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </DragDropContext>
            ) : (
                <div className="flex items-center justify-center h-[400px] border-2 border-dashed rounded-lg">
                    <div className="text-center">
                        <h3 className="text-lg font-semibold">No Dashboard Selected</h3>
                        <p className="text-muted-foreground mb-4">Select a dashboard or create a new one to get started.</p>
                        <Button onClick={() => createDashboardMutation.mutate("My First Dashboard")}>Create Dashboard</Button>
                    </div>
                </div>
            )}
        </div>
    );
}
