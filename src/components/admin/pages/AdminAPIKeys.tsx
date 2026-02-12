/**
 * Admin API Keys Management
 * Manage API keys for programmatic access
 */

import React from 'react';
import { Key, Plus, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { useAdminApiKeys, useRevokeApiKey } from '@/hooks/useAdmin';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusColors: Record<string, string> = {
    active: 'bg-success/20 text-success border-success/30',
    revoked: 'bg-destructive/20 text-destructive border-destructive/30',
};

export function AdminAPIKeys() {
    const { data: apiKeys, isLoading } = useAdminApiKeys();
    const revokeKey = useRevokeApiKey();

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
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Key className="h-8 w-8" />
                    API Keys
                </h1>
                <p className="text-muted-foreground mt-1">
                    Manage API keys for programmatic access to the platform
                </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end">
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create API Key
                </Button>
            </div>

            {/* API Keys Table */}
            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Key Prefix</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Last Used</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {apiKeys?.map((key) => (
                            <TableRow key={key.id}>
                                <TableCell className="font-medium">{key.name}</TableCell>
                                <TableCell className="font-mono text-sm text-muted-foreground">
                                    {key.prefix}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {new Date(key.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {key.last_used_at
                                        ? new Date(key.last_used_at).toLocaleDateString()
                                        : 'Never'}
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant="outline"
                                        className={cn(statusColors[key.status || 'active'])}
                                    >
                                        {key.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Button
                                        variant="ghost"
                                        size="iconSm"
                                        onClick={() => revokeKey.mutate(key.id)}
                                    >
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {apiKeys?.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="text-center py-8 text-muted-foreground"
                                >
                                    No API keys found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
