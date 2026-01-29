import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Mail,
  Plus,
  Trash2,
  RefreshCw,
  Check,
  X,
  Settings,
  Server,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle,
  Loader2,
  Edit,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEmailAccounts, EmailAccount, CreateEmailAccountInput } from '@/hooks/useEmailAccounts';
import { useProjectContext } from '@/contexts/ProjectContext';
import { format } from 'date-fns';

// Common IMAP/SMTP presets
const emailPresets = [
  {
    name: 'Gmail',
    imap_host: 'imap.gmail.com',
    imap_port: 993,
    imap_encryption: 'ssl' as const,
    smtp_host: 'smtp.gmail.com',
    smtp_port: 587,
    smtp_encryption: 'tls' as const,
  },
  {
    name: 'Outlook/Microsoft 365',
    imap_host: 'outlook.office365.com',
    imap_port: 993,
    imap_encryption: 'ssl' as const,
    smtp_host: 'smtp.office365.com',
    smtp_port: 587,
    smtp_encryption: 'tls' as const,
  },
  {
    name: 'Yahoo Mail',
    imap_host: 'imap.mail.yahoo.com',
    imap_port: 993,
    imap_encryption: 'ssl' as const,
    smtp_host: 'smtp.mail.yahoo.com',
    smtp_port: 587,
    smtp_encryption: 'tls' as const,
  },
  {
    name: 'Custom',
    imap_host: '',
    imap_port: 993,
    imap_encryption: 'ssl' as const,
    smtp_host: '',
    smtp_port: 587,
    smtp_encryption: 'tls' as const,
  },
];

interface EmailAccountFormData {
  preset: string;
  account_type: 'personal' | 'shared';
  email_address: string;
  display_name: string;
  imap_host: string;
  imap_port: number;
  imap_username: string;
  imap_password: string;
  imap_encryption: 'ssl' | 'tls' | 'none';
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password: string;
  smtp_encryption: 'ssl' | 'tls' | 'none';
  use_same_credentials: boolean;
}

const defaultFormData: EmailAccountFormData = {
  preset: 'Custom',
  account_type: 'personal',
  email_address: '',
  display_name: '',
  imap_host: '',
  imap_port: 993,
  imap_username: '',
  imap_password: '',
  imap_encryption: 'ssl',
  smtp_host: '',
  smtp_port: 587,
  smtp_username: '',
  smtp_password: '',
  smtp_encryption: 'tls',
  use_same_credentials: true,
};

