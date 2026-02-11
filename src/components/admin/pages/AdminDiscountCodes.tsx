/**
 * Admin Discount Codes Page
 * Manage promotional discount codes with advanced features
 */

import React, { useState } from 'react';
import {
    useDiscountCodes,
    useCreateDiscountCode,
    useUpdateDiscountCode,
    useDeactivateDiscountCode,
} from '@/hooks/useAdminServices';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Percent, DollarSign, Eye, Ban, Star, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function AdminDiscountCodes() {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const { data: discountCodes, isLoading } = useDiscountCodes();
    const createCode = useCreateDiscountCode();
    const deactivateCode = useDeactivateDiscountCode();
    const { toast } = useToast();

    // Form state with advanced features
    const [formData, setFormData] = useState({
        code: '',
        description: '',
        discountType: 'percentage' as 'percentage' | 'fixed_amount',
        discountValue: '',
        maxUses: '',
        maxUsesPerUser: '1',
        validUntil: '',
        tierRestrictions: [] as string[],
        firstTimeUserOnly: false,
        isReferralCode: false,
    });

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            await createCode.mutateAsync({
                code: formData.code.toUpperCase(),
                description: formData.description,
                discount_type: formData.discountType,
                discount_value: parseFloat(formData.discountValue),
                max_uses: formData.maxUses ? parseInt(formData.maxUses) : null,
                max_uses_per_user: parseInt(formData.maxUsesPerUser),
                valid_until: formData.validUntil || null,
                tier_restrictions: formData.tierRestrictions.length > 0 ? formData.tierRestrictions : null,
                first_time_user_only: formData.firstTimeUserOnly,
                is_referral_code: formData.isReferralCode,
            });

            toast({
                title: 'Success',
                description: 'Discount code created successfully',
            });

            setIsCreateOpen(false);
            setFormData({
                code: '',
                description: '',
                discountType: 'percentage',
                discountValue: '',
                maxUses: '',
                maxUsesPerUser: '1',
                validUntil: '',
                tierRestrictions: [],
                firstTimeUserOnly: false,
                isReferralCode: false,
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to create discount code',
                variant: 'destructive',
            });
        }
    };

    const handleDeactivate = async (codeId: string) => {
        try {
            await deactivateCode.mutateAsync(codeId);
            toast({
                title: 'Success',
                description: 'Discount code deactivated',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to deactivate code',
                variant: 'destructive',
            });
        }
    };

    const handleTierToggle = (tier: string) => {
        const current = formData.tierRestrictions;
        if (current.includes(tier)) {
            setFormData({
                ...formData,
                tierRestrictions: current.filter((t) => t !== tier),
            });
        } else {
            setFormData({
                ...formData,
                tierRestrictions: [...current, tier],
            });
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Percent className="h-8 w-8 text-primary" />
                        Discount Codes
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Create and manage promotional discount codes
                    </p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Code
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Create Discount Code</DialogTitle>
                            <DialogDescription>
                                Add a new promotional discount code with advanced targeting
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <Label htmlFor="code">Code</Label>
                                <Input
                                    id="code"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    placeholder="SAVE20"
                                    required
                                    className="uppercase"
                                />
                            </div>

                            <div>
                                <Label htmlFor="description">Description</Label>
                                <Input
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="20% off all plans"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="discountType">Discount Type</Label>
                                    <Select
                                        value={formData.discountType}
                                        onValueChange={(value: 'percentage' | 'fixed_amount') =>
                                            setFormData({ ...formData, discountType: value })
                                        }
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="percentage">Percentage</SelectItem>
                                            <SelectItem value="fixed_amount">Fixed Amount</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="value">Value</Label>
                                    <Input
                                        id="value"
                                        type="number"
                                        value={formData.discountValue}
                                        onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                                        placeholder={formData.discountType === 'percentage' ? '20' : '10'}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="maxUses">Max Uses (optional)</Label>
                                    <Input
                                        id="maxUses"
                                        type="number"
                                        value={formData.maxUses}
                                        onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                                        placeholder="Unlimited"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="maxUsesPerUser">Uses Per User</Label>
                                    <Input
                                        id="maxUsesPerUser"
                                        type="number"
                                        value={formData.maxUsesPerUser}
                                        onChange={(e) => setFormData({ ...formData, maxUsesPerUser: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="validUntil">Expiry Date (optional)</Label>
                                <Input
                                    id="validUntil"
                                    type="date"
                                    value={formData.validUntil}
                                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                                />
                            </div>

                            {/* Advanced Features */}
                            <div className="border-t pt-4 space-y-4">
                                <h3 className="font-semibold flex items-center gap-2">
                                    <Star className="h-4 w-4 text-primary" />
                                    Advanced Options
                                </h3>

                                {/* Tier Restrictions */}
                                <div>
                                    <Label className="mb-2 block">Tier Restrictions (optional)</Label>
                                    <div className="flex gap-3">
                                        {['pro', 'business', 'agency'].map((tier) => (
                                            <div key={tier} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={`tier-${tier}`}
                                                    checked={formData.tierRestrictions.includes(tier)}
                                                    onCheckedChange={() => handleTierToggle(tier)}
                                                />
                                                <label
                                                    htmlFor={`tier-${tier}`}
                                                    className="text-sm font-medium capitalize cursor-pointer"
                                                >
                                                    {tier}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        Leave unchecked to allow all tiers
                                    </p>
                                </div>

                                {/* First Time User Only */}
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="firstTimeUser"
                                        checked={formData.firstTimeUserOnly}
                                        onCheckedChange={(checked) =>
                                            setFormData({ ...formData, firstTimeUserOnly: checked as boolean })
                                        }
                                    />
                                    <label htmlFor="firstTimeUser" className="text-sm font-medium cursor-pointer flex items-center gap-2">
                                        <Users className="h-4 w-4" />
                                        First-time users only
                                    </label>
                                </div>

                                {/* Referral Code */}
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="referralCode"
                                        checked={formData.isReferralCode}
                                        onCheckedChange={(checked) =>
                                            setFormData({ ...formData, isReferralCode: checked as boolean })
                                        }
                                    />
                                    <label htmlFor="referralCode" className="text-sm font-medium cursor-pointer">
                                        Mark as referral code
                                    </label>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={createCode.isPending}>
                                    {createCode.isPending ? 'Creating...' : 'Create Code'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Discount Codes Table */}
            <Card>
                <CardHeader>
                    <CardTitle>All Discount Codes</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Value</TableHead>
                                <TableHead>Usage</TableHead>
                                <TableHead>Restrictions</TableHead>
                                <TableHead>Valid Until</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-[100px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {discountCodes?.map((code) => (
                                <TableRow key={code.id}>
                                    <TableCell className="font-mono font-bold">{code.code}</TableCell>
                                    <TableCell className="capitalize">
                                        {code.discount_type === 'percentage' ? (
                                            <span className="flex items-center gap-1">
                                                <Percent className="h-4 w-4" />
                                                Percentage
                                            </span>
                                        ) : (
                                            <span className="flex items-center gap-1">
                                                <DollarSign className="h-4 w-4" />
                                                Fixed
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell className="font-semibold">
                                        {code.discount_type === 'percentage'
                                            ? `${code.discount_value}%`
                                            : `$${code.discount_value}`}
                                    </TableCell>
                                    <TableCell>
                                        {code.used_count}/{code.max_uses || '∞'}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-1">
                                            {code.tier_restrictions && code.tier_restrictions.length > 0 && (
                                                <div className="flex gap-1 flex-wrap">
                                                    {code.tier_restrictions.map((tier) => (
                                                        <Badge key={tier} variant="secondary" className="text-xs capitalize">
                                                            {tier}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            )}
                                            {code.first_time_user_only && (
                                                <Badge variant="outline" className="text-xs">
                                                    <Users className="h-3 w-3 mr-1" />
                                                    New users
                                                </Badge>
                                            )}
                                            {code.is_referral_code && (
                                                <Badge variant="outline" className="text-xs text-primary">
                                                    Referral
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {code.valid_until ? new Date(code.valid_until).toLocaleDateString() : 'Never'}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={cn(
                                                code.is_active
                                                    ? 'bg-success/20 text-success border-success/30'
                                                    : 'bg-muted text-muted-foreground'
                                            )}
                                        >
                                            {code.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Button variant="ghost" size="sm">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                            {code.is_active && (
                                                <Button variant="ghost" size="sm" onClick={() => handleDeactivate(code.id)}>
                                                    <Ban className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {!isLoading && (!discountCodes || discountCodes.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                        No discount codes created yet
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
