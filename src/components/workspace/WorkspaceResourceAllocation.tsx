import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, TrendingUp, DollarSign, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ResourceAllocation {
    portfolio_id: string;
    portfolio_name: string;
    allocated_members: number;
    total_capacity: number;
    utilization: number;
}

export function WorkspaceResourceAllocation() {
    const { workspaceId } = useParams();
    const [timeRange, setTimeRange] = useState('month');

    const { data: allocations } = useQuery({
        queryKey: ['resource-allocations', workspaceId],
        queryFn: async () => {
            const mockAllocations: ResourceAllocation[] = [
                {
                    portfolio_id: '1',
                    portfolio_name: 'Digital Transformation',
                    allocated_members: 18,
                    total_capacity: 20,
                    utilization: 90
                },
                {
                    portfolio_id: '2',
                    portfolio_name: 'Product Innovation',
                    allocated_members: 12,
                    total_capacity: 15,
                    utilization: 80
                },
                {
                    portfolio_id: '3',
                    portfolio_name: 'Infrastructure',
                    allocated_members: 8,
                    total_capacity: 10,
                    utilization: 80
                }
            ];
            return mockAllocations;
        }
    });

    const totalMembers = allocations?.reduce((sum, a) => sum + a.allocated_members, 0) || 0;
    const totalCapacity = allocations?.reduce((sum, a) => sum + a.total_capacity, 0) || 0;
    const avgUtilization = allocations?.reduce((sum, a) => sum + a.utilization, 0) / (allocations?.length || 1) || 0;

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Resource Allocation</h1>
                    <p className="text-muted-foreground">Manage and optimize resource distribution</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">Export Report</Button>
                    <Button>Optimize Allocation</Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6">
                    <div className="flex items-center gap-3">
                        <Users className="w-8 h-8 text-blue-600" />
                        <div>
                            <p className="text-sm text-muted-foreground">Allocated Resources</p>
                            <p className="text-2xl font-bold">{totalMembers} / {totalCapacity}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center gap-3">
                        <TrendingUp className="w-8 h-8 text-green-600" />
                        <div>
                            <p className="text-sm text-muted-foreground">Avg Utilization</p>
                            <p className="text-2xl font-bold">{avgUtilization.toFixed(0)}%</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center gap-3">
                        <Calendar className="w-8 h-8 text-purple-600" />
                        <div>
                            <p className="text-sm text-muted-foreground">Available Capacity</p>
                            <p className="text-2xl font-bold">{totalCapacity - totalMembers}</p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Allocation Chart */}
            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Portfolio Resource Distribution</h2>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={allocations}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="portfolio_name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="allocated_members" fill="#3b82f6" name="Allocated" />
                        <Bar dataKey="total_capacity" fill="#e5e7eb" name="Capacity" />
                    </BarChart>
                </ResponsiveContainer>
            </Card>

            {/* Allocation Details */}
            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Allocation Details</h2>
                <div className="space-y-4">
                    {allocations?.map((allocation) => (
                        <div key={allocation.portfolio_id} className="border rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold">{allocation.portfolio_name}</h3>
                                <span className={`text-sm px-2 py-1 rounded ${allocation.utilization >= 90 ? 'bg-red-100 text-red-700' :
                                        allocation.utilization >= 70 ? 'bg-orange-100 text-orange-700' :
                                            'bg-green-100 text-green-700'
                                    }`}>
                                    {allocation.utilization}% Utilized
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                                <span>{allocation.allocated_members} allocated / {allocation.total_capacity} capacity</span>
                                <span>{allocation.total_capacity - allocation.allocated_members} available</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                    className={`h-2 rounded-full ${allocation.utilization >= 90 ? 'bg-red-600' :
                                            allocation.utilization >= 70 ? 'bg-orange-600' :
                                                'bg-green-600'
                                        }`}
                                    style={{ width: `${allocation.utilization}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}
