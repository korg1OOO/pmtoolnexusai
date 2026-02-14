import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Users, Plus, Search, UserPlus, Mail, Shield } from 'lucide-react';

interface TeamMember {
    id: string;
    user_id: string;
    name: string;
    email: string;
    role: string;
    skills: string[];
    allocation: number;
    availability: 'available' | 'partial' | 'unavailable';
}

export function TeamAssignment() {
    const { workspaceId } = useParams();
    const [searchQuery, setSearchQuery] = useState('');
    const [assignDialogOpen, setAssignDialogOpen] = useState(false);
    const queryClient = useQueryClient();

    const { data: members, isLoading } = useQuery({
        queryKey: ['workspace-members', workspaceId],
        queryFn: async () => {
            // Mock data
            const mockMembers: TeamMember[] = [
                {
                    id: '1',
                    user_id: 'user1',
                    name: 'John Doe',
                    email: 'john@example.com',
                    role: 'Portfolio Manager',
                    skills: ['Strategy', 'Leadership', 'Finance'],
                    allocation: 100,
                    availability: 'available'
                },
                {
                    id: '2',
                    user_id: 'user2',
                    name: 'Jane Smith',
                    email: 'jane@example.com',
                    role: 'Program Manager',
                    skills: ['Agile', 'Scrum', 'Risk Management'],
                    allocation: 80,
                    availability: 'partial'
                },
                {
                    id: '3',
                    user_id: 'user3',
                    name: 'Bob Johnson',
                    email: 'bob@example.com',
                    role: 'Project Manager',
                    skills: ['PMP', 'Waterfall', 'MS Project'],
                    allocation: 100,
                    availability: 'available'
                }
            ];
            return mockMembers;
        }
    });

    const filteredMembers = members?.filter(m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Team Management</h1>
                    <p className="text-muted-foreground">Manage workspace team members and assignments</p>
                </div>
                <Button onClick={() => setAssignDialogOpen(true)}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Assign Member
                </Button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                    placeholder="Search team members..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-6">
                    <div className="flex items-center gap-3">
                        <Users className="w-8 h-8 text-blue-600" />
                        <div>
                            <p className="text-sm text-muted-foreground">Total Members</p>
                            <p className="text-2xl font-bold">{members?.length || 0}</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center gap-3">
                        <Shield className="w-8 h-8 text-green-600" />
                        <div>
                            <p className="text-sm text-muted-foreground">Portfolio Managers</p>
                            <p className="text-2xl font-bold">
                                {members?.filter(m => m.role === 'Portfolio Manager').length || 0}
                            </p>
                        </div>
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center gap-3">
                        <Shield className="w-8 h-8 text-purple-600" />
                        <div>
                            <p className="text-sm text-muted-foreground">Program Managers</p>
                            <p className="text-2xl font-bold">
                                {members?.filter(m => m.role === 'Program Manager').length || 0}
                            </p>
                        </div>
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center gap-3">
                        <Shield className="w-8 h-8 text-orange-600" />
                        <div>
                            <p className="text-sm text-muted-foreground">Project Managers</p>
                            <p className="text-2xl font-bold">
                                {members?.filter(m => m.role === 'Project Manager').length || 0}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Team Members Table */}
            {isLoading ? (
                <div className="text-center py-12 text-muted-foreground">Loading team members...</div>
            ) : filteredMembers && filteredMembers.length > 0 ? (
                <Card className="p-6">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="text-left py-3 px-4">Member</th>
                                    <th className="text-left py-3 px-4">Role</th>
                                    <th className="text-left py-3 px-4">Skills</th>
                                    <th className="text-left py-3 px-4">Allocation</th>
                                    <th className="text-left py-3 px-4">Availability</th>
                                    <th className="text-left py-3 px-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredMembers.map((member) => (
                                    <tr key={member.id} className="border-b hover:bg-accent">
                                        <td className="py-3 px-4">
                                            <div>
                                                <div className="font-medium">{member.name}</div>
                                                <div className="text-sm text-muted-foreground">{member.email}</div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                                                <Shield className="w-3 h-3" />
                                                {member.role}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex flex-wrap gap-1">
                                                {member.skills.slice(0, 2).map((skill, idx) => (
                                                    <span key={idx} className="text-xs px-2 py-1 bg-gray-100 rounded">
                                                        {skill}
                                                    </span>
                                                ))}
                                                {member.skills.length > 2 && (
                                                    <span className="text-xs px-2 py-1 bg-gray-100 rounded">
                                                        +{member.skills.length - 2}
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                                                    <div
                                                        className="bg-blue-600 h-2 rounded-full"
                                                        style={{ width: `${member.allocation}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm">{member.allocation}%</span>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`text-xs px-2 py-1 rounded ${member.availability === 'available' ? 'bg-green-100 text-green-700' :
                                                    member.availability === 'partial' ? 'bg-orange-100 text-orange-700' :
                                                        'bg-red-100 text-red-700'
                                                }`}>
                                                {member.availability === 'available' ? 'Available' :
                                                    member.availability === 'partial' ? 'Partial' : 'Unavailable'}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="flex gap-2">
                                                <Button variant="outline" size="sm">Edit</Button>
                                                <Button variant="outline" size="sm">Remove</Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            ) : (
                <Card className="p-12 text-center">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No team members found</h3>
                    <p className="text-muted-foreground mb-4">
                        {searchQuery ? 'Try adjusting your search' : 'Assign members to this workspace'}
                    </p>
                    {!searchQuery && (
                        <Button onClick={() => setAssignDialogOpen(true)}>
                            <UserPlus className="w-4 h-4 mr-2" />
                            Assign Member
                        </Button>
                    )}
                </Card>
            )}

            {/* Assign Dialog */}
            <AssignMemberDialog
                open={assignDialogOpen}
                onClose={() => setAssignDialogOpen(false)}
            />
        </div>
    );
}

function AssignMemberDialog({ open, onClose }: {
    open: boolean;
    onClose: () => void;
}) {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('Project Manager');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // TODO: Implement assign logic
        onClose();
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Assign Team Member</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">Email</label>
                        <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="user@example.com"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Role</label>
                        <select
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="w-full border rounded-md p-2"
                            required
                        >
                            <option value="Portfolio Manager">Portfolio Manager</option>
                            <option value="Program Manager">Program Manager</option>
                            <option value="Project Manager">Project Manager</option>
                            <option value="Team Member">Team Member</option>
                        </select>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit">Assign Member</Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
