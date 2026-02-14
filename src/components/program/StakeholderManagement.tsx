import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Users, Mail, Phone, TrendingUp, Plus, Search } from 'lucide-react';
import { getProgramStakeholders, createProgramStakeholder, updateProgramStakeholder, deleteProgramStakeholder } from '@/services/programService';
import { useToast } from '@/hooks/use-toast';

interface Stakeholder {
    id: string;
    name: string;
    role: string;
    influence: 'high' | 'medium' | 'low';
    interest: 'high' | 'medium' | 'low';
    engagement_level: 'champion' | 'supporter' | 'neutral' | 'resistant';
    email: string;
    phone: string;
    satisfaction: number;
}

export function StakeholderManagement() {
    const { programId } = useParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        role: '',
        email: '',
        phone: '',
        influence: 'medium' as 'high' | 'medium' | 'low',
        interest: 'medium' as 'high' | 'medium' | 'low',
        engagement_level: 'neutral' as 'champion' | 'supporter' | 'neutral' | 'resistant',
        satisfaction: 50
    });
    const queryClient = useQueryClient();
    const { toast } = useToast();

    // Fetch stakeholders from database
    const { data: stakeholders, isLoading } = useQuery({
        queryKey: ['program-stakeholders', programId],
        queryFn: () => getProgramStakeholders(programId!),
        enabled: !!programId
    });

    // Create stakeholder mutation
    const createMutation = useMutation({
        mutationFn: (data: Omit<Stakeholder, 'id'>) => createProgramStakeholder(programId!, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['program-stakeholders', programId] });
            toast({
                title: 'Success',
                description: 'Stakeholder added successfully'
            });
            setAddDialogOpen(false);
            setFormData({
                name: '',
                role: '',
                email: '',
                phone: '',
                influence: 'medium',
                interest: 'medium',
                engagement_level: 'neutral',
                satisfaction: 50
            });
        },
        onError: (error) => {
            toast({
                title: 'Error',
                description: `Failed to add stakeholder: ${error.message}`,
                variant: 'destructive'
            });
        }
    });

    const handleSubmit = () => {
        if (!formData.name || !formData.role) {
            toast({
                title: 'Validation Error',
                description: 'Name and role are required',
                variant: 'destructive'
            });
            return;
        }
        createMutation.mutate(formData);
    };


    const filteredStakeholders = stakeholders?.filter(s =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const getInfluenceColor = (influence: string) => {
        switch (influence) {
            case 'high': return 'bg-red-100 text-red-700';
            case 'medium': return 'bg-orange-100 text-orange-700';
            case 'low': return 'bg-yellow-100 text-yellow-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getEngagementColor = (engagement: string) => {
        switch (engagement) {
            case 'champion': return 'bg-green-100 text-green-700';
            case 'supporter': return 'bg-blue-100 text-blue-700';
            case 'neutral': return 'bg-gray-100 text-gray-700';
            case 'resistant': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Stakeholder Management</h1>
                    <p className="text-muted-foreground">Manage program stakeholders and engagement</p>
                </div>
                <Button onClick={() => setAddDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Stakeholder
                </Button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-6">
                    <div className="flex items-center gap-3">
                        <Users className="w-8 h-8 text-blue-600" />
                        <div>
                            <p className="text-sm text-muted-foreground">Total Stakeholders</p>
                            <p className="text-2xl font-bold">{stakeholders?.length || 0}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center gap-3">
                        <TrendingUp className="w-8 h-8 text-green-600" />
                        <div>
                            <p className="text-sm text-muted-foreground">Champions</p>
                            <p className="text-2xl font-bold">
                                {stakeholders?.filter(s => s.engagement_level === 'champion').length || 0}
                            </p>
                        </div>
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center gap-3">
                        <Users className="w-8 h-8 text-red-600" />
                        <div>
                            <p className="text-sm text-muted-foreground">High Influence</p>
                            <p className="text-2xl font-bold">
                                {stakeholders?.filter(s => s.influence === 'high').length || 0}
                            </p>
                        </div>
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center gap-3">
                        <TrendingUp className="w-8 h-8 text-purple-600" />
                        <div>
                            <p className="text-sm text-muted-foreground">Avg Satisfaction</p>
                            <p className="text-2xl font-bold">
                                {stakeholders ? Math.round(stakeholders.reduce((sum, s) => sum + s.satisfaction, 0) / stakeholders.length) : 0}%
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Search stakeholders..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Influence-Interest Matrix */}
            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Influence-Interest Matrix</h2>
                <div className="grid grid-cols-2 gap-4 h-96">
                    <div className="border-2 border-green-200 bg-green-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-green-700 mb-2">Manage Closely</h3>
                        <p className="text-sm text-muted-foreground mb-3">High Influence, High Interest</p>
                        <div className="space-y-2">
                            {stakeholders?.filter(s => s.influence === 'high' && s.interest === 'high').map(s => (
                                <div key={s.id} className="text-sm bg-white p-2 rounded border">
                                    {s.name} - {s.role}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="border-2 border-blue-200 bg-blue-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-blue-700 mb-2">Keep Satisfied</h3>
                        <p className="text-sm text-muted-foreground mb-3">High Influence, Low Interest</p>
                        <div className="space-y-2">
                            {stakeholders?.filter(s => s.influence === 'high' && s.interest !== 'high').map(s => (
                                <div key={s.id} className="text-sm bg-white p-2 rounded border">
                                    {s.name} - {s.role}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="border-2 border-orange-200 bg-orange-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-orange-700 mb-2">Keep Informed</h3>
                        <p className="text-sm text-muted-foreground mb-3">Low Influence, High Interest</p>
                        <div className="space-y-2">
                            {stakeholders?.filter(s => s.influence !== 'high' && s.interest === 'high').map(s => (
                                <div key={s.id} className="text-sm bg-white p-2 rounded border">
                                    {s.name} - {s.role}
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="border-2 border-gray-200 bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-semibold text-gray-700 mb-2">Monitor</h3>
                        <p className="text-sm text-muted-foreground mb-3">Low Influence, Low Interest</p>
                        <div className="space-y-2">
                            {stakeholders?.filter(s => s.influence !== 'high' && s.interest !== 'high').map(s => (
                                <div key={s.id} className="text-sm bg-white p-2 rounded border">
                                    {s.name} - {s.role}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </Card>

            {/* Stakeholder Register */}
            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Stakeholder Register</h2>
                {isLoading ? (
                    <div className="text-center py-12 text-muted-foreground">Loading stakeholders...</div>
                ) : filteredStakeholders && filteredStakeholders.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3 px-4">Name</th>
                                    <th className="text-left py-3 px-4">Role</th>
                                    <th className="text-left py-3 px-4">Influence</th>
                                    <th className="text-left py-3 px-4">Interest</th>
                                    <th className="text-left py-3 px-4">Engagement</th>
                                    <th className="text-left py-3 px-4">Satisfaction</th>
                                    <th className="text-left py-3 px-4">Contact</th>
                                    <th className="text-left py-3 px-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredStakeholders.map((stakeholder) => (
                                    <tr key={stakeholder.id} className="border-b hover:bg-accent">
                                        <td className="py-3 px-4 font-medium">{stakeholder.name}</td>
                                        <td className="py-3 px-4 text-sm text-muted-foreground">{stakeholder.role}</td>
                                        <td className="py-3 px-4">
                                            <span className={`text-xs px-2 py-1 rounded ${getInfluenceColor(stakeholder.influence)}`}>
                                                {stakeholder.influence}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`text-xs px-2 py-1 rounded ${getInfluenceColor(stakeholder.interest)}`}>
                                                {stakeholder.interest}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`text-xs px-2 py-1 rounded ${getEngagementColor(stakeholder.engagement_level)}`}>
                                                {stakeholder.engagement_level}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[80px]">
                                                    <div
                                                        className="bg-green-600 h-2 rounded-full"
                                                        style={{ width: `${stakeholder.satisfaction}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm">{stakeholder.satisfaction}%</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex gap-2">
                                                <a href={`mailto:${stakeholder.email}`} className="text-blue-600 hover:underline" title="Send email" aria-label="Send email to stakeholder">
                                                    <Mail className="w-4 h-4" />
                                                </a>
                                                <a href={`tel:${stakeholder.phone}`} className="text-blue-600 hover:underline" title="Call phone" aria-label="Call stakeholder">
                                                    <Phone className="w-4 h-4" />
                                                </a>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm">Edit</Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-12 text-muted-foreground">
                        No stakeholders found
                    </div>
                )}
            </Card>

            {/* Add Stakeholder Dialog */}
            <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Stakeholder</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium">Name *</label>
                            <Input
                                placeholder="Stakeholder name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Role *</label>
                            <Input
                                placeholder="Role or title"
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Email</label>
                            <Input
                                type="email"
                                placeholder="email@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Phone</label>
                            <Input
                                placeholder="+1-555-0000"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium">Influence</label>
                                <select
                                    className="w-full border rounded-md p-2"
                                    value={formData.influence}
                                    onChange={(e) => setFormData({ ...formData, influence: e.target.value as any })}
                                    aria-label="Select stakeholder influence level"
                                >
                                    <option value="high">High</option>
                                    <option value="medium">Medium</option>
                                    <option value="low">Low</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium">Interest</label>
                                <select
                                    className="w-full border rounded-md p-2"
                                    value={formData.interest}
                                    onChange={(e) => setFormData({ ...formData, interest: e.target.value as any })}
                                    aria-label="Select stakeholder interest level"
                                >
                                    <option value="high">High</option>
                                    <option value="medium">Medium</option>
                                    <option value="low">Low</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium">Engagement</label>
                            <select
                                className="w-full border rounded-md p-2"
                                value={formData.engagement_level}
                                onChange={(e) => setFormData({ ...formData, engagement_level: e.target.value as any })}
                                aria-label="Select stakeholder engagement level"
                            >
                                <option value="champion">Champion</option>
                                <option value="supporter">Supporter</option>
                                <option value="neutral">Neutral</option>
                                <option value="resistant">Resistant</option>
                            </select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmit} disabled={createMutation.isPending}>
                            {createMutation.isPending ? 'Adding...' : 'Add Stakeholder'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
