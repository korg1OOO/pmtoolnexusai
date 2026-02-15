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
import { Search, ChevronRight, FileText } from 'lucide-react';
import type { PolicyDocument } from '@/types/analytics';

interface PolicyDocumentsProps {
    policies: PolicyDocument[];
    onViewDocument: (policy: PolicyDocument) => void;
    loading?: boolean;
}

export function PolicyDocuments({
    policies,
    onViewDocument,
    loading = false,
}: PolicyDocumentsProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [mandatoryFilter, setMandatoryFilter] = useState<string>('all');

    const formatDate = (date: Date) => {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        }).format(date);
    };

    const getStatusBadge = (status: string) => {
        const config = {
            active: { variant: 'default' as const, label: 'Active' },
            draft: { variant: 'secondary' as const, label: 'Draft' },
            archived: { variant: 'outline' as const, label: 'Archived' },
        };
        return config[status as keyof typeof config] || config.active;
    };

    // Filter and search policies
    const filteredPolicies = useMemo(() => {
        return policies.filter((policy) => {
            // Search filter
            if (searchQuery) {
                const query = searchQuery.toLowerCase();
                const matchesSearch =
                    policy.title.toLowerCase().includes(query) ||
                    policy.category.toLowerCase().includes(query) ||
                    policy.owner.toLowerCase().includes(query);
                if (!matchesSearch) return false;
            }

            // Status filter
            if (statusFilter !== 'all' && policy.status !== statusFilter) {
                return false;
            }

            // Mandatory filter
            if (mandatoryFilter === 'mandatory' && !policy.mandatory) {
                return false;
            }
            if (mandatoryFilter === 'optional' && policy.mandatory) {
                return false;
            }

            return true;
        });
    }, [policies, searchQuery, statusFilter, mandatoryFilter]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">Loading policies...</div>
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
                        placeholder="Search policies by title, category, or owner..."
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
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                            <SelectItem value="archived">Archived</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={mandatoryFilter} onValueChange={setMandatoryFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="mandatory">Mandatory Only</SelectItem>
                            <SelectItem value="optional">Optional Only</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Results count */}
            <div className="text-sm text-muted-foreground">
                Showing {filteredPolicies.length} of {policies.length} policies
            </div>

            {/* Policy List */}
            {filteredPolicies.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No policies found</p>
                    <p className="text-sm text-muted-foreground">
                        Try adjusting your search or filters
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredPolicies.map((policy) => {
                        const statusConfig = getStatusBadge(policy.status);
                        return (
                            <Card key={policy.id} className="p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold">{policy.title}</h3>
                                            {policy.mandatory && (
                                                <Badge variant="destructive" className="text-xs">
                                                    Mandatory
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">{policy.category}</p>
                                    </div>
                                    <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-2 text-sm mt-3">
                                    <div>
                                        <span className="text-muted-foreground">Version:</span> {policy.version}
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Owner:</span> {policy.owner}
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Last Reviewed:</span>{' '}
                                        {formatDate(policy.lastReviewed)}
                                    </div>
                                    <div>
                                        <span className="text-muted-foreground">Next Review:</span>{' '}
                                        {formatDate(policy.nextReview)}
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-3 w-full"
                                    onClick={() => onViewDocument(policy)}
                                >
                                    View Document
                                    <ChevronRight className="h-4 w-4 ml-2" />
                                </Button>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
