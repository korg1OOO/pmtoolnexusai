/**
 * IMAP Configuration Manager
 * Admin interface for managing IMAP email accounts
 */

import React, { useState } from 'react';
import { Plus, Mail, CheckCircle2, XCircle, RefreshCw, Trash2, Settings, HelpCircle, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import {
    useIMAPAccounts,
    useIMAPPresets,
    useCreateIMAPAccount,
    useUpdateIMAPAccount,
    useDeleteIMAPAccount,
    useTestIMAPConnection,
    useSyncIMAPAccount
} from '@/hooks/useIMAP';
import { IMAPAccount } from '@/services/imapService';

export function IMAPConfigurationManager() {
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<string>('');
    const [formData, setFormData] = useState<Partial<IMAPAccount>>({
        provider: 'custom',
        email_address: '',
        imap_host: '',
        imap_port: 993,
        imap_username: '',
        imap_password_encrypted: '',
        use_ssl: true,
        folder_to_sync: 'INBOX',
        sync_frequency_minutes: 15,
    });

    const { data: accounts, isLoading } = useIMAPAccounts();
    const { data: presets } = useIMAPPresets();
    const createAccount = useCreateIMAPAccount();
    const updateAccount = useUpdateIMAPAccount();
    const deleteAccount = useDeleteIMAPAccount();
    const testConnection = useTestIMAPConnection();
    const syncAccount = useSyncIMAPAccount();

    const handleSelectPreset = (provider: string) => {
        const preset = presets?.find(p => p.provider === provider);
        if (preset) {
            setFormData({
                ...formData,
                provider: provider as any,
                imap_host: preset.imap_host,
                imap_port: preset.imap_port,
                use_ssl: preset.use_ssl,
            });
            setSelectedProvider(provider);
        }
    };

    const handleTestConnection = async () => {
        try {
            await testConnection.mutateAsync(formData);
        } catch (error) {
            // Error handled by mutation
        }
    };

    const handleSave = async () => {
        if (!formData.email_address || !formData.imap_host || !formData.imap_username || !formData.imap_password_encrypted) {
            toast.error('Please fill in all required fields');
            return;
        }

        await createAccount.mutateAsync(formData);
        setShowAddDialog(false);
        resetForm();
    };

    const handleToggleStatus = async (account: IMAPAccount) => {
        await updateAccount.mutateAsync({
            id: account.id,
            updates: {
                status: account.status === 'active' ? 'inactive' : 'active',
            },
        });
    };

    const handleSync = async (accountId: string) => {
        await syncAccount.mutateAsync(accountId);
    };

    const handleDelete = async (accountId: string) => {
        if (confirm('Are you sure you want to delete this IMAP account?')) {
            await deleteAccount.mutateAsync(accountId);
        }
    };

    const resetForm = () => {
        setFormData({
            provider: 'custom',
            email_address: '',
            imap_host: '',
            imap_port: 993,
            imap_username: '',
            imap_password_encrypted: '',
            use_ssl: true,
            folder_to_sync: 'INBOX',
            sync_frequency_minutes: 15,
        });
        setSelectedProvider('');
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active':
                return <CheckCircle2 className="h-4 w-4 text-green-600" />;
            case 'error':
                return <XCircle className="h-4 w-4 text-red-600" />;
            default:
                return <XCircle className="h-4 w-4 text-gray-400" />;
        }
    };

    const getProviderLogo = (provider: string) => {
        const logos: Record<string, string> = {
            gmail: '📧',
            outlook: '📬',
            zoho: '📮',
            custom: '✉️',
        };
        return logos[provider] || '✉️';
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">IMAP Configuration</h1>
                    <p className="text-muted-foreground">Connect email accounts for ingestion</p>
                </div>
                <Button onClick={() => setShowAddDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add IMAP Account
                </Button>
            </div>

            {/* Quick Setup Presets */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Quick Setup</CardTitle>
                    <CardDescription>Choose your email provider for pre-configured settings</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {presets?.map(preset => (
                            <Card
                                key={preset.provider}
                                className="cursor-pointer hover:shadow-md transition-shadow"
                                onClick={() => {
                                    handleSelectPreset(preset.provider);
                                    setShowAddDialog(true);
                                }}
                            >
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="text-3xl">{getProviderLogo(preset.provider)}</div>
                                        <div className="flex-1">
                                            <div className="font-semibold">{preset.display_name}</div>
                                            <div className="text-xs text-muted-foreground">
                                                {preset.imap_host}:{preset.imap_port}
                                            </div>
                                        </div>
                                        {preset.help_url && (
                                            <a
                                                href={preset.help_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                onClick={(e) => e.stopPropagation()}
                                                className="text-primary hover:text-primary/80"
                                            >
                                                <ExternalLink className="h-4 w-4" />
                                            </a>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Connected Accounts */}
            <div>
                <h2 className="text-lg font-semibold mb-4">Connected Accounts</h2>

                {isLoading ? (
                    <div className="text-center py-12 text-muted-foreground">
                        Loading accounts...
                    </div>
                ) : accounts && accounts.length === 0 ? (
                    <Card>
                        <CardContent className="py-12 text-center text-muted-foreground">
                            <Mail className="h-12 w-12 mx-auto mb-4 opacity-20" />
                            <p>No IMAP accounts configured</p>
                            <p className="text-sm mt-2">Add an account to start syncing emails</p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-3">
                        {accounts?.map(account => (
                            <Card key={account.id}>
                                <CardContent className="p-4">
                                    <div className="flex items-center gap-4">
                                        <div className="text-2xl">{getProviderLogo(account.provider)}</div>

                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold">{account.email_address}</span>
                                                <Badge variant="secondary" className="text-xs">
                                                    {account.provider}
                                                </Badge>
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {account.imap_host}:{account.imap_port} • Folder: {account.folder_to_sync}
                                            </div>
                                            {account.last_sync_at && (
                                                <div className="text-xs text-muted-foreground mt-1">
                                                    Last synced: {new Date(account.last_sync_at).toLocaleString()}
                                                </div>
                                            )}
                                            {account.error_message && (
                                                <div className="text-xs text-red-600 mt-1">
                                                    {account.error_message}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {getStatusIcon(account.status)}

                                            <Switch
                                                checked={account.status === 'active'}
                                                onCheckedChange={() => handleToggleStatus(account)}
                                            />

                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleSync(account.id)}
                                                disabled={syncAccount.isPending}
                                            >
                                                <RefreshCw className="h-3 w-3 mr-1" />
                                                Sync
                                            </Button>

                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => handleDelete(account.id)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Add/Edit Dialog */}
            <Dialog open={showAddDialog} onOpenChange={(open) => {
                if (!open) resetForm();
                setShowAddDialog(open);
            }}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Add IMAP Account</DialogTitle>
                        <DialogDescription>
                            Configure your email account for automatic ingestion
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs defaultValue={selectedProvider ? 'config' : 'provider'}>
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="provider">Choose Provider</TabsTrigger>
                            <TabsTrigger value="config">Configuration</TabsTrigger>
                        </TabsList>

                        <TabsContent value="provider" className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                {presets?.map(preset => (
                                    <Card
                                        key={preset.provider}
                                        className="cursor-pointer hover:bg-accent transition-colors"
                                        onClick={() => handleSelectPreset(preset.provider)}
                                    >
                                        <CardContent className="p-4">
                                            <div className="text-2xl mb-2">{getProviderLogo(preset.provider)}</div>
                                            <div className="font-semibold">{preset.display_name}</div>
                                            <div className="text-xs text-muted-foreground mt-1">
                                                {preset.instructions}
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </TabsContent>

                        <TabsContent value="config" className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <Label>Email Address *</Label>
                                    <Input
                                        type="email"
                                        placeholder="user@example.com"
                                        value={formData.email_address}
                                        onChange={(e) => setFormData({ ...formData, email_address: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <Label>IMAP Host *</Label>
                                    <Input
                                        placeholder="imap.gmail.com"
                                        value={formData.imap_host}
                                        onChange={(e) => setFormData({ ...formData, imap_host: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <Label>Port *</Label>
                                    <Input
                                        type="number"
                                        placeholder="993"
                                        value={formData.imap_port}
                                        onChange={(e) => setFormData({ ...formData, imap_port: parseInt(e.target.value) })}
                                    />
                                </div>

                                <div>
                                    <Label>Username *</Label>
                                    <Input
                                        placeholder="Usually your email"
                                        value={formData.imap_username}
                                        onChange={(e) => setFormData({ ...formData, imap_username: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <Label>Password / App Password *</Label>
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        value={formData.imap_password_encrypted}
                                        onChange={(e) => setFormData({ ...formData, imap_password_encrypted: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <Label>Folder to Sync</Label>
                                    <Input
                                        placeholder="INBOX"
                                        value={formData.folder_to_sync}
                                        onChange={(e) => setFormData({ ...formData, folder_to_sync: e.target.value })}
                                    />
                                </div>

                                <div>
                                    <Label>Sync Frequency (minutes)</Label>
                                    <Input
                                        type="number"
                                        placeholder="15"
                                        value={formData.sync_frequency_minutes}
                                        onChange={(e) => setFormData({ ...formData, sync_frequency_minutes: parseInt(e.target.value) })}
                                    />
                                </div>

                                <div className="col-span-2 flex items-center gap-2">
                                    <Switch
                                        checked={formData.use_ssl}
                                        onCheckedChange={(checked) => setFormData({ ...formData, use_ssl: checked })}
                                    />
                                    <Label>Use SSL/TLS (Recommended)</Label>
                                </div>
                            </div>

                            {selectedProvider && presets?.find(p => p.provider === selectedProvider)?.instructions && (
                                <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                                    <div className="flex gap-2">
                                        <HelpCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                        <div className="text-sm text-blue-900 dark:text-blue-100">
                                            {presets.find(p => p.provider === selectedProvider)?.instructions}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="outline"
                            onClick={handleTestConnection}
                            disabled={testConnection.isPending}
                        >
                            <Settings className="h-4 w-4 mr-2" />
                            Test Connection
                        </Button>
                        <Button onClick={handleSave} disabled={createAccount.isPending}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Account
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
