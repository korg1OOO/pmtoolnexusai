/**
 * Admin Security Settings
 * Authentication, access control, and security policies
 */

import React from 'react';
import { Shield, Lock } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function AdminSecurity() {
    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Security Settings</h1>
                <p className="text-muted-foreground mt-1">
                    Configure authentication, access control, and security policies
                </p>
            </div>

            {/* Security Cards */}
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Lock className="h-4 w-4" />
                            Authentication Settings
                        </CardTitle>
                        <CardDescription>Configure login and session policies</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium text-sm">Enforce MFA</div>
                                <div className="text-xs text-muted-foreground">
                                    Require two-factor authentication
                                </div>
                            </div>
                            <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium text-sm">SSO Only</div>
                                <div className="text-xs text-muted-foreground">
                                    Disable password authentication
                                </div>
                            </div>
                            <Switch />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium text-sm">Session Timeout</div>
                                <div className="text-xs text-muted-foreground">
                                    Auto-logout after inactivity
                                </div>
                            </div>
                            <Badge variant="outline">30 minutes</Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Access Control
                        </CardTitle>
                        <CardDescription>Manage permissions and restrictions</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium text-sm">IP Allowlist</div>
                                <div className="text-xs text-muted-foreground">
                                    Restrict access by IP address
                                </div>
                            </div>
                            <Switch />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium text-sm">Audit Logging</div>
                                <div className="text-xs text-muted-foreground">
                                    Track all user actions
                                </div>
                            </div>
                            <Switch defaultChecked />
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="font-medium text-sm">Data Export</div>
                                <div className="text-xs text-muted-foreground">
                                    Allow bulk data exports
                                </div>
                            </div>
                            <Switch defaultChecked />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
