import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  FileStack,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  Calendar,
  Building2,
  User,
  Tag,
  Eye,
  Shield,
  Rocket,
  AlertTriangle,
  Clock,
  Target,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { TemplateGallery } from '@/components/project-creation/TemplateGallery';
import { MethodologySelector } from '@/components/project-creation/MethodologySelector';
import { TemplatePreview } from '@/components/project-creation/TemplatePreview';
import { templateCategories, methodologyOptions } from '@/data/templateData';
import type { Methodology, GovernanceLevel, ProjectCreationData } from '@/types/templates';
import { useTemplates, useCreateProjectFromTemplate, type ProjectTemplate } from '@/hooks/useTemplates';

type CreationPath = 'template' | 'custom' | null;
type Step = 'path' | 'template-select' | 'methodology' | 'details' | 'team' | 'review';

const governanceLevels = [
  { id: 'light', name: 'Light', description: 'Minimal gates, rapid iteration', icon: Rocket },
  { id: 'standard', name: 'Standard', description: 'Balanced governance and flexibility', icon: Target },
  { id: 'enterprise', name: 'Enterprise', description: 'Full governance, formal approvals', icon: Shield },
];

const visibilityOptions = [
  { id: 'private', name: 'Private', description: 'Only project team members' },
  { id: 'organization', name: 'Organization', description: 'All organization members' },
  { id: 'cross-org', name: 'Cross-Organization', description: 'Multiple organizations' },
];

const priorityOptions = [
  { id: 'low', name: 'Low', color: 'text-muted-foreground' },
  { id: 'medium', name: 'Medium', color: 'text-warning' },
  { id: 'high', name: 'High', color: 'text-orange-500' },
  { id: 'critical', name: 'Critical', color: 'text-destructive' },
];

