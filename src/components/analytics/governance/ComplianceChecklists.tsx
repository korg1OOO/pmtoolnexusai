import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Search, CheckSquare, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import type { ComplianceChecklist, ChecklistItem } from '@/types/analytics';

interface ComplianceChecklistsProps {
    compliance: ComplianceChecklist[];
    onViewEvidence?: (item: ChecklistItem) => void;
    onUpdateItem?: (itemId: string, status: string) => void;
    loading?: boolean;
}

export function ComplianceChecklists({
    compliance,
    onViewEvidence,
    onUpdateItem,
    loading = false,
}: ComplianceChecklistsProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [priorityFilter, setPriorityFilter] = useState<string>('all');
    const [expandedChecklists, setExpandedChecklists] = useState<Set<string>>(new Set());

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        }).format(date);
    };

    const getStatusBadge = (status: string) => {
        const config = {
            compliant: { variant: 'default' as const, label: 'Compliant', color: 'text-green-600' },
            'non-compliant': { variant: 'destructive' as const, label: 'Non-Compliant' },
            'in-progress': { variant: 'secondary' as const, label: 'In Progress' },
            'not-applicable': { variant: 'outline' as const, label: 'N/A' },
        };
        return config[status as keyof typeof config] || config['in-progress'];
    };

    const getPriorityBadge = (priority: string) => {
        const config = {
            critical: { variant: 'destructive' as const, label: 'Critical' },
            high: { variant: 'destructive' as const, label: 'High' },
            medium: { variant: 'secondary' as const, label: 'Medium' },
            low: { variant: 'outline' as const, label: 'Low' },
        };
        return config[priority as keyof typeof config] || config.medium;
    };

    const toggleExpanded = (checklistId: string) => {
        const newExpanded = new Set(expandedChecklists);
        if (newExpanded.has(checklistId)) {
            newExpanded.delete(checklistId);
        } else {
            newExpanded.add(checklistId);
        }
        setExpandedChecklists(newExpanded);
    };

    // Filter compliance checklists
    const filteredCompliance = useMemo(() => {
        return compliance.map((checklist) => {
            // Filter items within each checklist
            const filteredItems = checklist.items.filter((item) => {
                // Search filter
                if (searchQuery) {
                    const query = searchQuery.toLowerCase();
                    const matchesSearch =
                        item.requirement.toLowerCase().includes(query) ||
                        (item.description && item.description.toLowerCase().includes(query));
                    if (!matchesSearch) return false;
                }

                // Status filter
                if (statusFilter !== 'all' && item.status !== statusFilter) {
                    return false;
                }

                // Priority filter
                if (priorityFilter !== 'all' && item.priority !== priorityFilter) {
                    return false;
                }

                return true;
            });

            return {
                ...checklist,
                items: filteredItems,
            };
        }).filter((checklist) => checklist.items.length > 0);
    }, [compliance, searchQuery, statusFilter, priorityFilter]);

    const totalItems = compliance.reduce((sum, c) => sum + c.items.length, 0);
    const filteredItemsCount = filteredCompliance.reduce((sum, c) => sum + c.items.length, 0);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">Loading compliance data...</div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Search and Filters */}
            <div className="space-y-3">
                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search requirements..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Statuses</SelectItem>
                            <SelectItem value="compliant">Compliant</SelectItem>
                            <SelectItem value="non-compliant">Non-Compliant</SelectItem>
                            <SelectItem value="in-progress">In Progress</SelectItem>
                            <SelectItem value="not-applicable">Not Applicable</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by priority" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Priorities</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Results count */}
            <div className="text-sm text-muted-foreground">
                Showing {filteredItemsCount} of {totalItems} requirements
            </div>

            {/* Compliance List */}
            {filteredCompliance.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                    <CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No compliance items found</p>
                    <p className="text-sm text-muted-foreground">
                        Try adjusting your search or filters
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredCompliance.map((comp) => {
                        const statusConfig = getStatusBadge(comp.status);
                        const isExpanded = expandedChecklists.has(comp.id);

                        return (
                            <Card key={comp.id} className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex-1">
                                        <h3 className="font-semibold">{comp.framework}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {comp.completionPercent}% Complete • {comp.items.length} requirements
                                        </p>
                                    </div>
                                    <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                                </div>

                                {/* Progress Bar */}
                                <div className="w-full bg-muted rounded-full h-2 mb-3">
                                    <div
                                        className="bg-primary h-2 rounded-full transition-all"
                                        style={{ width: `${comp.completionPercent}%` }}
                                    />
                                </div>

                                {/* Checklist Items */}
                                <div className="space-y-2 mb-3">
                                    {comp.items.slice(0, isExpanded ? undefined : 3).map((item) => {
                                        const itemStatus = getStatusBadge(item.status);
                                        const itemPriority = getPriorityBadge(item.priority);

                                        return (
                                            <div
                                                key={item.id}
                                                className="flex items-start justify-between p-2 border rounded hover:bg-muted/50 transition-colors"
                                            >
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="text-sm font-medium">{item.requirement}</p>
                                                        <Badge variant={itemPriority.variant} className="text-xs">
                                                            {itemPriority.label}
                                                        </Badge>
                                                    </div>
                                                    {item.notes && (
                                                        <p className="text-xs text-muted-foreground">{item.notes}</p>
                                                    )}
                                                    {item.evidence && item.evidence.length > 0 && onViewEvidence && (
                                                        <Button
                                                            variant="link"
                                                            size="sm"
                                                            className="h-auto p-0 text-xs mt-1"
                                                            onClick={() => onViewEvidence(item)}
                                                        >
                                                            <FileText className="h-3 w-3 mr-1" />
                                                            View Evidence ({item.evidence.length})
                                                        </Button>
                                                    )}
                                                </div>
                                                <Badge variant={itemStatus.variant} className="text-xs ml-2">
                                                    {itemStatus.label}
                                                </Badge>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Expand/Collapse Button */}
                                {comp.items.length > 3 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full mb-3"
                                        onClick={() => toggleExpanded(comp.id)}
                                    >
                                        {isExpanded ? (
                                            <>
                                                Show Less <ChevronUp className="h-4 w-4 ml-2" />
                                            </>
                                        ) : (
                                            <>
                                                Show All ({comp.items.length} requirements){' '}
                                                <ChevronDown className="h-4 w-4 ml-2" />
                                            </>
                                        )}
                                    </Button>
                                )}

                                {/* Metadata */}
                                <div className="text-xs text-muted-foreground border-t pt-3">
                                    Last Audit: {formatDate(comp.lastAudit)} | Next: {formatDate(comp.nextAudit)}
                                    {comp.auditor && <> • Auditor: {comp.auditor}</>}
                                </div>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
