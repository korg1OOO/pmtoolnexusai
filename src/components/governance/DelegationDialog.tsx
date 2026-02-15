import React, { useState, useEffect } from 'react';
import { X, Search, Users, Calendar, ChevronDown, Save } from 'lucide-react';
import {
    bulkDelegateApprovals,
    getDelegationTemplates,
    applyDelegationTemplate,
    searchUsersForDelegation,
} from '@/services/delegationService';
import type { DelegationTemplate } from '@/types/analytics';

interface DelegationDialogProps {
    isOpen: boolean;
    onClose: () => void;
    approvalIds: string[];
    delegatorId: string;
    onSuccess?: () => void;
}

export default function DelegationDialog({
    isOpen,
    onClose,
    approvalIds,
    delegatorId,
    onSuccess,
}: DelegationDialogProps) {
    const [delegateId, setDelegateId] = useState('');
    const [delegationType, setDelegationType] = useState<'temporary' | 'permanent'>('temporary');
    const [reason, setReason] = useState('');
    const [expiryDate, setExpiryDate] = useState('');
    const [canSubdelegate, setCanSubdelegate] = useState(false);
    const [useTemplate, setUseTemplate] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState('');
    const [templates, setTemplates] = useState<DelegationTemplate[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string; email: string }>>([]);
    const [showSearch, setShowSearch] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadTemplates();
        }
    }, [isOpen]);

    useEffect(() => {
        if (searchQuery.length >= 2) {
            searchUsers();
        } else {
            setSearchResults([]);
        }
    }, [searchQuery]);

    const loadTemplates = async () => {
        try {
            const data = await getDelegationTemplates(delegatorId);
            setTemplates(data);
        } catch (error) {
            console.error('Error loading templates:', error);
        }
    };

    const searchUsers = async () => {
        try {
            const results = await searchUsersForDelegation(searchQuery, delegatorId);
            setSearchResults(results);
        } catch (error) {
            console.error('Error searching users:', error);
        }
    };

    const handleSelectUser = (user: { id: string; name: string; email: string }) => {
        setDelegateId(user.id);
        setSearchQuery(user.name);
        setShowSearch(false);
    };

    const handleTemplateChange = (templateId: string) => {
        setSelectedTemplate(templateId);
        const template = templates.find((t) => t.id === templateId);
        if (template) {
            setDelegateId(template.delegateId);
            setDelegationType(template.delegationType);
            setReason(template.reason || '');
            setCanSubdelegate(template.canSubdelegate);
            if (template.durationDays) {
                const expiry = new Date();
                expiry.setDate(expiry.getDate() + template.durationDays);
                setExpiryDate(expiry.toISOString().split('T')[0]);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!delegateId || !reason) {
            alert('Please select a delegate and provide a reason');
            return;
        }

        try {
            setSubmitting(true);

            if (useTemplate && selectedTemplate) {
                await applyDelegationTemplate(selectedTemplate, delegatorId, approvalIds);
            } else {
                await bulkDelegateApprovals(
                    delegatorId,
                    approvalIds,
                    delegateId,
                    delegationType,
                    reason,
                    expiryDate || undefined,
                    canSubdelegate
                );
            }

            alert(`Successfully delegated ${approvalIds.length} approval(s)`);
            onSuccess?.();
            onClose();
        } catch (error) {
            console.error('Error delegating approvals:', error);
            alert('Failed to delegate approvals');
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Delegate Approvals</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Delegating {approvalIds.length} approval{approvalIds.length > 1 ? 's' : ''}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Template Toggle */}
                    {templates.length > 0 && (
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="useTemplate"
                                checked={useTemplate}
                                onChange={(e) => setUseTemplate(e.target.checked)}
                                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                            />
                            <label htmlFor="useTemplate" className="text-sm font-medium text-gray-700">
                                Use saved template
                            </label>
                        </div>
                    )}

                    {/* Template Selector */}
                    {useTemplate && templates.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Template
                            </label>
                            <select
                                value={selectedTemplate}
                                onChange={(e) => handleTemplateChange(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                <option value="">Choose a template...</option>
                                {templates.map((template) => (
                                    <option key={template.id} value={template.id}>
                                        {template.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* User Search */}
                    {!useTemplate && (
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Delegate To
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setShowSearch(true);
                                    }}
                                    onFocus={() => setShowSearch(true)}
                                    placeholder="Search users by name or email..."
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                            {showSearch && searchResults.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                    {searchResults.map((user) => (
                                        <button
                                            key={user.id}
                                            type="button"
                                            onClick={() => handleSelectUser(user)}
                                            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center gap-2"
                                        >
                                            <Users className="w-4 h-4 text-gray-400" />
                                            <div>
                                                <div className="font-medium text-gray-900">{user.name}</div>
                                                <div className="text-sm text-gray-500">{user.email}</div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Delegation Type */}
                    {!useTemplate && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Delegation Type
                            </label>
                            <div className="flex gap-4">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        value="temporary"
                                        checked={delegationType === 'temporary'}
                                        onChange={(e) => setDelegationType(e.target.value as 'temporary')}
                                        className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                                    />
                                    <span className="text-sm text-gray-700">Temporary</span>
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        value="permanent"
                                        checked={delegationType === 'permanent'}
                                        onChange={(e) => setDelegationType(e.target.value as 'permanent')}
                                        className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                                    />
                                    <span className="text-sm text-gray-700">Permanent</span>
                                </label>
                            </div>
                        </div>
                    )}

                    {/* Expiry Date */}
                    {!useTemplate && delegationType === 'temporary' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Expiry Date (Optional)
                            </label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="date"
                                    value={expiryDate}
                                    onChange={(e) => setExpiryDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    )}

                    {/* Reason */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Reason
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                            placeholder="Provide a reason for this delegation..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>

                    {/* Sub-delegation */}
                    {!useTemplate && (
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="canSubdelegate"
                                checked={canSubdelegate}
                                onChange={(e) => setCanSubdelegate(e.target.checked)}
                                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                            />
                            <label htmlFor="canSubdelegate" className="text-sm text-gray-700">
                                Allow delegate to sub-delegate
                            </label>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting || !delegateId || !reason}
                            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {submitting ? 'Delegating...' : 'Delegate'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
