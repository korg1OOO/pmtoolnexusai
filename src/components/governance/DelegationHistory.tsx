import React, { useState, useEffect } from 'react';
import { Clock, User, Calendar, Filter, ChevronRight, X } from 'lucide-react';
import {
    getDelegationHistory,
    revokeDelegation,
    extendDelegation,
} from '@/services/delegationService';
import type { DelegationHistoryItem, DelegationHistoryFilters } from '@/types/analytics';

interface DelegationHistoryProps {
    userId: string;
}

export default function DelegationHistory({ userId }: DelegationHistoryProps) {
    const [delegations, setDelegations] = useState<DelegationHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState<DelegationHistoryFilters>({});
    const [selectedDelegation, setSelectedDelegation] = useState<DelegationHistoryItem | null>(null);

    useEffect(() => {
        loadHistory();
    }, [userId, filters]);

    const loadHistory = async () => {
        try {
            setLoading(true);
            const data = await getDelegationHistory(userId, filters);
            setDelegations(data);
        } catch (error) {
            console.error('Error loading delegation history:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRevoke = async (delegationId: string) => {
        if (!confirm('Are you sure you want to revoke this delegation?')) return;

        try {
            await revokeDelegation(delegationId, userId, 'Revoked by user');
            loadHistory();
        } catch (error) {
            console.error('Error revoking delegation:', error);
            alert('Failed to revoke delegation');
        }
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            active: 'bg-green-100 text-green-700',
            completed: 'bg-blue-100 text-blue-700',
            revoked: 'bg-red-100 text-red-700',
            expired: 'bg-gray-100 text-gray-700',
        };
        return (
            <span className={`px-2 py-1 text-xs font-medium rounded ${styles[status as keyof typeof styles]}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Delegation History</h2>
                <p className="text-sm text-gray-500 mt-1">
                    View and manage your approval delegations
                </p>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Status
                        </label>
                        <select
                            value={filters.status || ''}
                            onChange={(e) =>
                                setFilters({ ...filters, status: e.target.value as any || undefined })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                            <option value="">All Statuses</option>
                            <option value="active">Active</option>
                            <option value="completed">Completed</option>
                            <option value="revoked">Revoked</option>
                            <option value="expired">Expired</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Type
                        </label>
                        <select
                            value={filters.delegationType || ''}
                            onChange={(e) =>
                                setFilters({ ...filters, delegationType: e.target.value as any || undefined })
                            }
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        >
                            <option value="">All Types</option>
                            <option value="temporary">Temporary</option>
                            <option value="permanent">Permanent</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button
                            onClick={() => setFilters({})}
                            className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            </div>

            {/* Delegation List */}
            <div className="space-y-3">
                {delegations.length === 0 ? (
                    <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
                        No delegations found
                    </div>
                ) : (
                    delegations.map((delegation) => (
                        <div
                            key={delegation.id}
                            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h3 className="font-semibold text-gray-900">
                                            {delegation.approvalTitle || 'Permanent Delegation'}
                                        </h3>
                                        {getStatusBadge(delegation.status)}
                                        {delegation.delegationDepth > 0 && (
                                            <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded">
                                                Sub-delegation (Level {delegation.delegationDepth})
                                            </span>
                                        )}
                                    </div>
                                    <div className="space-y-1 text-sm text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <User className="w-4 h-4" />
                                            <span>
                                                From: <strong>{delegation.delegatorName}</strong> →
                                                To: <strong>{delegation.delegateName}</strong>
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Clock className="w-4 h-4" />
                                            <span>Created: {formatDate(delegation.createdAt)}</span>
                                        </div>
                                        {delegation.expiresAt && (
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4" />
                                                <span>Expires: {formatDate(delegation.expiresAt)}</span>
                                            </div>
                                        )}
                                        {delegation.reason && (
                                            <p className="mt-2 text-gray-700">
                                                <strong>Reason:</strong> {delegation.reason}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                {delegation.status === 'active' && delegation.delegatorId === userId && (
                                    <button
                                        onClick={() => handleRevoke(delegation.id)}
                                        className="ml-4 px-3 py-1 text-sm text-red-600 bg-red-50 rounded hover:bg-red-100 transition-colors"
                                    >
                                        Revoke
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
