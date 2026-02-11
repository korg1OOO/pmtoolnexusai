/**
 * Admin Referrals Page
 * Manage referral codes and track conversions
 */

import React, { useState } from 'react';
import { useReferralCodes, useCreateReferralCode, useReferralConversions } from '@/hooks/useAdvancedAdmin';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Users, TrendingUp, Gift, Copy, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function AdminReferrals() {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedCode, setSelectedCode] = useState<string | null>(null);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    const { data: referralCodes, isLoading } = useReferralCodes();
    const createReferral = useCreateReferralCode();
    const { data: conversions } = useReferralConversions(selectedCode || '');
    const { toast } = useToast();

    // Form state
    const [formData, setFormData] = useState({
        code: '',
        referrerUserId: '',
        referrerDiscountId: '',
        refereeDiscountId: '',
        expiresAt: '',
    });

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const referralCode = await createReferral.mutateAsync({
                code: formData.code.toUpperCase(),
                referrer_user_id: formData.referrerUserId,
                referrer_discount_id: formData.referrerDiscountId || null,
                referee_discount_id: formData.refereeDiscountId || null,
                expires_at: formData.expiresAt || null,
                is_active: true,
            });

            toast({
                title: 'Success',
                description: `Referral code ${referralCode.code} created successfully`,
            });

            setIsCreateOpen(false);
            setFormData({
                code: '',
                referrerUserId: '',
                referrerDiscountId: '',
                refereeDiscountId: '',
                expiresAt: '',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to create referral code',
                variant: 'destructive',
            });
        }
    };

    const copyCode = async (code: string) => {
        await navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
        toast({
            title: 'Copied!',
            description: `Referral code ${code} copied to clipboard`,
        });
    };

    // Calculate metrics
    const totalReferrals = referralCodes?.reduce((sum, code) => sum + code.uses_count, 0) || 0;
    const totalConversions = referralCodes?.reduce((sum, code) => sum + code.successful_conversions, 0) || 0;
    const conversionRate = totalReferrals > 0 ? ((totalConversions / totalReferrals) * 100).toFixed(1) : '0';

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Gift className="h-8 w-8 text-primary" />
                        Referral Codes
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Manage referral codes and track viral growth
                    </p>
                </div>
                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="h-4 w-4 mr-2" />
                            Create Referral Code
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                        <DialogHeader>
                            <DialogTitle>Create Referral Code</DialogTitle>
                            <DialogDescription>
                                Create a new referral code with rewards for both referrer and referee
                            </DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div>
                                <Label htmlFor="code">Referral Code</Label>
                                <Input
                                    id="code"
                                    value={formData.code}
                                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                    placeholder="FRIEND10"
                                    required
                                    className="uppercase"
                                />
                            </div>

                            <div>
                                <Label htmlFor="referrerUserId">Referrer User ID</Label>
                                <Input
                                    id="referrerUserId"
                                    value={formData.referrerUserId}
                                    onChange={(e) => setFormData({ ...formData, referrerUserId: e.target.value })}
                                    placeholder="User UUID"
                                    required
                                />
                                <p className="text-xs text-muted-foreground mt-1">
                                    The user who will receive referral rewards
                                </p>
                            </div>

                            <div>
                                <Label htmlFor="referrerDiscountId">Referrer Discount ID (optional)</Label>
                                <Input
                                    id="referrerDiscountId"
                                    value={formData.referrerDiscountId}
                                    onChange={(e) => setFormData({ ...formData, referrerDiscountId: e.target.value })}
                                    placeholder="Discount code ID for referrer"
                                />
                            </div>

                            <div>
                                <Label htmlFor="refereeDiscountId">Referee Discount ID (optional)</Label>
                                <Input
                                    id="refereeDiscountId"
                                    value={formData.refereeDiscountId}
                                    onChange={(e) => setFormData({ ...formData, refereeDiscountId: e.target.value })}
                                    placeholder="Discount code ID for referee"
                                />
                            </div>

                            <div>
                                <Label htmlFor="expiresAt">Expiry Date (optional)</Label>
                                <Input
                                    id="expiresAt"
                                    type="date"
                                    value={formData.expiresAt}
                                    onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={createReferral.isPending}>
                                    {createReferral.isPending ? 'Creating...' : 'Create Code'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Metrics Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Referrals</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <Users className="h-8 w-8 text-primary" />
                            <div>
                                <div className="text-3xl font-bold">{totalReferrals}</div>
                                <p className="text-xs text-muted-foreground">Code uses</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Conversions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-8 w-8 text-success" />
                            <div>
                                <div className="text-3xl font-bold">{totalConversions}</div>
                                <p className="text-xs text-muted-foreground">Paid subscriptions</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Conversion Rate</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-8 w-8 text-info" />
                            <div>
                                <div className="text-3xl font-bold">{conversionRate}%</div>
                                <p className="text-xs text-muted-foreground">Referral → Paid</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Referral Codes Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Active Referral Codes</CardTitle>
                    <CardDescription>Track referral code performance and conversions</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Referrer</TableHead>
                                <TableHead>Uses</TableHead>
                                <TableHead>Conversions</TableHead>
                                <TableHead>Conversion Rate</TableHead>
                                <TableHead>Expires</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-[100px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {referralCodes?.map((code) => {
                                const rate = code.uses_count > 0
                                    ? ((code.successful_conversions / code.uses_count) * 100).toFixed(0)
                                    : '0';

                                return (
                                    <TableRow key={code.id}>
                                        <TableCell className="font-mono font-bold">{code.code}</TableCell>
                                        <TableCell className="text-sm text-muted-foreground truncate max-w-[150px]">
                                            {code.referrer_user_id}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{code.uses_count}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-success/20 text-success">
                                                {code.successful_conversions}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-success"
                                                        style={{ width: `${Math.min(parseInt(rate), 100)}%` }}
                                                    />
                                                </div>
                                                <span className="text-sm font-medium">{rate}%</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {code.expires_at ? new Date(code.expires_at).toLocaleDateString() : 'Never'}
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
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => copyCode(code.code)}
                                            >
                                                {copiedCode === code.code ? (
                                                    <CheckCircle2 className="h-4 w-4 text-success" />
                                                ) : (
                                                    <Copy className="h-4 w-4" />
                                                )}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {!isLoading && (!referralCodes || referralCodes.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                        No referral codes created yet
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