export function EmailAccountSettings() {
  const { settings } = useProjectContext();
  const projectId = settings.id;
  const { accounts, isLoading, createAccount, updateAccount, deleteAccount, syncAccount, testConnection } = useEmailAccounts(projectId);

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<EmailAccount | null>(null);
  const [formData, setFormData] = useState<EmailAccountFormData>(defaultFormData);
  const [showPasswords, setShowPasswords] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handlePresetChange = (presetName: string) => {
    const preset = emailPresets.find((p) => p.name === presetName);
    if (preset) {
      setFormData((prev) => ({
        ...prev,
        preset: presetName,
        imap_host: preset.imap_host,
        imap_port: preset.imap_port,
        imap_encryption: preset.imap_encryption,
        smtp_host: preset.smtp_host,
        smtp_port: preset.smtp_port,
        smtp_encryption: preset.smtp_encryption,
      }));
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    
    const input: CreateEmailAccountInput = {
      account_type: formData.account_type,
      email_address: formData.email_address,
      display_name: formData.display_name || undefined,
      imap_host: formData.imap_host,
      imap_port: formData.imap_port,
      imap_username: formData.imap_username || formData.email_address,
      imap_password: formData.imap_password,
      imap_encryption: formData.imap_encryption,
      smtp_host: formData.smtp_host || undefined,
      smtp_port: formData.smtp_port || undefined,
      smtp_username: formData.use_same_credentials
        ? formData.imap_username || formData.email_address
        : formData.smtp_username || undefined,
      smtp_password: formData.use_same_credentials
        ? formData.imap_password
        : formData.smtp_password || undefined,
      smtp_encryption: formData.smtp_encryption || undefined,
    };

    const result = await testConnection(input);
    setTestResult(result);
    setIsTesting(false);
  };

  const handleSave = async () => {
    setIsSaving(true);

    const input: CreateEmailAccountInput = {
      account_type: formData.account_type,
      email_address: formData.email_address,
      display_name: formData.display_name || undefined,
      imap_host: formData.imap_host,
      imap_port: formData.imap_port,
      imap_username: formData.imap_username || formData.email_address,
      imap_password: formData.imap_password,
      imap_encryption: formData.imap_encryption,
      smtp_host: formData.smtp_host || undefined,
      smtp_port: formData.smtp_port || undefined,
      smtp_username: formData.use_same_credentials
        ? formData.imap_username || formData.email_address
        : formData.smtp_username || undefined,
      smtp_password: formData.use_same_credentials
        ? formData.imap_password
        : formData.smtp_password || undefined,
      smtp_encryption: formData.smtp_encryption || undefined,
      project_id: formData.account_type === 'shared' ? projectId : undefined,
    };

    const result = await createAccount(input);
    setIsSaving(false);

    if (result) {
      setShowAddDialog(false);
      setFormData(defaultFormData);
      setTestResult(null);
    }
  };

  const handleDelete = async () => {
    if (selectedAccount) {
      await deleteAccount(selectedAccount.id);
      setShowDeleteDialog(false);
      setSelectedAccount(null);
    }
  };

  const getSyncStatusBadge = (account: EmailAccount) => {
    switch (account.sync_status) {
      case 'syncing':
        return (
          <Badge variant="secondary" className="gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Syncing
          </Badge>
        );
      case 'success':
        return (
          <Badge variant="outline" className="gap-1 text-success border-success/30">
            <CheckCircle className="h-3 w-3" />
            Synced
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Error
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            Pending
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Accounts
            </CardTitle>
            <CardDescription>
              Configure IMAP/SMTP settings to sync and send emails
            </CardDescription>
          </div>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Account
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No email accounts configured</p>
            <p className="text-sm">Add an email account to start syncing messages</p>
          </div>
        ) : (
          <div className="space-y-3">
            {accounts.map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium flex items-center gap-2">
                      {account.display_name || account.email_address}
                      <Badge variant="outline" className="text-xs">
                        {account.account_type}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {account.email_address} • {account.imap_host}
                    </div>
                    {account.last_sync_at && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Last synced: {format(new Date(account.last_sync_at), 'MMM d, h:mm a')}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getSyncStatusBadge(account)}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => syncAccount(account.id)}
                    disabled={account.sync_status === 'syncing'}
                  >
                    <RefreshCw className={cn(
                      'h-4 w-4',
                      account.sync_status === 'syncing' && 'animate-spin'
                    )} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      setSelectedAccount(account);
                      setShowDeleteDialog(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Add Account Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Email Account</DialogTitle>
            <DialogDescription>
              Configure your email server settings to sync messages
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Account Type */}
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label>Account Type</Label>
                <Select
                  value={formData.account_type}
                  onValueChange={(v) => setFormData((prev) => ({ ...prev, account_type: v as 'personal' | 'shared' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Personal (Only you)</SelectItem>
                    <SelectItem value="shared">Shared (Project team)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Email Provider</Label>
                <Select value={formData.preset} onValueChange={handlePresetChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {emailPresets.map((preset) => (
                      <SelectItem key={preset.name} value={preset.name}>
                        {preset.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email_address}
                  onChange={(e) => setFormData((prev) => ({ ...prev, email_address: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name (optional)</Label>
                <Input
                  id="displayName"
                  placeholder="John Doe"
                  value={formData.display_name}
                  onChange={(e) => setFormData((prev) => ({ ...prev, display_name: e.target.value }))}
                />
              </div>
            </div>

            <Tabs defaultValue="imap" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="imap">
                  <Server className="h-4 w-4 mr-2" />
                  IMAP (Incoming)
                </TabsTrigger>
                <TabsTrigger value="smtp">
                  <Mail className="h-4 w-4 mr-2" />
                  SMTP (Outgoing)
                </TabsTrigger>
              </TabsList>

              <TabsContent value="imap" className="space-y-4 pt-4">
                <div className="grid gap-4 grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="imapHost">IMAP Server</Label>
                    <Input
                      id="imapHost"
                      placeholder="imap.example.com"
                      value={formData.imap_host}
                      onChange={(e) => setFormData((prev) => ({ ...prev, imap_host: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-4 grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="imapPort">Port</Label>
                      <Input
                        id="imapPort"
                        type="number"
                        value={formData.imap_port}
                        onChange={(e) => setFormData((prev) => ({ ...prev, imap_port: parseInt(e.target.value) || 993 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Encryption</Label>
                      <Select
                        value={formData.imap_encryption}
                        onValueChange={(v) => setFormData((prev) => ({ ...prev, imap_encryption: v as 'ssl' | 'tls' | 'none' }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ssl">SSL/TLS</SelectItem>
                          <SelectItem value="tls">STARTTLS</SelectItem>
                          <SelectItem value="none">None</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                <div className="grid gap-4 grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="imapUsername">Username</Label>
                    <Input
                      id="imapUsername"
                      placeholder="Leave blank to use email"
                      value={formData.imap_username}
                      onChange={(e) => setFormData((prev) => ({ ...prev, imap_username: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="imapPassword">Password / App Password</Label>
                    <div className="relative">
                      <Input
                        id="imapPassword"
                        type={showPasswords ? 'text' : 'password'}
                        value={formData.imap_password}
                        onChange={(e) => setFormData((prev) => ({ ...prev, imap_password: e.target.value }))}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-0 top-0 h-full"
                        onClick={() => setShowPasswords(!showPasswords)}
                      >
                        {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="smtp" className="space-y-4 pt-4">
                <div className="flex items-center gap-2 mb-4">
                  <Switch
                    id="sameCredentials"
                    checked={formData.use_same_credentials}
                    onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, use_same_credentials: checked }))}
                  />
                  <Label htmlFor="sameCredentials">Use same credentials as IMAP</Label>
                </div>

                <div className="grid gap-4 grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="smtpHost">SMTP Server</Label>
                    <Input
                      id="smtpHost"
                      placeholder="smtp.example.com"
                      value={formData.smtp_host}
                      onChange={(e) => setFormData((prev) => ({ ...prev, smtp_host: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-4 grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="smtpPort">Port</Label>
                      <Input
                        id="smtpPort"
                        type="number"
                        value={formData.smtp_port}
                        onChange={(e) => setFormData((prev) => ({ ...prev, smtp_port: parseInt(e.target.value) || 587 }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Encryption</Label>
                      <Select
                        value={formData.smtp_encryption}
                        onValueChange={(v) => setFormData((prev) => ({ ...prev, smtp_encryption: v as 'ssl' | 'tls' | 'none' }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ssl">SSL/TLS</SelectItem>
                          <SelectItem value="tls">STARTTLS</SelectItem>
                          <SelectItem value="none">None</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {!formData.use_same_credentials && (
                  <div className="grid gap-4 grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="smtpUsername">Username</Label>
                      <Input
                        id="smtpUsername"
                        value={formData.smtp_username}
                        onChange={(e) => setFormData((prev) => ({ ...prev, smtp_username: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtpPassword">Password</Label>
                      <Input
                        id="smtpPassword"
                        type={showPasswords ? 'text' : 'password'}
                        value={formData.smtp_password}
                        onChange={(e) => setFormData((prev) => ({ ...prev, smtp_password: e.target.value }))}
                      />
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>

            {/* Test Result */}
            <AnimatePresence>
              {testResult && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div
                    className={cn(
                      'flex items-center gap-3 p-4 rounded-lg',
                      testResult.success
                        ? 'bg-success/10 border border-success/30'
                        : 'bg-destructive/10 border border-destructive/30'
                    )}
                  >
                    {testResult.success ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-success" />
                        <span className="font-medium text-success">Connection successful!</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-5 w-5 text-destructive" />
                        <div>
                          <span className="font-medium text-destructive">Connection failed</span>
                          {testResult.error && (
                            <p className="text-sm text-muted-foreground mt-1">{testResult.error}</p>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleTestConnection} disabled={isTesting || !formData.email_address || !formData.imap_password}>
              {isTesting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Test Connection
                </>
              )}
            </Button>
            <Button onClick={handleSave} disabled={isSaving || !formData.email_address || !formData.imap_password}>
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Add Account'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Email Account</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove "{selectedAccount?.email_address}"? This will delete all synced emails from this account. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Remove Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
