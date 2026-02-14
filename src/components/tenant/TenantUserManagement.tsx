/**
 * Tenant User Management
 */

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Plus, Search, Shield, Mail, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TenantUser {
    user_id: string;
    email: string;
    role: string;
    workspace_name: string;
}

interface TenantUserManagementProps {
    tenantId: string;
}

export function TenantUserManagement({ tenantId }: TenantUserManagementProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
    const queryClient = useQueryClient();

    const { data: users = [], isLoading } = useQuery({
        queryKey: ['tenant-users', tenantId],
        queryFn: async (): Promise<TenantUser[]> => {
            // Simplified query - get profiles as a proxy for users
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, email')
                .limit(50);

            if (error) throw error;
            return (data || []).map((u: any) => ({
                user_id: u.id,
                email: u.email || u.full_name || 'Unknown',
                role: 'member',
                workspace_name: 'Default',
            }));
        },
    });

    const filteredUsers = users.filter(u =>
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Users className="h-6 w-6" />User Management
                </h2>
                <Button onClick={() => setInviteDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />Invite User
                </Button>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search users..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Workspace</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredUsers.map((user) => (
                                <TableRow key={user.user_id}>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell><Badge variant="outline">{user.role}</Badge></TableCell>
                                    <TableCell>{user.workspace_name}</TableCell>
                                </TableRow>
                            ))}
                            {filteredUsers.length === 0 && (
                                <TableRow><TableCell colSpan={3} className="text-center py-8 text-muted-foreground">No users found</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}