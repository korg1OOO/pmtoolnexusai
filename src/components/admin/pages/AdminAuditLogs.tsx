/**
 * Admin Audit Logs
 * View system audit logs and user activity
 */

import React, { useState } from 'react';
import { FileText, Search, Filter, Download, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { useAdminAuditLogs } from '@/hooks/useAdmin';
import { Loader2 } from 'lucide-react';

export function AdminAuditLogs() {
    const [searchQuery, setSearchQuery] = useState('');
    const { data: auditLogs, isLoading } = useAdminAuditLogs();

    const filteredLogs = auditLogs?.filter(
        (log) =>
            log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
            log.resource.toLowerCase().includes(searchQuery.toLowerCase())
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
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <FileText className="h-8 w-8" />
                    Audit Logs
                </h1>
                <p className="text-muted-foreground mt-1">
                    View system audit logs and user activity
                </p>
            </div>

            {/* Search & Actions */}
            <div className="flex items-center justify-between">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search audit logs..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                    </Button>
                    <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Audit Logs Table */}
            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Action</TableHead>
                            <TableHead>User</TableHead>
                            <TableHead>Resource</TableHead>
                            <TableHead>IP Address</TableHead>
                            <TableHead>Timestamp</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredLogs?.map((log) => (
                            <TableRow key={log.id}>
                                <TableCell className="font-mono text-sm">{log.action}</TableCell>
                                <TableCell className="text-sm">
                                    {(log as any).profiles?.email || (log as any).user_id}
                                </TableCell>
                                <TableCell className="font-mono text-sm text-muted-foreground">
                                    {log.resource}
                                </TableCell>
                                <TableCell className="font-mono text-sm text-muted-foreground">
                                    {log.ip_address}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {new Date(log.created_at).toLocaleString()}
                                </TableCell>
                                <TableCell>
                                    {log.status === 'success' ? (
                                        <Badge
                                            variant="outline"
                                            className="bg-success/20 text-success border-success/30"
                                        >
                                            <Check className="h-3 w-3 mr-1" />
                                            Success
                                        </Badge>
                                    ) : (
                                        <Badge
                                            variant="outline"
                                            className="bg-destructive/20 text-destructive border-destructive/30"
                                        >
                                            <X className="h-3 w-3 mr-1" />
                                            Failed
                                        </Badge>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))}
                        {filteredLogs?.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="text-center py-8 text-muted-foreground"
                                >
                                    No audit logs found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
