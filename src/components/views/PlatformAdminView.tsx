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
  ChevronRight,
  Lock,
  Eye,
  Edit,
  Trash2,
  Bot,
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

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'member' | 'viewer';
  status: 'active' | 'inactive' | 'pending';
  lastActive: string;
  mfaEnabled: boolean;
  avatar?: string;
}

interface Organization {
  id: string;
  name: string;
  plan: 'enterprise' | 'professional' | 'starter';
  users: number;
  projects: number;
  status: 'active' | 'suspended';
}

interface AuditLog {
  id: string;
  action: string;
  user: string;
  resource: string;
  timestamp: string;
  ip: string;
  status: 'success' | 'failed';
}

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  created: string;
  lastUsed: string;
  status: 'active' | 'revoked';
  scopes: string[];
}

const mockUsers: User[] = [
  { id: '1', name: 'Sarah Chen', email: 'sarah.chen@company.com', role: 'admin', status: 'active', lastActive: '2024-01-15T10:30:00', mfaEnabled: true },
  { id: '2', name: 'Michael Rodriguez', email: 'm.rodriguez@company.com', role: 'manager', status: 'active', lastActive: '2024-01-15T09:45:00', mfaEnabled: true },
  { id: '3', name: 'Emily Watson', email: 'e.watson@company.com', role: 'member', status: 'active', lastActive: '2024-01-14T16:20:00', mfaEnabled: false },
  { id: '4', name: 'David Kim', email: 'd.kim@company.com', role: 'viewer', status: 'pending', lastActive: '-', mfaEnabled: false },
];

const mockOrganizations: Organization[] = [
  { id: '1', name: 'Acme Corporation', plan: 'enterprise', users: 150, projects: 45, status: 'active' },
  { id: '2', name: 'TechStart Inc', plan: 'professional', users: 25, projects: 12, status: 'active' },
  { id: '3', name: 'Global Solutions', plan: 'enterprise', users: 200, projects: 78, status: 'active' },
];

const mockAuditLogs: AuditLog[] = [
  { id: '1', action: 'user.login', user: 'sarah.chen@company.com', resource: 'auth', timestamp: '2024-01-15T10:30:00', ip: '192.168.1.100', status: 'success' },
  { id: '2', action: 'project.create', user: 'm.rodriguez@company.com', resource: 'project/EPM-2024', timestamp: '2024-01-15T09:45:00', ip: '192.168.1.101', status: 'success' },
  { id: '3', action: 'user.permission.update', user: 'admin@company.com', resource: 'user/d.kim', timestamp: '2024-01-15T09:30:00', ip: '192.168.1.102', status: 'success' },
  { id: '4', action: 'api.key.revoke', user: 'sarah.chen@company.com', resource: 'apikey/prod-001', timestamp: '2024-01-14T16:20:00', ip: '192.168.1.100', status: 'success' },
  { id: '5', action: 'user.login', user: 'unknown@attacker.com', resource: 'auth', timestamp: '2024-01-14T15:00:00', ip: '45.33.32.156', status: 'failed' },
];

const mockApiKeys: ApiKey[] = [
  { id: '1', name: 'Production API', prefix: 'pk_live_xxx', created: '2024-01-01', lastUsed: '2024-01-15', status: 'active', scopes: ['read', 'write'] },
  { id: '2', name: 'CI/CD Pipeline', prefix: 'pk_ci_xxx', created: '2023-12-15', lastUsed: '2024-01-15', status: 'active', scopes: ['read'] },
  { id: '3', name: 'Analytics Service', prefix: 'pk_analytics_xxx', created: '2023-11-01', lastUsed: '2024-01-10', status: 'revoked', scopes: ['read'] },
];

const roleColors: Record<User['role'], string> = {
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
          <Button variant="outline" size="sm">
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
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
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
                    <TableHead>MFA</TableHead>
                    <TableHead>Last Active</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback className="text-xs">
                              {user.name.split(' ').map((n) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm">{user.name}</div>
                            <div className="text-xs text-muted-foreground">{user.email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('capitalize', roleColors[user.role])}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('capitalize', statusColors[user.status])}>
                          {user.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.mfaEnabled ? (
                          <Badge variant="outline" className="bg-success/20 text-success border-success/30">
                            <Check className="h-3 w-3 mr-1" />
                            Enabled
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-muted text-muted-foreground">
                            <X className="h-3 w-3 mr-1" />
                            Disabled
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {user.lastActive !== '-'
                          ? new Date(user.lastActive).toLocaleString()
                          : 'Never'}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="iconSm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
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
              {mockOrganizations.map((org) => (
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
                      <Badge variant="outline" className={statusColors[org.status]}>
                        {org.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{org.users} users</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <span>{org.projects} projects</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
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
                    <TableHead>Scopes</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Used</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockApiKeys.map((key) => (
                    <TableRow key={key.id}>
                      <TableCell className="font-medium">{key.name}</TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {key.prefix}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {key.scopes.map((scope) => (
                            <Badge key={scope} variant="outline" className="text-xs">
                              {scope}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{key.created}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{key.lastUsed}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[key.status]}>
                          {key.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="iconSm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
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
                  {mockAuditLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">{log.action}</TableCell>
                      <TableCell className="text-sm">{log.user}</TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">
                        {log.resource}
                      </TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">{log.ip}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString()}
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
