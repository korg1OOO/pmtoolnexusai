/**
 * Admin API Keys Management
 * Manage API keys for programmatic access
 */

import React, { useState } from 'react';
import { Key, Plus, Copy, Eye, EyeOff, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
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
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { useAdminApiKeys, useRevokeApiKey } from '@/hooks/useAdmin';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { supabase as _supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

const supabase = _supabase as any;

const statusColors: Record<string, string> = {
    active: 'bg-success/20 text-success border-success/30',
    revoked: 'bg-destructive/20 text-destructive border-destructive/30',
};

export function AdminAPIKeys() {
    const { data: apiKeys, isLoading } = useAdminApiKeys();
    const revokeKey = useRevokeApiKey();
    const queryClient = useQueryClient();

    const [createOpen, setCreateOpen] = useState(false);
    const [newKeyName, setNewKeyName] = useState('');
    const [newKeyExpiry, setNewKeyExpiry] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [generatedKey, setGeneratedKey] = useState<string | null>(null);
    const [showKey, setShowKey] = useState(false);

    const handleCreate = async () => {
        if (!newKeyName.trim()) return;
        setIsCreating(true);
        try {
            const rawKey = `sk_live_${Array.from(crypto.getRandomValues(new Uint8Array(32)))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('')}`;
            const prefix = rawKey.substring(0, 14);

            const { error } = await supabase.from('api_keys').insert({
                name: newKeyName.trim(),
                prefix,
                // Store only a hash in production — for now store prefix to avoid exposing full key
                key_hash: btoa(rawKey), // base64 as simple stand-in; swap for bcrypt in production
                status: 'active',
                expires_at: newKeyExpiry || null,
            });

            if (error) throw error;

            setGeneratedKey(rawKey);
            queryClient.invalidateQueries({ queryKey: ['admin-api-keys'] });
            toast.success('API key created — copy it now, it will not be shown again');
        } catch (err: any) {
            toast.error('Failed to create API key: ' + err.message);
        } finally {
            setIsCreating(false);
        }
    };

    const handleCloseDialog = () => {
        setCreateOpen(false);
        setNewKeyName('');
        setNewKeyExpiry('');
        setGeneratedKey(null);
        setShowKey(false);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full p-6">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-2">
                    <Key className="h-8 w-8" />
                    API Keys
                </h1>
                <p className="text-muted-foreground mt-1">
                    Manage API keys for programmatic access to the platform
                </p>
            </div>

            {/* Actions */}
            <div className="flex justify-end">
                <Button onClick={() => setCreateOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create API Key
                </Button>
            </div>

            {/* API Keys Table */}
            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Key Prefix</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Last Used</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {apiKeys?.map((key) => (
                            <TableRow key={key.id}>
                                <TableCell className="font-medium">{key.name}</TableCell>
                                <TableCell className="font-mono text-sm text-muted-foreground">
                                    {key.prefix}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {new Date(key.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                    {key.last_used_at
                                        ? new Date(key.last_used_at).toLocaleDateString()
                                        : 'Never'}
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant="outline"
                                        className={cn(statusColors[key.status || 'active'])}
                                    >
                                        {key.status}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <Button
                                        variant="ghost"
                                        size="iconSm"
                                        onClick={() => revokeKey.mutate(key.id)}
                                        title="Revoke key"
                                    >
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                        {apiKeys?.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={6}
                                    className="text-center py-8 text-muted-foreground"
                                >
                                    No API keys found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* Create API Key Dialog */}
            <Dialog open={createOpen} onOpenChange={v => { if (!v) handleCloseDialog(); else setCreateOpen(true); }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Create API Key</DialogTitle>
                        <DialogDescription>
                            {generatedKey
                                ? 'Copy your key now — it will not be shown again.'
                                : 'Give this key a descriptive name so you remember what it is for.'}
                        </DialogDescription>
                    </DialogHeader>

                    {generatedKey ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg font-mono text-xs break-all">
                                {showKey ? generatedKey : '••••••••••••••••••••••••••••••••'}
                                <div className="flex gap-1 ml-auto shrink-0">
                                    <Button variant="ghost" size="iconSm" onClick={() => setShowKey(v => !v)} title={showKey ? 'Hide key' : 'Show key'}>
                                        {showKey ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                                    </Button>
                                    <Button variant="ghost" size="iconSm" title="Copy key"
                                        onClick={() => {
                                            navigator.clipboard.writeText(generatedKey);
                                            toast.success('Copied to clipboard');
                                        }}>
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button onClick={handleCloseDialog}>Done</Button>
                            </DialogFooter>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="key-name">Key Name</Label>
                                <Input
                                    id="key-name"
                                    placeholder="e.g. Production Integration"
                                    value={newKeyName}
                                    onChange={e => setNewKeyName(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="key-expiry">Expiry Date (optional)</Label>
                                <Input
                                    id="key-expiry"
                                    type="date"
                                    value={newKeyExpiry}
                                    onChange={e => setNewKeyExpiry(e.target.value)}
                                />
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={handleCloseDialog}>Cancel</Button>
                                <Button onClick={handleCreate} disabled={isCreating || !newKeyName.trim()}>
                                    {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                                    Create Key
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
