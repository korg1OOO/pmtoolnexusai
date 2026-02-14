import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, AlertCircle, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ResourceDemand {
    program_id: string;
    program_name: string;
    required: number;
    allocated: number;
    gap: number;
}

export function ResourcePlanningView() {
    const { portfolioId } = useParams();

    const { data: resourceData } = useQuery({
        queryKey: ['portfolio-resources', portfolioId],
        queryFn: async () => {
            return {
                total_capacity: 50,
                total_allocated: 38,
                total_demand: 45,
                demands: [
                    {
                        program_id: '1',
                        program_name: 'Cloud Migration',
                        required: 18,
                        allocated: 15,
                        gap: 3
                    },
                    {
                        program_id: '2',
                        program_name: 'Mobile App Redesign',
                        required: 12,
                        allocated: 12,
                        gap: 0
                    },
                    {
                        program_id: '3',
                        program_name: 'API Platform',
                        required: 15,
                        allocated: 11,
                        gap: 4
                    }
                ] as ResourceDemand[],
                conflicts: [
                    {
                        id: '1',
                        resource_name: 'John Doe',
                        programs: ['Cloud Migration', 'API Platform'],
                        total_allocation: 120
                    }
                ]
            };
        }
    });

    const available = (resourceData?.total_capacity || 0) - (resourceData?.total_allocated || 0);

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Resource Planning</h1>
                    <p className="text-muted-foreground">Cross-program resource allocation and optimization</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">Run Optimization</Button>
                    <Button>What-If Scenario</Button>
                </div>
            </div>

            {/* Capacity Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6">
                    <div className="flex items-center gap-3">
                        <Users className="w-8 h-8 text-blue-600" />
                        <div>
                            <p className="text-sm text-muted-foreground">Total Capacity</p>
                            <p className="text-2xl font-bold">{resourceData?.total_capacity}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center gap-3">
                        <TrendingUp className="w-8 h-8 text-green-600" />
                        <div>
                            <p className="text-sm text-muted-foreground">Allocated</p>
                            <p className="text-2xl font-bold">{resourceData?.total_allocated}</p>
                            <p className="text-xs text-muted-foreground">
                                {((resourceData?.total_allocated || 0) / (resourceData?.total_capacity || 1) * 100).toFixed(0)}% utilized
                            </p>
                        </div>
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-8 h-8 text-orange-600" />
                        <div>
                            <p className="text-sm text-muted-foreground">Available</p>
                            <p className="text-2xl font-bold">{available}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Demand vs Capacity Chart */}
            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Demand vs Capacity by Program</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={resourceData?.demands}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="program_name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="required" fill="#3b82f6" name="Required" />
                        <Bar dataKey="allocated" fill="#10b981" name="Allocated" />
                    </BarChart>
                </ResponsiveContainer>
            </Card>

            {/* Resource Gaps */}
            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Resource Gaps</h2>
                <div className="space-y-3">
                    {resourceData?.demands.filter(d => d.gap > 0).map((demand) => (
                        <div key={demand.program_id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div>
                                <h4 className="font-medium">{demand.program_name}</h4>
                                <p className="text-sm text-muted-foreground">
                                    {demand.allocated} allocated / {demand.required} required
                                </p>
                            </div>
                            <span className="text-sm px-3 py-1 bg-red-100 text-red-700 rounded">
                                Gap: {demand.gap} resources
                            </span>
                        </div>
                    ))}
                    {resourceData?.demands.every(d => d.gap === 0) && (
                        <div className="text-center py-8 text-muted-foreground">
                            No resource gaps detected
                        </div>
                    )}
                </div>
            </Card>

            {/* Resource Conflicts */}
            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Resource Conflicts</h2>
                <div className="space-y-3">
                    {resourceData?.conflicts.map((conflict) => (
                        <div key={conflict.id} className="flex items-start gap-3 p-3 border rounded-lg border-orange-200 bg-orange-50">
                            <AlertCircle className="w-5 h-5 text-orange-600 mt-0.5" />
                            <div className="flex-1">
                                <h4 className="font-medium">{conflict.resource_name}</h4>
                                <p className="text-sm text-muted-foreground">
                                    Over-allocated across: {conflict.programs.join(', ')}
                                </p>
                                <p className="text-sm text-orange-700 mt-1">
                                    Total allocation: {conflict.total_allocation}%
                                </p>
                            </div>
                            <Button variant="outline" size="sm">Resolve</Button>
                        </div>
                    ))}
                </div>
            </Card>
        </div >
    );
}
