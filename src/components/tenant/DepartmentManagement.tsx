import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Building2, Plus, Edit, Trash2, Users, DollarSign, ChevronRight, ChevronDown } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Department {
    id: string;
    name: string;
    parent_department_id: string | null;
    manager_id: string | null;
    manager_name?: string;
    budget: number;
    member_count: number;
    children?: Department[];
}

export function DepartmentManagement() {
    const [tenantId] = useState('default-tenant-id');
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
    const queryClient = useQueryClient();

    // Mock data - replace with actual API call
    const { data: departments, isLoading } = useQuery({
        queryKey: ['departments', tenantId],
        queryFn: async () => {
            // TODO: Implement actual API call
            const mockDepartments: Department[] = [
                {
                    id: '1',
                    name: 'Engineering',
                    parent_department_id: null,
                    manager_id: 'user1',
                    manager_name: 'John Doe',
                    budget: 500000,
                    member_count: 25,
                    children: [
                        {
                            id: '2',
                            name: 'Frontend',
                            parent_department_id: '1',
                            manager_id: 'user2',
                            manager_name: 'Jane Smith',
                            budget: 200000,
                            member_count: 10
                        },
                        {
                            id: '3',
                            name: 'Backend',
                            parent_department_id: '1',
                            manager_id: 'user3',
                            manager_name: 'Bob Johnson',
                            budget: 300000,
                            member_count: 15
                        }
                    ]
                },
                {
                    id: '4',
                    name: 'Marketing',
                    parent_department_id: null,
                    manager_id: 'user4',
                    manager_name: 'Alice Brown',
                    budget: 300000,
                    member_count: 12
                }
            ];
            return mockDepartments;
        }
    });

    const createMutation = useMutation({
        mutationFn: async (data: Partial<Department>) => {
            // TODO: Implement actual API call
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
            toast.success('Department created successfully');
            setCreateDialogOpen(false);
        }
    });

    const updateMutation = useMutation({
        mutationFn: async ({ id, data }: { id: string; data: Partial<Department> }) => {
            // TODO: Implement actual API call
            return { id, ...data };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
            toast.success('Department updated successfully');
            setEditDialogOpen(false);
        }
    });

    const deleteMutation = useMutation({
        mutationFn: async (id: string) => {
            // TODO: Implement actual API call
            return id;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['departments'] });
            toast.success('Department deleted successfully');
        }
    });

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Department Management</h1>
                    <p className="text-muted-foreground">Organize your company structure</p>
                </div>
                <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Department
                </Button>
            </div>

            {/* Department Tree */}
            {isLoading ? (
                <div className="text-center py-12 text-muted-foreground">Loading departments...</div>
            ) : departments && departments.length > 0 ? (
                <div className="space-y-4">
                    {departments.map((dept) => (
                        <DepartmentNode
                            key={dept.id}
                            department={dept}
                            onEdit={(d) => {
                                setSelectedDepartment(d);
                                setEditDialogOpen(true);
                            }}
                            onDelete={(id) => {
                                if (confirm('Are you sure you want to delete this department?')) {
                                    deleteMutation.mutate(id);
                                }
                            }}
                        />
                    ))}
                </div>
            ) : (
                <Card className="p-12 text-center">
                    <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No departments found</h3>
                    <p className="text-muted-foreground mb-4">Create your first department to get started</p>
                    <Button onClick={() => setCreateDialogOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Create Department
                    </Button>
                </Card>
            )}

            {/* Create Dialog */}
            <DepartmentDialog
                open={createDialogOpen}
                onClose={() => setCreateDialogOpen(false)}
                onSubmit={(data) => createMutation.mutate(data)}
                isLoading={createMutation.isPending}
                title="Create Department"
            />

            {/* Edit Dialog */}
            {selectedDepartment && (
                <DepartmentDialog
                    open={editDialogOpen}
                    department={selectedDepartment}
                    onClose={() => {
                        setEditDialogOpen(false);
                        setSelectedDepartment(null);
                    }}
                    onSubmit={(data) => updateMutation.mutate({ id: selectedDepartment.id, data })}
                    isLoading={updateMutation.isPending}
                    title="Edit Department"
                />
            )}
        </div>
    );
}

function DepartmentNode({ department, onEdit, onDelete, level = 0 }: {
    department: Department;
    onEdit: (dept: Department) => void;
    onDelete: (id: string) => void;
    level?: number;
}) {
    const [expanded, setExpanded] = useState(true);
    const hasChildren = department.children && department.children.length > 0;

    return (
        <div>
            <Card className="p-4" style={{ marginLeft: `${level * 24}px` }}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                        {hasChildren && (
                            <button onClick={() => setExpanded(!expanded)} className="p-1 hover:bg-accent rounded">
                                {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                        )}
                        {!hasChildren && <div className="w-6" />}

                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-primary" />
                        </div>

                        <div className="flex-1">
                            <h3 className="font-semibold">{department.name}</h3>
                            <p className="text-sm text-muted-foreground">
                                Manager: {department.manager_name || 'Unassigned'}
                            </p>
                        </div>

                        <div className="flex items-center gap-6 text-sm">
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-muted-foreground" />
                                <span>{department.member_count} members</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <DollarSign className="w-4 h-4 text-muted-foreground" />
                                <span>${(department.budget / 1000).toFixed(0)}K</span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => onEdit(department)}>
                                <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => onDelete(department.id)}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Children */}
            {expanded && hasChildren && (
                <div className="mt-2">
                    {department.children!.map((child) => (
                        <DepartmentNode
                            key={child.id}
                            department={child}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            level={level + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

function DepartmentDialog({ open, department, onClose, onSubmit, isLoading, title }: {
    open: boolean;
    department?: Department;
    onClose: () => void;
    onSubmit: (data: Partial<Department>) => void;
    isLoading: boolean;
    title: string;
}) {
    const [name, setName] = useState(department?.name || '');
    const [budget, setBudget] = useState(department?.budget || 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSubmit({ name, budget });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium">Department Name</label>
                        <Input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Engineering"
                            required
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Budget ($)</label>
                        <Input
                            type="number"
                            value={budget}
                            onChange={(e) => setBudget(Number(e.target.value))}
                            placeholder="500000"
                            required
                        />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? 'Saving...' : 'Save'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
