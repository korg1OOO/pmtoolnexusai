/**
 * Admin Audit Logs
 * View system audit logs and user activity — with filter popover and CSV export
 */

import React, { useState, useMemo } from 'react';
import { FileText, Search, Filter, Download, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useAdminAuditLogs } from '@/hooks/useAdmin';

function exportLogsToCSV(logs: any[]) {
    const headers = ['Action', 'User', 'Resource', 'IP Address', 'Timestamp', 'Status'];
    const rows = logs.map(l => [
        l.action,
        l.profiles?.email || l.user_id || '',
        l.resource,
        l.ip_address ?? '',
        new Date(l.created_at).toLocaleString(),
        l.status ?? '',
    ]);
    const csv = [headers, ...rows]
        .map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','))
        .join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

export function AdminAuditLogs() {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'failed'>('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [filterOpen, setFilterOpen] = useState(false);
    const { data: auditLogs, isLoading } = useAdminAuditLogs();

    const filteredLogs = useMemo(() =>
        auditLogs?.filter(log => {
            const matchesSearch =
                log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
                log.resource.toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'all' || log.status === statusFilter;
            const logDate = new Date(log.created_at);
            const matchesFrom = !dateFrom || logDate >= new Date(dateFrom);
            const matchesTo = !dateTo || logDate <= new Date(dateTo + 'T23:59:59');
            return matchesSearch && matchesStatus && matchesFrom && matchesTo;
        }),
        [auditLogs, searchQuery, statusFilter, dateFrom, dateTo]
    );

    const activeFiltersCount = (statusFilter !== 'all' ? 1 : 0) + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full p-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
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
                    <Popover open={filterOpen} onOpenChange={setFilterOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="relative">
                                <Filter className="h-4 w-4 mr-2" />
                                Filter
                                {activeFiltersCount > 0 && (
                                    <span className="ml-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                                        {activeFiltersCount}
                                    </span>
                                )}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 space-y-4 p-4">
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={statusFilter} onValueChange={v => setStatusFilter(v as any)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All</SelectItem>
                                        <SelectItem value="success">Success</SelectItem>
                                        <SelectItem value="failed">Failed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>From Date</Label>
                                <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>To Date</Label>
                                <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                            </div>
                            {activeFiltersCount > 0 && (
                                <Button variant="ghost" size="sm" className="w-full" onClick={() => {
                                    setStatusFilter('all'); setDateFrom(''); setDateTo('');
                                }}>
                                    <X className="h-3 w-3 mr-2" /> Clear filters
                                </Button>
                            )}
                        </PopoverContent>
                    </Popover>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => filteredLogs && exportLogsToCSV(filteredLogs)}
                    >
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
