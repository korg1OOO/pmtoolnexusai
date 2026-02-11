/**
 * Admin License Keys Page
 * Generate and manage software license keys
 */

import React, { useState } from 'react';
import {
    useLicenseKeys,
    useCreateLicenseKey,
    useBulkCreateLicenseKeys,
    useRevokeLicenseKey,
} from '@/hooks/useAdminServices';
import {
    generateLicenseKey,
    generateBulkLicenseKeys,
    exportLicenseKeysToCSV,
    downloadCSV,
    getLicenseKeyTierInfo,
    isLicenseKeyExpired,
} from '@/lib/licenseKeyGenerator';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Key, Plus, Download, Ban, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function AdminLicenseKeys() {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isBulkCreateOpen, setIsBulkCreateOpen] = useState(false);
    const { data: licenseKeys, isLoading } = useLicenseKeys();
    const createKey = useCreateLicenseKey();
    const bulkCreateKeys = useBulkCreateLicenseKeys();
    const revokeKey = useRevokeLicenseKey();
    const { toast } = useToast();

    // Form state
    const [formData, setFormData] = useState({
        licenseType: 'pro' as 'trial' | 'pro' | 'business' | 'agency' | 'enterprise' | 'lifetime',
        assignedEmail: '',
        expiresInDays: '365',
        maxActivations: '1',
        notes: '',
    });

    const [bulkForm, setBulkForm] = useState({
        count: '10',
        licenseType: 'pro' as 'trial' | 'pro' | 'business' | 'agency' | 'enterprise' | 'lifetime',
        expiresInDays: '365',
    });

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        const key = generateLicenseKey();
        const expiresAt = formData.expiresInDays
            ? new Date(Date.now() + parseInt(formData.expiresInDays) * 24 * 60 * 60 * 1000).toISOString()
            : null;

        try {
            await createKey.mutateAsync({
                key,
                key_prefix: key.substring(0, 13),
                license_type: formData.licenseType,
                assigned_email: formData.assignedEmail || null,
                max_activations: parseInt(formData.maxActivations),
                expires_at: expiresAt,
                notes: formData.notes || null,
                source: 'manual',
            });

            toast({
                title: 'Success',
                description: `License key created: ${key}`,
            });

            // Copy to clipboard
            navigator.clipboard.writeText(key);

            setIsCreateOpen(false);
            setFormData({
                licenseType: 'pro',
                assignedEmail: '',
                expiresInDays: '365',
                maxActivations: '1',
                notes: '',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to create license key',
                variant: 'destructive',
            });
        }
    };

    const handleBulkCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        const keys = generateBulkLicenseKeys(parseInt(bulkForm.count), {
            licenseType: bulkForm.licenseType,
            expiresInDays: parseInt(bulkForm.expiresInDays),
            maxActivations: 1,
        });

        try {
            await bulkCreateKeys.mutateAsync(keys);

            toast({
                title: 'Success',
                description: `${keys.length} license keys created`,
            });

            setIsBulkCreateOpen(false);
            setBulkForm({
                count: '10',
                licenseType: 'pro',
                expiresInDays: '365',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to create license keys',
                variant: 'destructive',
            });
        }
    };

    const handleRevoke = async (keyId: string) => {
        try {
            await revokeKey.mutateAsync(keyId);
            toast({
                title: 'Success',
                description: 'License key revoked',
            });
        } catch (error) {
            toast({
                title: 'Error',
                description: 'Failed to revoke license key',
                variant: 'destructive',
            });
        }
    };

    const handleExport = () => {
        if (!licenseKeys) return;
        const csv = exportLicenseKeysToCSV(licenseKeys);
        downloadCSV(csv, `license-keys-${new Date().toISOString()}.csv`);
        toast({
            title: 'Exported',
            description: 'License keys exported to CSV',
        });
    };

    const copyKey = (key: string) => {
        navigator.clipboard.writeText(key);
        toast({
            description: 'License key copied to clipboard',
        });
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                        <Key className="h-8 w-8 text-primary" />
                        License Keys
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Generate and manage software license keys
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleExport}>
                        <Download className="h-4 w-4 mr-2" />
                        Export CSV
                    </Button>
                    <Dialog open={isBulkCreateOpen} onOpenChange={setIsBulkCreateOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline">
                                <Plus className="h-4 w-4 mr-2" />
                                Bulk Generate
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Bulk Generate License Keys</DialogTitle>
                                <DialogDescription>Generate multiple license keys at once</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleBulkCreate} className="space-y-4">
                                <div>
                                    <Label htmlFor="count">Number of Keys</Label>
                                    <Input
                                        id="count"
                                        type="number"
                                        value={bulkForm.count}
                                        onChange={(e) => setBulkForm({ ...bulkForm, count: e.target.value })}
                                        min="1"
                                        max="1000"
                                        required
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="bulkType">License Type</Label>
                                    <Select
                                        value={bulkForm.licenseType}
                                        onValueChange={(value: any) => setBulkForm({ ...bulkForm, licenseType: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="trial">Trial (14 days)</SelectItem>
                                            <SelectItem value="pro">Pro</SelectItem>
                                            <SelectItem value="business">Business</SelectItem>
                                            <SelectItem value="agency">Agency</SelectItem>
                                            <SelectItem value="enterprise">Enterprise</SelectItem>
                                            <SelectItem value="lifetime">Lifetime</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="bulkExpiry">Expires In (days)</Label>
                                    <Input
                                        id="bulkExpiry"
                                        type="number"
                                        value={bulkForm.expiresInDays}
                                        onChange={(e) => setBulkForm({ ...bulkForm, expiresInDays: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsBulkCreateOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={bulkCreateKeys.isPending}>
                                        {bulkCreateKeys.isPending ? 'Generating...' : 'Generate'}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Create Key
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create License Key</DialogTitle>
                                <DialogDescription>Generate a new license key</DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div>
                                    <Label htmlFor="licenseType">License Type</Label>
                                    <Select
                                        value={formData.licenseType}
                                        onValueChange={(value: any) => setFormData({ ...formData, licenseType: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="trial">Trial (14 days)</SelectItem>
                                            <SelectItem value="pro">Pro</SelectItem>
                                            <SelectItem value="business">Business</SelectItem>
                                            <SelectItem value="agency">Agency</SelectItem>
                                            <SelectItem value="enterprise">Enterprise</SelectItem>
                                            <SelectItem value="lifetime">Lifetime</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label htmlFor="assignedEmail">Assigned Email (optional)</Label>
                                    <Input
                                        id="assignedEmail"
                                        type="email"
                                        value={formData.assignedEmail}
                                        onChange={(e) => setFormData({ ...formData, assignedEmail: e.target.value })}
                                        placeholder="user@example.com"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="expiresInDays">Expires In (days)</Label>
                                        <Input
                                            id="expiresInDays"
                                            type="number"
                                            value={formData.expiresInDays}
                                            onChange={(e) => setFormData({ ...formData, expiresInDays: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="maxActivations">Max Activations</Label>
                                        <Input
                                            id="maxActivations"
                                            type="number"
                                            value={formData.maxActivations}
                                            onChange={(e) =>
                                                setFormData({ ...formData, maxActivations: e.target.value })
                                            }
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="notes">Notes (optional)</Label>
                                    <Input
                                        id="notes"
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder="Additional information"
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-4">
                                    <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={createKey.isPending}>
                                        {createKey.isPending ? 'Creating...' : 'Create & Copy'}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* License Keys Table */}
            <Card>
                <CardHeader>
                    <CardTitle>All License Keys</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>License Key</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Assigned To</TableHead>
                                <TableHead>Activations</TableHead>
                                <TableHead>Expires</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="w-[100px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {licenseKeys?.map((key) => {
                                const tierInfo = getLicenseKeyTierInfo(key.license_type);
                                const expired = isLicenseKeyExpired(key.expires_at);

                                return (
                                    <TableRow key={key.id}>
                                        <TableCell className="font-mono text-sm">{key.key_prefix}...</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize">
                                                {tierInfo.name}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {key.assigned_email || 'Unassigned'}
                                        </TableCell>
                                        <TableCell>
                                            {key.activation_count}/{key.max_activations}
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {key.expires_at
                                                ? new Date(key.expires_at).toLocaleDateString()
                                                : 'Never'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge
                                                variant="outline"
                                                className={cn(
                                                    key.is_active && !expired
                                                        ? 'bg-success/20 text-success border-success/30'
                                                        : !key.is_active
                                                            ? 'bg-destructive/20 text-destructive border-destructive/30'
                                                            : 'bg-warning/20 text-warning border-warning/30'
                                                )}
                                            >
                                                {!key.is_active ? 'Revoked' : expired ? 'Expired' : 'Active'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Button variant="ghost" size="sm" onClick={() => copyKey(key.key)}>
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                                {key.is_active && !expired && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleRevoke(key.id)}
                                                    >
                                                        <Ban className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {!isLoading && (!licenseKeys || licenseKeys.length === 0) && (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                        No license keys created yet
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
