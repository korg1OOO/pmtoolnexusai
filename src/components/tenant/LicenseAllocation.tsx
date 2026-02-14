import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Key, Users, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface LicensePool {
    id: string;
    name: string;
    total_licenses: number;
    used_licenses: number;
    available_licenses: number;
    license_type: string;
    renewal_date: string;
}

interface LicenseAllocation {
    user_id: string;
    user_name: string;
    user_email: string;
    license_type: string;
    allocated_date: string;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export function LicenseAllocation() {
    const [tenantId] = useState('default-tenant-id');

    // Mock data - replace with actual API calls
    const { data: pools } = useQuery({
        queryKey: ['license-pools', tenantId],
        queryFn: async () => {
            const mockPools: LicensePool[] = [
                {
                    id: '1',
                    name: 'Professional',
                    total_licenses: 100,
                    used_licenses: 75,
                    available_licenses: 25,
                    license_type: 'professional',
                    renewal_date: '2026-12-31'
                },
                {
                    id: '2',
                    name: 'Enterprise',
                    total_licenses: 50,
                    used_licenses: 45,
                    available_licenses: 5,
                    license_type: 'enterprise',
                    renewal_date: '2026-12-31'
                },
                {
                    id: '3',
                    name: 'Basic',
                    total_licenses: 200,
                    used_licenses: 120,
                    available_licenses: 80,
                    license_type: 'basic',
                    renewal_date: '2026-06-30'
                }
            ];
            return mockPools;
        }
    });

    const { data: allocations } = useQuery({
        queryKey: ['license-allocations', tenantId],
        queryFn: async () => {
            const mockAllocations: LicenseAllocation[] = [
                {
                    user_id: '1',
                    user_name: 'John Doe',
                    user_email: 'john@example.com',
                    license_type: 'professional',
                    allocated_date: '2026-01-15'
                },
                {
                    user_id: '2',
                    user_name: 'Jane Smith',
                    user_email: 'jane@example.com',
                    license_type: 'enterprise',
                    allocated_date: '2026-01-20'
                }
            ];
            return mockAllocations;
        }
    });

    const totalLicenses = pools?.reduce((sum, pool) => sum + pool.total_licenses, 0) || 0;
    const usedLicenses = pools?.reduce((sum, pool) => sum + pool.used_licenses, 0) || 0;
    const availableLicenses = pools?.reduce((sum, pool) => sum + pool.available_licenses, 0) || 0;

    const chartData = pools?.map(pool => ({
        name: pool.name,
        value: pool.used_licenses
    })) || [];

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">License Management</h1>
                    <p className="text-muted-foreground">Manage and allocate licenses across your organization</p>
                </div>
                <Button>
                    <Key className="w-4 h-4 mr-2" />
                    Purchase Licenses
                </Button>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                        <Key className="w-8 h-8 text-primary" />
                    </div>
                    <p className="text-sm text-muted-foreground">Total Licenses</p>
                    <p className="text-3xl font-bold mt-2">{totalLicenses}</p>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                        <Users className="w-8 h-8 text-green-600" />
                    </div>
                    <p className="text-sm text-muted-foreground">Used Licenses</p>
                    <p className="text-3xl font-bold mt-2">{usedLicenses}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                        {((usedLicenses / totalLicenses) * 100).toFixed(0)}% utilization
                    </p>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                        <TrendingUp className="w-8 h-8 text-blue-600" />
                    </div>
                    <p className="text-sm text-muted-foreground">Available</p>
                    <p className="text-3xl font-bold mt-2">{availableLicenses}</p>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* License Pools */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">License Pools</h2>
                    <div className="space-y-4">
                        {pools?.map((pool) => (
                            <LicensePoolCard key={pool.id} pool={pool} />
                        ))}
                    </div>
                </Card>

                {/* Usage Distribution */}
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Usage Distribution</h2>
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={(entry) => `${entry.name}: ${entry.value}`}
                                outerRadius={80}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </Card>
            </div>

            {/* Recent Allocations */}
            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Recent Allocations</h2>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b">
                                <th className="text-left py-3 px-4">User</th>
                                <th className="text-left py-3 px-4">License Type</th>
                                <th className="text-left py-3 px-4">Allocated Date</th>
                                <th className="text-left py-3 px-4">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {allocations?.map((allocation) => (
                                <tr key={allocation.user_id} className="border-b hover:bg-accent">
                                    <td className="py-3 px-4">
                                        <div>
                                            <div className="font-medium">{allocation.user_name}</div>
                                            <div className="text-sm text-muted-foreground">{allocation.user_email}</div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                                            <Key className="w-3 h-3" />
                                            {allocation.license_type}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-sm">
                                        {new Date(allocation.allocated_date).toLocaleDateString()}
                                    </td>
                                    <td className="py-3 px-4">
                                        <Button variant="outline" size="sm">
                                            Revoke
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Renewal Reminders */}
            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Renewal Reminders</h2>
                <div className="space-y-3">
                    {pools?.map((pool) => {
                        const daysUntilRenewal = Math.floor(
                            (new Date(pool.renewal_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                        );
                        const isUrgent = daysUntilRenewal < 30;

                        return (
                            <div
                                key={pool.id}
                                className={`flex items-center justify-between p-3 border rounded-lg ${isUrgent ? 'border-orange-500 bg-orange-50' : ''
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    {isUrgent ? (
                                        <AlertCircle className="w-5 h-5 text-orange-600" />
                                    ) : (
                                        <CheckCircle className="w-5 h-5 text-green-600" />
                                    )}
                                    <div>
                                        <div className="font-medium">{pool.name} License Pool</div>
                                        <div className="text-sm text-muted-foreground">
                                            Renews on {new Date(pool.renewal_date).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                                <div className="text-sm">
                                    {daysUntilRenewal} days remaining
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>
        </div>
    );
}

function LicensePoolCard({ pool }: { pool: LicensePool }) {
    const utilizationPercent = (pool.used_licenses / pool.total_licenses) * 100;
    const isLow = pool.available_licenses < 10;

    return (
        <div className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">{pool.name}</h3>
                {isLow && (
                    <span className="text-xs px-2 py-1 bg-orange-100 text-orange-700 rounded">
                        Low Stock
                    </span>
                )}
            </div>

            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Used</span>
                    <span className="font-medium">
                        {pool.used_licenses} / {pool.total_licenses}
                    </span>
                </div>

                <Progress value={utilizationPercent} className="h-2" />

                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Available</span>
                    <span className="font-medium text-green-600">
                        {pool.available_licenses}
                    </span>
                </div>
            </div>
        </div>
    );
}