export default function ProjectCreationView() {
  const navigate = useNavigate();
  const { data: templates, isLoading: isLoadingTemplates } = useTemplates();
  const createProjectMutation = useCreateProjectFromTemplate();

  const [creationPath, setCreationPath] = useState<CreationPath>(null);
  const [currentStep, setCurrentStep] = useState<Step>('path');
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);

  const [formData, setFormData] = useState<Partial<ProjectCreationData>>({
    name: '',
    description: '',
    code: '',
    organizationId: 'org-001',
    portfolioId: '',
    owner: '',
    sponsor: '',
    startDate: new Date().toISOString().split('T')[0],
    targetEndDate: '',
    priority: 'medium',
    visibility: 'organization',
    tags: [],
    methodology: 'hybrid',
    governanceLevel: 'standard',
    enabledPhases: [],
    teamMembers: [],
  });

  const [tagInput, setTagInput] = useState('');

  const steps: Step[] = creationPath === 'template'
    ? ['path', 'template-select', 'details', 'team', 'review']
    : ['path', 'methodology', 'details', 'team', 'review'];

  const stepLabels: Record<Step, string> = {
    'path': 'Choose Path',
    'template-select': 'Select Template',
    'methodology': 'Methodology',
    'details': 'Project Details',
    'team': 'Team & Governance',
    'review': 'Review & Create',
  };

  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex) / (steps.length - 1)) * 100;

  const handleNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex]);
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    }
  };

  const handlePathSelect = (path: CreationPath) => {
    setCreationPath(path);
    if (path === 'template') {
      setCurrentStep('template-select');
    } else {
      setCurrentStep('methodology');
    }
  };

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template);
    setFormData((prev) => ({
      ...prev,
      methodology: template.methodology as Methodology,
      templateId: template.id,
      name: '',
      enabledPhases: (template.phases || []).map((p: any) => p.id),
    }));
  };

  const handleMethodologySelect = (methodology: Methodology) => {
    setFormData((prev) => ({ ...prev, methodology }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: (prev.tags || []).filter((t) => t !== tag),
    }));
  };

  const handleCreateProject = async () => {
    try {
      if (creationPath === 'template' && selectedTemplate) {
        // Use RPC for template-based creation
        const data = await createProjectMutation.mutateAsync({
          templateId: selectedTemplate.id,
          name: formData.name || 'New Project',
          description: formData.description || '',
          ownerId: formData.owner || '', // Should ideally get current user ID
          organizationId: formData.organizationId,
          startDate: new Date(formData.startDate || Date.now()),
        });

        toast.success('Project Created Successfully!', {
          description: `${data.name} has been created from template.`,
        });

        if (data) {
          localStorage.setItem('projectoye_selected_project', data.id);
          navigate('/');
        }

      } else {
        // Existing logic for custom project (or fallback)
        const { data, error } = await supabase.from('projects').insert({
          name: formData.name,
          code: formData.code,
          description: formData.description,
          methodology: formData.methodology || 'hybrid',
          status: 'planning', // Default to planning
          start_date: formData.startDate,
          end_date: formData.targetEndDate || null,
          owner_id: formData.owner || null, // Ensure owner is handled if exists in formData
        }).select().single();

        if (error) throw error;

        toast.success('Project Created Successfully!', {
          description: `${formData.name} has been created.`,
        });

        if (data) {
          localStorage.setItem('projectoye_selected_project', data.id);
          navigate('/');
        }
      }
    } catch (error: any) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project', {
        description: error.message || 'Please try again',
      });
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'path':
        return creationPath !== null;
      case 'template-select':
        return selectedTemplate !== null;
      case 'methodology':
        return formData.methodology !== undefined;
      case 'details':
        return formData.name && formData.code && formData.startDate;
      case 'team':
        return formData.owner && formData.governanceLevel;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const renderPathSelection = () => (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Create New Project</h1>
        <p className="text-muted-foreground">
          Choose how you want to start your project
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card
            className={`cursor-pointer transition-all h-full ${creationPath === 'template'
              ? 'ring-2 ring-primary border-primary'
              : 'hover:border-primary/50'
              }`}
            onClick={() => setCreationPath('template')}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <FileStack className="h-8 w-8 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">Create from Template</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Start with a pre-built template optimized for your project type.
                    Includes phases, milestones, tasks, and best practices.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">15 Templates</Badge>
                    <Badge variant="secondary">AI-Optimized</Badge>
                    <Badge variant="secondary">Industry Best Practices</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Card
            className={`cursor-pointer transition-all h-full ${creationPath === 'custom'
              ? 'ring-2 ring-primary border-primary'
              : 'hover:border-primary/50'
              }`}
            onClick={() => setCreationPath('custom')}
          >
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-secondary">
                  <Plus className="h-8 w-8 text-secondary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2">Create Custom Project</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Build your project from scratch with full control over
                    methodology, phases, and configuration.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">Full Control</Badge>
                    <Badge variant="secondary">Any Methodology</Badge>
                    <Badge variant="secondary">Custom Phases</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {creationPath && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center mt-8"
        >
          <Button onClick={() => handlePathSelect(creationPath)} size="lg">
            Continue with {creationPath === 'template' ? 'Template' : 'Custom Project'}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>
      )}
    </div>
  );

  const renderTemplateSelection = () => (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Select a Template</h2>
        <p className="text-muted-foreground">
          Choose a template that matches your project type. You can customize it in the next steps.
        </p>
      </div>

      <TemplateGallery
        templates={(templates || []) as any}
        selectedTemplate={selectedTemplate as any}
        onSelect={handleTemplateSelect}
        onPreview={(template: any) => {
          setSelectedTemplate(template);
          setShowTemplatePreview(true);
        }}
      />

      {showTemplatePreview && selectedTemplate && (
        <TemplatePreview
          template={selectedTemplate as any}
          open={showTemplatePreview}
          onClose={() => setShowTemplatePreview(false)}
          onSelect={() => {
            setShowTemplatePreview(false);
            handleNext();
          }}
        />
      )}
    </div>
  );

  const renderMethodologySelection = () => (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Select Methodology</h2>
        <p className="text-muted-foreground">
          Choose the project management methodology that best fits your project needs.
        </p>
      </div>

      <MethodologySelector
        selected={formData.methodology || 'hybrid'}
        onSelect={handleMethodologySelect}
      />

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Recommendation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg">
            <Info className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm">
                Based on your project description, we recommend <strong>Hybrid</strong> methodology.
                This combines structured planning with agile delivery, suitable for enterprise projects.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderProjectDetails = () => (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Project Details</h2>
        <p className="text-muted-foreground">
          Enter the core information about your project.
        </p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="name">Project Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Enter project name"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="code">Project Code *</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
              placeholder="e.g., PRJ-2024"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="portfolio">Portfolio</Label>
            <Select
              value={formData.portfolioId}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, portfolioId: value }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select portfolio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="port-001">Digital Transformation</SelectItem>
                <SelectItem value="port-002">Customer Experience</SelectItem>
                <SelectItem value="port-003">Infrastructure</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Describe the project objectives and scope"
            className="mt-1 min-h-[100px]"
          />
        </div>

        <Separator />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="startDate">Start Date *</Label>
            <div className="relative mt-1">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                className="pl-9"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="targetEndDate">Target End Date</Label>
            <div className="relative mt-1">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="targetEndDate"
                type="date"
                value={formData.targetEndDate}
                onChange={(e) => setFormData((prev) => ({ ...prev, targetEndDate: e.target.value }))}
                className="pl-9"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Priority</Label>
            <Select
              value={formData.priority}
              onValueChange={(value: any) => setFormData((prev) => ({ ...prev, priority: value }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {priorityOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    <span className={option.color}>{option.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Visibility</Label>
            <Select
              value={formData.visibility}
              onValueChange={(value: any) => setFormData((prev) => ({ ...prev, visibility: value }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {visibilityOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    <div>
                      <div>{option.name}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label>Tags</Label>
          <div className="flex gap-2 mt-1">
            <Input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="Add a tag"
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
            />
            <Button type="button" variant="secondary" onClick={handleAddTag}>
              <Tag className="h-4 w-4" />
            </Button>
          </div>
          {formData.tags && formData.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {formData.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => handleRemoveTag(tag)}
                >
                  {tag} ×
                </Badge>
              ))}
            </div>
          )}
        </div>

        {selectedTemplate && (
          <>
            <Separator />
            <div>
              <Label className="mb-3 block">Template Phases</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Select which phases to include from the template.
              </p>
              <div className="space-y-2">
                {selectedTemplate.phases.map((phase) => (
                  <div key={phase.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={phase.id}
                      checked={formData.enabledPhases?.includes(phase.id)}
                      onCheckedChange={(checked) => {
                        setFormData((prev) => ({
                          ...prev,
                          enabledPhases: checked
                            ? [...(prev.enabledPhases || []), phase.id]
                            : (prev.enabledPhases || []).filter((id) => id !== phase.id),
                        }));
                      }}
                    />
                    <Label htmlFor={phase.id} className="cursor-pointer">
                      {phase.name}
                      <span className="text-muted-foreground text-xs ml-2">
                        ({phase.durationDays} days)
                      </span>
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderTeamAndGovernance = () => (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Team & Governance</h2>
        <p className="text-muted-foreground">
          Set up project ownership and governance level.
        </p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="owner">Project Owner *</Label>
            <div className="relative mt-1">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="owner"
                value={formData.owner}
                onChange={(e) => setFormData((prev) => ({ ...prev, owner: e.target.value }))}
                placeholder="Select project owner"
                className="pl-9"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="sponsor">Executive Sponsor</Label>
            <div className="relative mt-1">
              <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="sponsor"
                value={formData.sponsor}
                onChange={(e) => setFormData((prev) => ({ ...prev, sponsor: e.target.value }))}
                placeholder="Select sponsor"
                className="pl-9"
              />
            </div>
          </div>
        </div>

        <Separator />

        <div>
          <Label className="mb-3 block">Governance Level *</Label>
          <RadioGroup
            value={formData.governanceLevel}
            onValueChange={(value: GovernanceLevel) =>
              setFormData((prev) => ({ ...prev, governanceLevel: value }))
            }
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            {governanceLevels.map((level) => {
              const Icon = level.icon;
              return (
                <div key={level.id}>
                  <RadioGroupItem
                    value={level.id}
                    id={level.id}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={level.id}
                    className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <Icon className="mb-3 h-6 w-6" />
                    <div className="text-center">
                      <div className="font-semibold">{level.name}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {level.description}
                      </div>
                    </div>
                  </Label>
                </div>
              );
            })}
          </RadioGroup>
        </div>

        {selectedTemplate && selectedTemplate.roles.length > 0 && (
          <>
            <Separator />
            <div>
              <Label className="mb-3 block">Template Roles</Label>
              <p className="text-sm text-muted-foreground mb-3">
                The following roles are defined in the template. You can assign team members later.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {selectedTemplate.roles.map((role) => (
                  <Card key={role.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{role.name}</div>
                        <div className="text-xs text-muted-foreground">{role.description}</div>
                      </div>
                      {role.isRequired && (
                        <Badge variant="outline" className="text-xs">Required</Badge>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          </>
        )}

        {selectedTemplate && selectedTemplate.risks.length > 0 && (
          <>
            <Separator />
            <Card className="border-warning/50 bg-warning/5">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  Known Risks from Template
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  {selectedTemplate.risks.slice(0, 3).map((risk) => (
                    <div key={risk.id} className="flex items-start gap-2 text-sm">
                      <div className={`h-2 w-2 rounded-full mt-1.5 ${risk.impact === 'critical' ? 'bg-destructive' :
                        risk.impact === 'high' ? 'bg-orange-500' :
                          'bg-warning'
                        }`} />
                      <div>
                        <span className="font-medium">{risk.title}</span>
                        <span className="text-muted-foreground"> — {risk.mitigation}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );

  const renderReview = () => (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Review & Create</h2>
        <p className="text-muted-foreground">
          Review your project configuration before creating.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Project Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Name</span>
              <span className="font-medium">{formData.name || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Code</span>
              <span className="font-mono">{formData.code || '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Methodology</span>
              <Badge variant="outline">
                {methodologyOptions.find((m) => m.id === formData.methodology)?.name}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Priority</span>
              <Badge variant={formData.priority === 'critical' ? 'destructive' : 'secondary'}>
                {formData.priority}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Start Date</span>
              <span>{formData.startDate}</span>
            </div>
            {formData.targetEndDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Target End</span>
                <span>{formData.targetEndDate}</span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Team & Governance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Owner</span>
              <span className="font-medium">{formData.owner || '—'}</span>
            </div>
            {formData.sponsor && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sponsor</span>
                <span>{formData.sponsor}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Governance</span>
              <Badge variant="outline">{formData.governanceLevel}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Visibility</span>
              <span className="capitalize">{formData.visibility}</span>
            </div>
          </CardContent>
        </Card>

        {selectedTemplate && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Template: {selectedTemplate.name}</CardTitle>
              <CardDescription>{selectedTemplate.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="p-3 rounded-lg bg-secondary/50">
                  <div className="text-2xl font-bold">{selectedTemplate.phases.length}</div>
                  <div className="text-xs text-muted-foreground">Phases</div>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50">
                  <div className="text-2xl font-bold">
                    {selectedTemplate.phases.reduce((sum, p) => sum + p.milestones.length, 0)}
                  </div>
                  <div className="text-xs text-muted-foreground">Milestones</div>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50">
                  <div className="text-2xl font-bold">{selectedTemplate.roles.length}</div>
                  <div className="text-xs text-muted-foreground">Roles</div>
                </div>
                <div className="p-3 rounded-lg bg-secondary/50">
                  <div className="text-2xl font-bold">{selectedTemplate.risks.length}</div>
                  <div className="text-xs text-muted-foreground">Known Risks</div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-primary/5 rounded-lg">
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>
                    Typical Duration: {selectedTemplate.aiMetadata.typicalDuration.min}–
                    {selectedTemplate.aiMetadata.typicalDuration.max}{' '}
                    {selectedTemplate.aiMetadata.typicalDuration.unit}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {formData.tags && formData.tags.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="mt-6 border-primary/50 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <div className="font-medium">AI Project Setup Ready</div>
              <p className="text-sm text-muted-foreground mt-1">
                After creation, AI will analyze your project and provide:
              </p>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>• Timeline feasibility assessment</li>
                <li>• Risk predictions based on similar projects</li>
                <li>• Resource recommendations</li>
                <li>• Success probability score</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 'path':
        return renderPathSelection();
      case 'template-select':
        return renderTemplateSelection();
      case 'methodology':
        return renderMethodologySelection();
      case 'details':
        return renderProjectDetails();
      case 'team':
        return renderTeamAndGovernance();
      case 'review':
        return renderReview();
      default:
        return null;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Progress Header */}
      {currentStep !== 'path' && (
        <div className="border-b bg-card/50 px-6 py-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {steps.map((step, index) => (
                  <React.Fragment key={step}>
                    <div
                      className={`flex items-center gap-2 ${index <= currentStepIndex ? 'text-foreground' : 'text-muted-foreground'
                        }`}
                    >
                      <div
                        className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium ${index < currentStepIndex
                          ? 'bg-primary text-primary-foreground'
                          : index === currentStepIndex
                            ? 'bg-primary/20 text-primary border border-primary'
                            : 'bg-muted'
                          }`}
                      >
                        {index < currentStepIndex ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <span className="text-sm hidden md:inline">{stepLabels[step]}</span>
                    </div>
                    {index < steps.length - 1 && (
                      <div className="h-px w-8 bg-border" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
            <Progress value={progress} className="h-1" />
          </div>
        </div>
      )}

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </ScrollArea>

      {/* Footer Navigation */}
      {currentStep !== 'path' && (
        <div className="border-t bg-card/50 px-6 py-4">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <Button variant="ghost" onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            {currentStep === 'review' ? (
              <Button onClick={handleCreateProject} disabled={!canProceed()}>
                <Sparkles className="mr-2 h-4 w-4" />
                Create Project
              </Button>
            ) : (
              <Button onClick={handleNext} disabled={!canProceed()}>
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
