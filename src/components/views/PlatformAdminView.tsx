import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Users,
  Building2,
  Shield,
  Key,
  FileText,
  Activity,
  Search,
  Plus,
  MoreHorizontal,
  Check,
  X,
  AlertTriangle,
  Settings,
  RefreshCw,
  Download,
  Filter,
  Lock,
  Bot
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { AIProviderSettings } from '@/components/admin/AIProviderSettings';
import { useAdminUsers, useAdminOrganizations, useAdminAuditLogs, useAdminApiKeys, useUpdateUserRole, useRevokeApiKey } from '@/hooks/useAdmin';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";

const roleColors: Record<string, string> = {
  admin: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  manager: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  member: 'bg-green-500/20 text-green-400 border-green-500/30',
  viewer: 'bg-muted text-muted-foreground border-border',
};

const statusColors: Record<string, string> = {
  active: 'bg-success/20 text-success border-success/30',
  inactive: 'bg-muted text-muted-foreground border-border',
  pending: 'bg-warning/20 text-warning border-warning/30',
  suspended: 'bg-destructive/20 text-destructive border-destructive/30',
  revoked: 'bg-destructive/20 text-destructive border-destructive/30',
};

export function PlatformAdminView() {
  const [activeTab, setActiveTab] = useState('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: users, isLoading: loadingUsers, refetch: refetchUsers } = useAdminUsers();
  const { data: organizations, isLoading: loadingOrgs, refetch: refetchOrgs } = useAdminOrganizations();
  const { data: auditLogs, isLoading: loadingLogs, refetch: refetchLogs } = useAdminAuditLogs();
  const { data: apiKeys, isLoading: loadingKeys, refetch: refetchKeys } = useAdminApiKeys();

  const updateUser = useUpdateUserRole();
  const revokeKey = useRevokeApiKey();

  const handleRefresh = () => {
    refetchUsers();
    refetchOrgs();
    refetchLogs();
    refetchKeys();
    toast.success('Admin data refreshed');
  };

  const filteredUsers = users?.filter(user => {
    const matchesSearch = (user.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || (user as any).role === roleFilter;
    const matchesStatus = statusFilter === 'all' || (user as any).status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const isLoading = loadingUsers || loadingOrgs || loadingLogs || loadingKeys;

  if (isLoading && !users) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b bg-card">
        <div>
          <h1 className="text-2xl font-bold">Platform Administration</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Manage users, organizations, security, and system settings
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="organizations" className="gap-2">
              <Building2 className="h-4 w-4" />
              Organizations
            </TabsTrigger>
            <TabsTrigger value="ai-platform" className="gap-2">
              <Bot className="h-4 w-4" />
              AI Platform
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="api-keys" className="gap-2">
              <Key className="h-4 w-4" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="audit-logs" className="gap-2">
              <FileText className="h-4 w-4" />
              Audit Logs
            </TabsTrigger>
            <TabsTrigger value="health" className="gap-2">
              <Activity className="h-4 w-4" />
              System Health
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Filter className="h-4 w-4 mr-2" />
                      Filter {(roleFilter !== 'all' || statusFilter !== 'all') && '(Active)'}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Filter Users</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="font-normal text-xs text-muted-foreground">Role</DropdownMenuLabel>
                    {['all', 'admin', 'manager', 'member', 'viewer'].map(role => (
                      <DropdownMenuCheckboxItem
                        key={role}
                        checked={roleFilter === role}
                        onCheckedChange={() => setRoleFilter(role)}
                        className="capitalize"
                      >
                        {role}
                      </DropdownMenuCheckboxItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel className="font-normal text-xs text-muted-foreground">Status</DropdownMenuLabel>
                    {['all', 'active', 'suspended', 'pending'].map(status => (
                      <DropdownMenuCheckboxItem
                        key={status}
                        checked={statusFilter === status}
                        onCheckedChange={() => setStatusFilter(status)}
                        className="capitalize"
                      >
                        {status}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              </div>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers?.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar_url || ''} />
                            <AvatarFallback className="text-xs">
                              {(user.full_name || user.email || '?').substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm">{user.full_name || 'Unknown'}</div>
                            <div className="text-xs text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('capitalize', roleColors[(user as any).role || 'member'])}>
                          {(user as any).role || 'member'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('capitalize', statusColors[(user as any).status || 'active'])}>
                          {(user as any).status || 'active'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {(user as any).last_active_at
                          ? new Date((user as any).last_active_at).toLocaleString()
                          : 'Never'}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="iconSm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredUsers?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Organizations Tab */}
          <TabsContent value="organizations" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search organizations..." className="pl-9" />
              </div>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Organization
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {organizations?.map((org) => (
                <Card key={org.id} className="hover:border-primary/50 transition-colors cursor-pointer">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{org.name}</CardTitle>
                          <Badge variant="outline" className="mt-1 capitalize">
                            {org.plan}
                          </Badge>
                        </div>
                      </div>
                      <Badge variant="outline" className={statusColors[org.status || 'active']}>
                        {org.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        {/* TODO: Add counts via join or separate query */}
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>-- users</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>-- projects</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {organizations?.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  No organizations found.
                </div>
              )}
            </div>
          </TabsContent>

          {/* AI Platform Tab */}
          <TabsContent value="ai-platform">
            <AIProviderSettings />
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
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
                      <div className="text-xs text-muted-foreground">Require two-factor authentication</div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">SSO Only</div>
                      <div className="text-xs text-muted-foreground">Disable password authentication</div>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">Session Timeout</div>
                      <div className="text-xs text-muted-foreground">Auto-logout after inactivity</div>
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
                      <div className="text-xs text-muted-foreground">Restrict access by IP address</div>
                    </div>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">Audit Logging</div>
                      <div className="text-xs text-muted-foreground">Track all user actions</div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-sm">Data Export</div>
                      <div className="text-xs text-muted-foreground">Allow bulk data exports</div>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="api-keys" className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Manage API keys for programmatic access to the platform
              </p>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create API Key
              </Button>
            </div>

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
                        {key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : 'Never'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[key.status || 'active']}>
                          {key.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="iconSm" onClick={() => revokeKey.mutate(key.id)}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {apiKeys?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No API keys found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* Audit Logs Tab */}
          <TabsContent value="audit-logs" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search audit logs..." className="pl-9" />
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Action</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs?.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">{log.action}</TableCell>
                      <TableCell className="text-sm">
                        {(log as any).profiles?.email || (log as any).user_id}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {log.resource}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">{log.ip_address}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {log.status === 'success' ? (
                          <Badge variant="outline" className="bg-success/20 text-success border-success/30">
                            <Check className="h-3 w-3 mr-1" />
                            Success
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-destructive/20 text-destructive border-destructive/30">
                            <X className="h-3 w-3 mr-1" />
                            Failed
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {auditLogs?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No audit logs found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          {/* System Health Tab */}
          <TabsContent value="health" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-success/20 flex items-center justify-center">
                      <Activity className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">99.9%</div>
                      <div className="text-xs text-muted-foreground">Uptime (30d)</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Activity className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">45ms</div>
                      <div className="text-xs text-muted-foreground">Avg Response</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-warning/20 flex items-center justify-center">
                      <AlertTriangle className="h-5 w-5 text-warning" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">2</div>
                      <div className="text-xs text-muted-foreground">Active Alerts</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-info/20 flex items-center justify-center">
                      <Settings className="h-5 w-5 text-info" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">v2.4.1</div>
                      <div className="text-xs text-muted-foreground">Platform Version</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Service Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {['API Server', 'Database', 'Cache', 'File Storage', 'Email Service'].map((service) => (
                    <div key={service} className="flex items-center justify-between">
                      <span className="text-sm">{service}</span>
                      <Badge variant="outline" className="bg-success/20 text-success border-success/30">
                        <div className="h-2 w-2 rounded-full bg-success mr-2" />
                        Operational
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Recent Incidents</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-muted-foreground">
                    <Check className="h-8 w-8 mx-auto mb-2 text-success" />
                    <p className="text-sm">No incidents in the last 30 days</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
