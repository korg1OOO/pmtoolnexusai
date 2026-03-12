import React, { useState, useEffect } from 'react';
import { Save, Trash2, Plus, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import {
    getDelegationTemplates,
    saveDelegationTemplate,
    deleteDelegationTemplate,
    searchUsersForDelegation,
} from '@/services/delegationService';
import type { DelegationTemplate } from '@/types/analytics';

interface DelegationTemplatesProps {
    userId: string;
}

export default function DelegationTemplates({ userId }: DelegationTemplatesProps) {
    const [templates, setTemplates] = useState<DelegationTemplate[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        delegateId: '',
        delegationType: 'temporary' as 'temporary' | 'permanent',
        reason: '',
        durationDays: '',
        canSubdelegate: false,
    });
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Array<{ id: string; name: string; email: string }>>([]);

    useEffect(() => {
        loadTemplates();
    }, [userId]);

    useEffect(() => {
        if (searchQuery.length >= 2) {
            searchUsers();
        } else {
            setSearchResults([]);
        }
    }, [searchQuery]);

    const loadTemplates = async () => {
        try {
            setLoading(true);
            const data = await getDelegationTemplates(userId);
            setTemplates(data);
        } catch (error) {
            console.error('Error loading templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const searchUsers = async () => {
        try {
            const results = await searchUsersForDelegation(searchQuery, userId);
            setSearchResults(results);
        } catch (error) {
            console.error('Error searching users:', error);
        }
    };

    const handleSelectUser = (user: { id: string; name: string; email: string }) => {
        setFormData({ ...formData, delegateId: user.id });
        setSearchQuery(user.name);
        setSearchResults([]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.delegateId) {
            toast.error('Please provide a name and select a delegate');
            return;
        }

        try {
            await saveDelegationTemplate({
                userId,
                name: formData.name,
                delegateId: formData.delegateId,
                delegationType: formData.delegationType,
                reason: formData.reason,
                durationDays: formData.durationDays ? parseInt(formData.durationDays) : undefined,
                canSubdelegate: formData.canSubdelegate,
            });

            setShowForm(false);
            setFormData({
                name: '',
                delegateId: '',
                delegationType: 'temporary',
                reason: '',
                durationDays: '',
                canSubdelegate: false,
            });
            setSearchQuery('');
            loadTemplates();
        } catch (error) {
            console.error('Error saving template:', error);
            toast.error('Failed to save template');
        }
    };

    const handleDelete = async (templateId: string) => {
        try {
            await deleteDelegationTemplate(templateId, userId);
            toast.success('Template deleted');
            loadTemplates();
        } catch (error) {
            console.error('Error deleting template:', error);
            toast.error('Failed to delete template');
        }
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
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Delegation Templates</h2>
                    <p className="text-sm text-gray-500 mt-1">
                        Save and reuse common delegation patterns
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    New Template
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Template Name
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g., Out of Office Delegation"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>

                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Delegate To
                        </label>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search users..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                        {searchResults.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
                                {searchResults.map((user) => (
                                    <button
                                        key={user.id}
                                        type="button"
                                        onClick={() => handleSelectUser(user)}
                                        className="w-full px-4 py-2 text-left hover:bg-gray-100"
                                    >
                                        <div className="font-medium">{user.name}</div>
                                        <div className="text-sm text-gray-500">{user.email}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Type
                            </label>
                            <select
                                value={formData.delegationType}
                                onChange={(e) =>
                                    setFormData({ ...formData, delegationType: e.target.value as any })
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                                <option value="temporary">Temporary</option>
                                <option value="permanent">Permanent</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Duration (Days)
                            </label>
                            <input
                                type="number"
                                value={formData.durationDays}
                                onChange={(e) => setFormData({ ...formData, durationDays: e.target.value })}
                                placeholder="Optional"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Reason
                        </label>
                        <textarea
                            value={formData.reason}
                            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                            rows={2}
                            placeholder="Optional"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="canSubdelegate"
                            checked={formData.canSubdelegate}
                            onChange={(e) => setFormData({ ...formData, canSubdelegate: e.target.checked })}
                            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                        />
                        <label htmlFor="canSubdelegate" className="text-sm text-gray-700">
                            Allow sub-delegation
                        </label>
                    </div>

                    <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            <Save className="w-4 h-4" />
                            Save Template
                        </button>
                    </div>
                </form>
            )}

            {/* Template List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.length === 0 ? (
                    <div className="col-span-2 bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
                        No templates saved yet
                    </div>
                ) : (
                    templates.map((template) => (
                        <div
                            key={template.id}
                            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <h3 className="font-semibold text-gray-900">{template.name}</h3>
                                <button
                                    onClick={() => handleDelete(template.id)}
                                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="space-y-1 text-sm text-gray-600">
                                <div>
                                    <strong>Type:</strong> {template.delegationType}
                                </div>
                                {template.durationDays && (
                                    <div>
                                        <strong>Duration:</strong> {template.durationDays} days
                                    </div>
                                )}
                                {template.reason && (
                                    <div>
                                        <strong>Reason:</strong> {template.reason}
                                    </div>
                                )}
                                {template.canSubdelegate && (
                                    <div className="text-purple-600">
                                        ✓ Allows sub-delegation
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
