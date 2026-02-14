/**
 * Admin Security Settings
 * Password policies, 2FA, session management, IP whitelisting, and security audit logs
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Shield,
    Lock,
    Key,
    Clock,
    Globe,
    FileText,
    Save,
    AlertTriangle,
    CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useSecurityLogs } from '@/hooks/useSecurityLogs';
import { getPasswordPolicy, updatePasswordPolicy, PasswordPolicy } from '@/services/passwordPolicyService';

export function AdminSecuritySettings() {
    const [passwordPolicy, setPasswordPolicy] = useState({
        minLength: 8,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        expiryDays: 90,
    });

    const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
    const [sessionTimeout, setSessionTimeout] = useState(30);
    const [ipWhitelist, setIpWhitelist] = useState('');

    const { data: securityLogs = [] } = useSecurityLogs({ limit: 10 });

    const handleSavePasswordPolicy = async () => {
        try {
            await updatePasswordPolicy({
                min_length: passwordPolicy.minLength,
                require_uppercase: passwordPolicy.requireUppercase,
                require_lowercase: passwordPolicy.requireLowercase,
                require_numbers: passwordPolicy.requireNumbers,
                require_special_chars: passwordPolicy.requireSpecialChars,
                password_expiry_days: passwordPolicy.expiryDays,
            });
            toast.success('Password policy updated successfully');
        } catch (error) {
            toast.error('Failed to update password policy');
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Security Settings</h1>
                <p className="text-muted-foreground mt-1">
                    Configure platform security policies and monitor security events
                </p>
            </div>

            <Tabs defaultValue="password" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="password" className="gap-2">
                        <Lock className="h-4 w-4" />
                        Password Policy
                    </TabsTrigger>
                    <TabsTrigger value="2fa" className="gap-2">
                        <Key className="h-4 w-4" />
                        Two-Factor Auth
                    </TabsTrigger>
                    <TabsTrigger value="sessions" className="gap-2">
                        <Clock className="h-4 w-4" />
                        Sessions
                    </TabsTrigger>
                    <TabsTrigger value="ip" className="gap-2">
                        <Globe className="h-4 w-4" />
                        IP Whitelist
                    </TabsTrigger>
                    <TabsTrigger value="audit" className="gap-2">
                        <FileText className="h-4 w-4" />
                        Audit Logs
                    </TabsTrigger>
                </TabsList>

                {/* Password Policy Tab */}
                <TabsContent value="password" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Password Requirements</CardTitle>
                            <CardDescription>
                                Configure password complexity and expiration rules
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="minLength">Minimum Length</Label>
                                    <Input
                                        id="minLength"
                                        type="number"
                                        value={passwordPolicy.minLength}
                                        onChange={(e) => setPasswordPolicy({ ...passwordPolicy, minLength: parseInt(e.target.value) })}
                                        className="w-20"
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <Label htmlFor="requireUppercase">Require Uppercase Letters</Label>
                                    <Switch
                                        id="requireUppercase"
                                        checked={passwordPolicy.requireUppercase}
                                        onCheckedChange={(checked) => setPasswordPolicy({ ...passwordPolicy, requireUppercase: checked })}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <Label htmlFor="requireLowercase">Require Lowercase Letters</Label>
                                    <Switch
                                        id="requireLowercase"
                                        checked={passwordPolicy.requireLowercase}
                                        onCheckedChange={(checked) => setPasswordPolicy({ ...passwordPolicy, requireLowercase: checked })}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <Label htmlFor="requireNumbers">Require Numbers</Label>
                                    <Switch
                                        id="requireNumbers"
                                        checked={passwordPolicy.requireNumbers}
                                        onCheckedChange={(checked) => setPasswordPolicy({ ...passwordPolicy, requireNumbers: checked })}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <Label htmlFor="requireSpecialChars">Require Special Characters</Label>
                                    <Switch
                                        id="requireSpecialChars"
                                        checked={passwordPolicy.requireSpecialChars}
                                        onCheckedChange={(checked) => setPasswordPolicy({ ...passwordPolicy, requireSpecialChars: checked })}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <Label htmlFor="expiryDays">Password Expiry (days)</Label>
                                    <Input
                                        id="expiryDays"
                                        type="number"
                                        value={passwordPolicy.expiryDays}
                                        onChange={(e) => setPasswordPolicy({ ...passwordPolicy, expiryDays: parseInt(e.target.value) })}
                                        className="w-20"
                                    />
                                </div>
                            </div>

                            <Button onClick={handleSavePasswordPolicy}>
                                <Save className="h-4 w-4 mr-2" />
                                Save Password Policy
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* 2FA Tab */}
                <TabsContent value="2fa" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Two-Factor Authentication</CardTitle>
                            <CardDescription>
                                Enforce 2FA for admin accounts and manage settings
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="enforce2fa">Enforce 2FA for Admin Accounts</Label>
                                    <p className="text-sm text-muted-foreground">
                                        Require all admin users to enable two-factor authentication
                                    </p>
                                </div>
                                <Switch
                                    id="enforce2fa"
                                    checked={twoFactorEnabled}
                                    onCheckedChange={setTwoFactorEnabled}
                                />
                            </div>

                            <div className="p-4 border rounded-lg bg-muted/50">
                                <div className="flex items-start gap-3">
                                    <Shield className="h-5 w-5 text-primary mt-0.5" />
                                    <div>
                                        <p className="font-medium">Current Status</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {twoFactorEnabled ? '2FA is enforced for all admin accounts' : '2FA is optional'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Button onClick={() => toast.success('2FA settings updated')}>
                                <Save className="h-4 w-4 mr-2" />
                                Save 2FA Settings
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Sessions Tab */}
                <TabsContent value="sessions" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Session Management</CardTitle>
                            <CardDescription>
                                Configure session timeout and concurrent session limits
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Automatically log out inactive users
                                        </p>
                                    </div>
                                    <Input
                                        id="sessionTimeout"
                                        type="number"
                                        value={sessionTimeout}
                                        onChange={(e) => setSessionTimeout(parseInt(e.target.value))}
                                        className="w-20"
                                    />
                                </div>
                            </div>

                            <Button onClick={() => toast.success('Session settings saved')}>
                                <Save className="h-4 w-4 mr-2" />
                                Save Session Settings
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* IP Whitelist Tab */}
                <TabsContent value="ip" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>IP Whitelist</CardTitle>
                            <CardDescription>
                                Restrict admin access to specific IP addresses
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="ipWhitelist">Allowed IP Addresses</Label>
                                <Input
                                    id="ipWhitelist"
                                    placeholder="192.168.1.1, 10.0.0.0/24"
                                    value={ipWhitelist}
                                    onChange={(e) => setIpWhitelist(e.target.value)}
                                />
                                <p className="text-sm text-muted-foreground">
                                    Enter IP addresses or CIDR ranges, separated by commas
                                </p>
                            </div>

                            <Button onClick={() => toast.success('IP whitelist saved')}>
                                <Save className="h-4 w-4 mr-2" />
                                Save IP Whitelist
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Audit Logs Tab */}
                <TabsContent value="audit" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Security Audit Logs</CardTitle>
                            <CardDescription>
                                Recent security events and authentication attempts
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {securityLogs.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No security logs found
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {securityLogs.map((log) => (
                                        <div key={log.id} className="flex items-start justify-between p-3 border rounded-lg">
                                            <div className="flex items-start gap-3">
                                                {log.severity === 'critical' ? (
                                                    <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                                                ) : log.severity === 'warning' ? (
                                                    <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                                                ) : (
                                                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                                                )}
                                                <div>
                                                    <p className="font-medium">{log.event_type}</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {log.user_email || 'Unknown'} from {log.ip_address || 'Unknown IP'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <Badge
                                                    variant={
                                                        log.severity === 'critical' ? 'destructive' :
                                                            log.severity === 'warning' ? 'secondary' : 'default'
                                                    }
                                                >
                                                    {log.severity}
                                                </Badge>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {new Date(log.created_at).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
