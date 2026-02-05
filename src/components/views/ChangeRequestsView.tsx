import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  FileEdit,
  Plus,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Calendar,
  User,
  DollarSign,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useProjectContext } from '@/contexts/ProjectContext';
import { useChangeRequests, ChangeRequest, useUpdateChangeRequest, useCreateChangeRequest } from '@/hooks/useChangeRequests';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';

export function ChangeRequestsView() {
  const { settings } = useProjectContext();
  const { data: changeRequests = [], isLoading } = useChangeRequests(settings.id);
  const updateCR = useUpdateChangeRequest();
  const createCR = useCreateChangeRequest();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCR, setSelectedCR] = useState<ChangeRequest | null>(null);

  const handleUpdateStatus = async (status: 'approved' | 'rejected') => {
    if (!selectedCR) return;
    await updateCR.mutateAsync({ id: selectedCR.id, status });
    setSelectedCR(prev => prev ? { ...prev, status } : null);
  };

  const handleCreateCR = async () => {
    if (!settings.id) return;
    await createCR.mutateAsync({
      project_id: settings.id,
      title: 'New Scope Change',
      description: 'Description of the proposed change...',
      type: 'scope',
      priority: 'medium',
      status: 'pending',
      requested_by_id: 'current-user-id',
      requested_by_name: 'Project Manager',
      requested_at: new Date().toISOString(),
    });
  };

  const filteredCRs = changeRequests.filter(cr =>
    cr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (cr.description?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  // Helper to safely get impact details
  const getImpactDetails = (cr: ChangeRequest) => {
    const details = cr.impact_details as Record<string, unknown> | null;
    return {
      cost: Number(details?.cost) || 0,
      schedule: Number(details?.schedule) || 0,
      risk: (details?.risk as string) || 'low',
      scope: (details?.scope as string) || '',
    };
  };

  const stats = {
    total: changeRequests.length,
    pending: changeRequests.filter(cr => cr.status === 'pending').length,
    approved: changeRequests.filter(cr => cr.status === 'approved').length,
    totalCostImpact: changeRequests
      .filter(cr => cr.status === 'approved')
      .reduce((sum, cr) => sum + getImpactDetails(cr).cost, 0),
    totalScheduleImpact: changeRequests
      .filter(cr => cr.status === 'approved')
      .reduce((sum, cr) => sum + getImpactDetails(cr).schedule, 0),
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-destructive" />;
      case 'pending': return <Clock className="h-4 w-4 text-warning" />;
      case 'implemented': return <CheckCircle2 className="h-4 w-4 text-primary" />;
      default: return <FileEdit className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'scope': return 'bg-purple-500/20 text-purple-600';
      case 'schedule': return 'bg-blue-500/20 text-blue-600';
      case 'cost': return 'bg-amber-500/20 text-amber-600';
      case 'resource': return 'bg-green-500/20 text-green-600';
      default: return 'bg-muted';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b bg-card">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/20">
              <FileEdit className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Change Requests</h1>
              <p className="text-muted-foreground">Manage scope, schedule, and cost change requests</p>
            </div>
          </div>
          <Button onClick={handleCreateCR} disabled={createCR.isPending}>
            {createCR.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
            New Change Request
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="p-6 border-b grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Requests</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-warning">{stats.pending}</div>
            <p className="text-sm text-muted-foreground">Pending Approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-success">{stats.approved}</div>
            <p className="text-sm text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className={cn(
              "text-2xl font-bold",
              stats.totalCostImpact > 0 ? 'text-destructive' : 'text-success'
            )}>
              {stats.totalCostImpact > 0 ? '+' : ''}${(stats.totalCostImpact / 1000).toFixed(0)}K
            </div>
            <p className="text-sm text-muted-foreground">Cost Impact</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className={cn(
              "text-2xl font-bold",
              stats.totalScheduleImpact > 0 ? 'text-destructive' : 'text-success'
            )}>
              {stats.totalScheduleImpact > 0 ? '+' : ''}{stats.totalScheduleImpact} days
            </div>
            <p className="text-sm text-muted-foreground">Schedule Impact</p>
          </CardContent>
        </Card>
      </div>

      {/* Search & Filters */}
      <div className="p-4 border-b flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search change requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button variant="outline">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* List */}
        <div className="flex-1 overflow-auto p-6">
          <div className="space-y-4">
            {filteredCRs.map((cr) => (
              <motion.div
                key={cr.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ x: 2 }}
                onClick={() => setSelectedCR(cr)}
                className={cn(
                  "p-4 rounded-lg border bg-card hover:shadow-md transition-all cursor-pointer",
                  selectedCR?.id === cr.id && 'border-primary bg-primary/5'
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(cr.status || 'pending')}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">{cr.id.slice(0, 8)}</span>
                        <h3 className="font-semibold">{cr.title}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{cr.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("px-2 py-1 rounded text-xs font-medium", getTypeColor(cr.type || 'scope'))}>
                      {cr.type}
                    </span>
                    <Badge variant={(cr.status === 'pending' ? 'warning' : cr.status === 'approved' ? 'success' : 'destructive') as any}>
                      {cr.status || 'pending'}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    {cr.requested_by_name || 'Anonymous'}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    {cr.requested_at ? new Date(cr.requested_at).toLocaleDateString() : 'N/A'}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={cr.priority === 'critical' ? 'destructive' : cr.priority === 'high' ? 'warning' : 'secondary'}>
                      {cr.priority}
                    </Badge>
                  </div>
                </div>

                {/* Impact Preview */}
                <div className="mt-3 pt-3 border-t flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className={cn(
                      (Number((cr.impact_details as any)?.schedule) || 0) > 0 ? 'text-destructive' : (Number((cr.impact_details as any)?.schedule) || 0) < 0 ? 'text-success' : ''
                    )}>
                      {(Number((cr.impact_details as any)?.schedule) || 0) > 0 ? '+' : ''}{Number((cr.impact_details as any)?.schedule) || 0} days
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                    <span className={cn(
                      (Number((cr.impact_details as any)?.cost) || 0) > 0 ? 'text-destructive' : (Number((cr.impact_details as any)?.cost) || 0) < 0 ? 'text-success' : ''
                    )}>
                      {(Number((cr.impact_details as any)?.cost) || 0) > 0 ? '+' : ''}${Math.abs((Number((cr.impact_details as any)?.cost) || 0) / 1000).toFixed(0)}K
                    </span>
                  </div>
                  <Badge variant={
                    (cr.impact_details as any)?.risk === 'high' ? 'destructive' :
                      (cr.impact_details as any)?.risk === 'medium' ? 'warning' : 'success'
                  }>
                    {(cr.impact_details as any)?.risk || 'low'} risk
                  </Badge>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        {selectedCR && (
          <div className="w-96 border-l p-6 overflow-auto bg-muted/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold">Change Request Details</h2>
              <Badge variant="outline" className="capitalize">
                {selectedCR.type || 'General'}
              </Badge>
            </div>

            <Tabs defaultValue="details" className="space-y-4">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="impact">Impact</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Type</label>
                  <p className="text-sm capitalize">{selectedCR.type}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Priority</label>
                  <Badge variant={(selectedCR.priority === 'critical' ? 'destructive' : selectedCR.priority === 'high' ? 'warning' : 'secondary') as any}>
                    {selectedCR.priority || 'medium'}
                  </Badge>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Requested By</label>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {(selectedCR.requested_by_name || 'A').split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{selectedCR.requested_by_name || 'Anonymous'}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Justification</label>
                  <p className="text-sm mt-1">{selectedCR.justification || 'No justification provided.'}</p>
                </div>
                {selectedCR.alternatives && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Alternatives Considered</label>
                    <p className="text-sm mt-1">{selectedCR.alternatives}</p>
                  </div>
                )}
                {selectedCR.approved_by_name && (
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Approver</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-xs">
                          {selectedCR.approved_by_name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{selectedCR.approved_by_name}</span>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="impact" className="space-y-4">
                <Card>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Schedule Impact</span>
                      <span className={cn(
                        "font-semibold",
                        (Number((selectedCR.impact_details as any)?.schedule) || 0) > 0 ? 'text-destructive' : 'text-success'
                      )}>
                        {(Number((selectedCR.impact_details as any)?.schedule) || 0) > 0 ? '+' : ''}{Number((selectedCR.impact_details as any)?.schedule) || 0} days
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Cost Impact</span>
                      <span className={cn(
                        "font-semibold",
                        (Number((selectedCR.impact_details as any)?.cost) || 0) > 0 ? 'text-destructive' : 'text-success'
                      )}>
                        {(Number((selectedCR.impact_details as any)?.cost) || 0) > 0 ? '+' : ''}${(Number((selectedCR.impact_details as any)?.cost) || 0) / 1000}K
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Risk Level</span>
                      <Badge variant={
                        (selectedCR.impact_details as any)?.risk === 'high' ? 'destructive' :
                          (selectedCR.impact_details as any)?.risk === 'medium' ? 'warning' : 'success'
                      }>
                        {(selectedCR.impact_details as any)?.risk || 'low'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Scope Impact</label>
                  <p className="text-sm mt-1">{(selectedCR.impact_details as any)?.scope || 'No scope impact described.'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Affected Tasks</label>
                  <div className="mt-1 space-y-1">
                    {Array.isArray(selectedCR.affected_tasks) && selectedCR.affected_tasks.map((taskId: any) => (
                      <Badge key={taskId} variant="outline" className="mr-1">
                        {taskId}
                      </Badge>
                    ))}
                    {(!selectedCR.affected_tasks || (Array.isArray(selectedCR.affected_tasks) && selectedCR.affected_tasks.length === 0)) && (
                      <p className="text-xs text-muted-foreground italic">No tasks specified.</p>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {selectedCR.status === 'pending' && (
              <div className="mt-6 pt-4 border-t flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleUpdateStatus('rejected')}
                  disabled={updateCR.isPending}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => handleUpdateStatus('approved')}
                  disabled={updateCR.isPending}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
