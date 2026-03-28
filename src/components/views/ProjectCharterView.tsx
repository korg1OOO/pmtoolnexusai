import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  FileText,
  Target,
  Users,
  CheckCircle2,
  AlertCircle,
  Calendar,
  DollarSign,
  Edit2,
  Save,
  Award,
  Bookmark,
  Link2,
  Loader2,
  Plus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useProjectContext } from '@/contexts/ProjectContext';
import { useProjectCharter, useUpdateProjectCharter, ProjectCharter } from '@/hooks/useProjectCharter';

export default function ProjectCharterView() {
  const { settings: project } = useProjectContext();
  const { data: charter, isLoading } = useProjectCharter(project?.id);
  const updateCharter = useUpdateProjectCharter();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<ProjectCharter>>({});

  useEffect(() => {
    if (charter) {
      setFormData(charter);
    }
  }, [charter]);

  const handleSave = async () => {
    if (!project?.id) return;
    try {
      await updateCharter.mutateAsync({
        ...formData,
        project_id: project.id,
      });
      setIsEditing(false);
    } catch (error) {
      // Error handled by mutation toast
    }
  };

  const handleCreate = async () => {
    if (!project?.id) return;
    await updateCharter.mutateAsync({
      project_id: project.id,
      status: 'Draft',
      version: '1.0',
      vision: '',
      mission: '',
      objectives: [],
      success_criteria: [],
      assumptions: [],
      constraints: [],
      approval_authorities: [],
      milestones: [],
      budget_summary: { approved: 0, allocated: 0, spent: 0 }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!charter) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-12 text-center">
        <div className="p-4 rounded-full bg-primary/10 mb-4">
          <FileText className="h-12 w-12 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">No Project Charter</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          A project charter has not been created for this project yet.
          Create one to define the project's vision, objectives, and authority.
        </p>
        <Button onClick={handleCreate} disabled={updateCharter.isPending}>
          {updateCharter.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
          Create Project Charter
        </Button>
      </div>
    );
  }

  // Helper to cast JSONB fields
  const objectives = (formData.objectives as any[]) || [];
  const successCriteria = (formData.success_criteria as any[]) || [];
  const assumptions = (formData.assumptions as any[]) || [];
  const constraints = (formData.constraints as any[]) || [];
  const approvalAuthorities = (formData.approval_authorities as any[]) || [];
  const milestones = (formData.milestones as any[]) || [];
  const budget = (formData.budget_summary as any) || {};

  return (
    <div className="flex flex-col h-full overflow-auto">
      {/* Header */}
      <div className="p-6 border-b bg-card">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/20">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <p className="text-muted-foreground">Project Charter • Version {charter.version}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={charter.status === 'Approved' ? 'success' : 'warning'}>{charter.status}</Badge>
                {charter.approved_at && (
                  <span className="text-xs text-muted-foreground">
                    Approved: {new Date(charter.approved_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={isEditing ? 'default' : 'outline'}
              onClick={isEditing ? handleSave : () => setIsEditing(true)}
              disabled={updateCharter.isPending}
            >
              {updateCharter.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> :
                isEditing ? <Save className="h-4 w-4 mr-2" /> : <Edit2 className="h-4 w-4 mr-2" />}
              {isEditing ? 'Save Changes' : 'Edit Charter'}
            </Button>
            <Button variant="outline">
              <Bookmark className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 p-6">
        <div className="max-w-5xl mx-auto">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="objectives">Objectives</TabsTrigger>
              <TabsTrigger value="constraints">Assumptions & Constraints</TabsTrigger>
              <TabsTrigger value="approvals">Approvals</TabsTrigger>
              <TabsTrigger value="milestones">Milestones</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Vision & Mission */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      Vision Statement
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <Textarea
                        value={formData.vision || ''}
                        onChange={(e) => setFormData({ ...formData, vision: e.target.value })}
                        placeholder="Define the long-term vision..."
                        className="min-h-[100px]"
                      />
                    ) : (
                      <p className="text-sm leading-relaxed">{charter.vision || 'No vision statement defined.'}</p>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary" />
                      Mission Statement
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <Textarea
                        value={formData.mission || ''}
                        onChange={(e) => setFormData({ ...formData, mission: e.target.value })}
                        placeholder="Define the project mission..."
                        className="min-h-[100px]"
                      />
                    ) : (
                      <p className="text-sm leading-relaxed">{charter.mission || 'No mission statement defined.'}</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Success Criteria */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-success" />
                    Success Criteria
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {successCriteria.map((criteria, i) => (
                      <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-muted/30">
                        <CheckCircle2 className="h-4 w-4 text-success mt-0.5" />
                        <span className="text-sm">{criteria}</span>
                      </div>
                    ))}
                    {successCriteria.length === 0 && (
                      <p className="text-sm text-muted-foreground italic">No success criteria defined.</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Budget Summary */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    Budget Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-4 rounded-lg bg-muted/30">
                      <div className="text-2xl font-bold">${((budget.approved || 0) / 1000000).toFixed(1)}M</div>
                      <p className="text-xs text-muted-foreground">Approved Budget</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/30">
                      <div className="text-2xl font-bold">${((budget.allocated || 0) / 1000000).toFixed(1)}M</div>
                      <p className="text-xs text-muted-foreground">Allocated</p>
                    </div>
                    <div className="text-center p-4 rounded-lg bg-muted/30">
                      <div className="text-2xl font-bold text-primary">${((budget.spent || 0) / 1000000).toFixed(2)}M</div>
                      <p className="text-xs text-muted-foreground">Spent to Date</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="objectives" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Project Objectives</CardTitle>
                  <CardDescription>Measurable goals with success criteria</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {objectives.map((obj, idx) => (
                      <div key={obj.id || idx} className="p-4 rounded-lg border bg-muted/20">
                        <div className="flex items-start justify-between mb-3">
                          <p className="text-sm font-medium">{obj.text}</p>
                          <Badge variant={
                            obj.status === 'completed' ? 'success' :
                              obj.status === 'at-risk' ? 'destructive' :
                                obj.status === 'on-track' ? 'info' : 'warning'
                          }>
                            {obj.status || 'pending'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                            <div
                              className={cn(
                                "h-full rounded-full transition-all",
                                obj.status === 'completed' ? 'bg-success' :
                                  obj.status === 'at-risk' ? 'bg-destructive' : 'bg-primary'
                              )}
                              style={{ width: `${obj.progress || 0}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{obj.progress || 0}%</span>
                        </div>
                      </div>
                    ))}
                    {objectives.length === 0 && (
                      <p className="text-sm text-muted-foreground italic">No objectives defined.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="constraints" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-info" />
                      Assumptions
                    </CardTitle>
                    <CardDescription>Conditions assumed to be true</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {assumptions.map((assumption, i) => (
                        <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-info/10 border border-info/20">
                          <span className="text-info font-medium">A{i + 1}.</span>
                          <span className="text-sm">{assumption}</span>
                        </div>
                      ))}
                      {assumptions.length === 0 && (
                        <p className="text-sm text-muted-foreground italic">No assumptions defined.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-warning" />
                      Constraints
                    </CardTitle>
                    <CardDescription>Limitations and boundaries</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {constraints.map((constraint, i) => (
                        <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
                          <span className="text-warning font-medium">C{i + 1}.</span>
                          <span className="text-sm">{constraint}</span>
                        </div>
                      ))}
                      {constraints.length === 0 && (
                        <p className="text-sm text-muted-foreground italic">No constraints defined.</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="approvals" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Approval Authorities
                  </CardTitle>
                  <CardDescription>Key stakeholders and their decision authority</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {approvalAuthorities.map((auth, i) => (
                      <div key={i} className="flex items-center justify-between p-4 rounded-lg border bg-muted/20">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {auth.name.split(' ').map((n: string) => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{auth.name}</p>
                            <p className="text-sm text-muted-foreground">{auth.role}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-muted-foreground">{auth.authority}</span>
                          {auth.approved ? (
                            <Badge variant="success" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Approved
                            </Badge>
                          ) : (
                            <Badge variant="warning">Pending</Badge>
                          )}
                        </div>
                      </div>
                    ))}
                    {approvalAuthorities.length === 0 && (
                      <p className="text-sm text-muted-foreground italic">No approval authorities defined.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="milestones" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Key Milestones
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
                    <div className="space-y-4">
                      {milestones.map((milestone, i) => (
                        <div key={i} className="relative flex items-center gap-4 pl-10">
                          <div className={cn(
                            "absolute left-2.5 h-4 w-4 rounded-full border-2",
                            milestone.status === 'completed' ? 'bg-success border-success' :
                              milestone.status === 'in-progress' ? 'bg-primary border-primary animate-pulse' :
                                'bg-muted border-border'
                          )} />
                          <div className="flex-1 p-3 rounded-lg border bg-muted/20">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{milestone.name}</span>
                              <Badge variant={
                                milestone.status === 'completed' ? 'success' :
                                  milestone.status === 'in-progress' ? 'info' : 'secondary'
                              }>
                                {milestone.status || 'upcoming'}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              {new Date(milestone.date).toLocaleDateString('en-US', {
                                year: 'numeric', month: 'long', day: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                      ))}
                      {milestones.length === 0 && (
                        <p className="text-sm text-muted-foreground italic">No milestones defined.</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
