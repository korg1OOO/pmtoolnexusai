/**
 * Admin Organizations Management
 * Manage organizations, plans, and tenant settings
 */

import React, { useState } from 'react';
import { Building2, Users, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminOrganizations } from '@/hooks/useAdmin';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusColors: Record<string, string> = {
    active: 'bg-success/20 text-success border-success/30',
    inactive: 'bg-muted text-muted-foreground border-border',
    suspended: 'bg-destructive/20 text-destructive border-destructive/30',
};

export function AdminOrganizations() {
    const [searchQuery, setSearchQuery] = useState('');
    const { data: organizations, isLoading, refetch } = useAdminOrganizations();

    const filteredOrgs = organizations?.filter(org =>
        org.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full p-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Organizations</h1>
                <p className="text-muted-foreground mt-1">
                    Manage organizations, plans, and tenant settings
                </p>
            </div>

            {/* Search & Actions */}
            <div className="flex items-center justify-between">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search organizations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Organization
                </Button>
            </div>

            {/* Organizations Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredOrgs?.map((org) => (
                    <Card
                        key={org.id}
                        className="hover:border-primary/50 transition-colors cursor-pointer"
                    >
                        <CardHeader className="pb-2">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                                        <Building2 className="h-5 w-5 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base">{org.name}</CardTitle>
                                        <Badge variant="outline" className="mt-1 capitalize">
                                            {org.plan}
                                        </Badge>
                                    </div>
                                </div>
                                <Badge
                                    variant="outline"
                                    className={cn(statusColors[org.status || 'active'])}
                                >
                                    {org.status}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center gap-6 text-sm">
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <span>{org.user_count || 0} users</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-muted-foreground" />
                                    <span>{org.project_count || 0} projects</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {filteredOrgs?.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                        No organizations found.
                    </div>
                )}
            </div>
        </div>
    );
}
