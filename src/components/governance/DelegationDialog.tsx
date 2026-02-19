import React, { useState, useEffect } from 'react';
import { Search, Calendar, Users } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
    bulkDelegateApprovals,
    getDelegationTemplates,
    applyDelegationTemplate,
    searchUsersForDelegation,
} from '@/services/delegationService';
import type { DelegationTemplate } from '@/types/analytics';

interface DelegationDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    approvalIds: string[];
    delegatorId: string;
    onSuccess?: () => void;
}

export default function DelegationDialog({
    open,
    onOpenChange,
    approvalIds,
    delegatorId,
    onSuccess,
}: DelegationDialogProps) {
    const [delegateId, setDelegateId] = useState('');
    const [delegateName, setDelegateName] = useState('');
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
        if (open) {
            loadTemplates();
            // Reset form
            setDelegateId('');
            setDelegateName('');
            setDelegationType('temporary');
            setReason('');
            setExpiryDate('');
            setCanSubdelegate(false);
            setUseTemplate(false);
            setSelectedTemplate('');
        }
    }, [open]);

    useEffect(() => {
        if (searchQuery.length >= 2) {
            searchUsersForDelegation(searchQuery, delegatorId)
                .then(setSearchResults)
                .catch(console.error);
        } else {
            setSearchResults([]);
        }
    }, [searchQuery, delegatorId]);

    const loadTemplates = async () => {
        try {
            const data = await getDelegationTemplates(delegatorId);
            setTemplates(data);
        } catch {
            // templates are optional
        }
    };

    const handleSelectUser = (user: { id: string; name: string; email: string }) => {
        setDelegateId(user.id);
        setDelegateName(user.name);
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
            toast.error('Please select a delegate and provide a reason');
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
                    canSubdelegate,
                );
            }
            toast.success(`${approvalIds.length} approval${approvalIds.length > 1 ? 's' : ''} delegated to ${delegateName || 'delegate'}`);
            onSuccess?.();
            onOpenChange(false);
        } catch (error: any) {
            toast.error('Failed to delegate: ' + (error?.message ?? 'Unknown error'));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Delegate Approvals</DialogTitle>
                    <DialogDescription>
                        Delegating{' '}
                        <Badge variant="secondary" className="mx-1">
                            {approvalIds.length}
                        </Badge>{' '}
                        approval{approvalIds.length > 1 ? 's' : ''} to another user
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5 py-2">
                    {/* Template Toggle */}
                    {templates.length > 0 && (
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="useTemplate"
                                checked={useTemplate}
                                onCheckedChange={(v) => setUseTemplate(!!v)}
                            />
                            <Label htmlFor="useTemplate">Use saved template</Label>
                        </div>
                    )}

                    {/* Template Selector */}
                    {useTemplate && templates.length > 0 && (
                        <div className="space-y-1.5">
                            <Label>Select Template</Label>
                            <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Choose a template…" />
                                </SelectTrigger>
                                <SelectContent>
                                    {templates.map((t) => (
                                        <SelectItem key={t.id} value={t.id}>
                                            {t.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* User Search */}
                    {!useTemplate && (
                        <div className="relative space-y-1.5">
                            <Label>Delegate To</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setShowSearch(true);
                                    }}
                                    onFocus={() => setShowSearch(true)}
                                    placeholder="Search users by name or email…"
                                    className="pl-10"
                                />
                            </div>
                            {showSearch && searchResults.length > 0 && (
                                <div className="absolute z-20 w-full bg-popover border rounded-lg shadow-lg max-h-52 overflow-y-auto">
                                    {searchResults.map((user) => (
                                        <button
                                            key={user.id}
                                            type="button"
                                            onClick={() => handleSelectUser(user)}
                                            className="w-full px-4 py-2.5 text-left hover:bg-muted flex items-center gap-3 transition-colors"
                                        >
                                            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                                            <div>
                                                <p className="text-sm font-medium">{user.name}</p>
                                                <p className="text-xs text-muted-foreground">{user.email}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                            {delegateId && (
                                <p className="text-xs text-muted-foreground">
                                    Selected: <span className="font-medium text-foreground">{delegateName}</span>
                                </p>
                            )}
                        </div>
                    )}

                    {/* Delegation Type */}
                    {!useTemplate && (
                        <div className="space-y-1.5">
                            <Label>Delegation Type</Label>
                            <RadioGroup
                                value={delegationType}
                                onValueChange={(v) => setDelegationType(v as 'temporary' | 'permanent')}
                                className="flex gap-6"
                            >
                                <div className="flex items-center gap-2">
                                    <RadioGroupItem value="temporary" id="type-temp" />
                                    <Label htmlFor="type-temp" className="font-normal cursor-pointer">Temporary</Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <RadioGroupItem value="permanent" id="type-perm" />
                                    <Label htmlFor="type-perm" className="font-normal cursor-pointer">Permanent</Label>
                                </div>
                            </RadioGroup>
                        </div>
                    )}

                    {/* Expiry Date */}
                    {!useTemplate && delegationType === 'temporary' && (
                        <div className="space-y-1.5">
                            <Label>Expiry Date (Optional)</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="date"
                                    value={expiryDate}
                                    onChange={(e) => setExpiryDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                    )}

                    {/* Reason */}
                    <div className="space-y-1.5">
                        <Label>Reason <span className="text-destructive">*</span></Label>
                        <Textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={3}
                            placeholder="Provide a reason for this delegation…"
                        />
                    </div>

                    {/* Sub-delegation */}
                    {!useTemplate && (
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="canSubdelegate"
                                checked={canSubdelegate}
                                onCheckedChange={(v) => setCanSubdelegate(!!v)}
                            />
                            <Label htmlFor="canSubdelegate" className="font-normal">
                                Allow delegate to sub-delegate
                            </Label>
                        </div>
                    )}
                </form>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)} type="button">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSubmit as any}
                        disabled={submitting || !delegateId || !reason}
                    >
                        {submitting ? 'Delegating…' : 'Delegate'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
