/**
 * Email Campaign Builder
 * Multi-step wizard for creating email campaigns
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    ArrowRight,
    Check,
    Send,
    Users,
    FileText,
    Settings
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    useEmailTemplates,
    useCreateEmailCampaign,
    useScheduleCampaign
} from '@/hooks/useEmailAutomation';
import { format } from 'date-fns';

type WizardStep = 'details' | 'template' | 'audience' | 'schedule' | 'review';

export function EmailCampaignBuilder() {
    const navigate = useNavigate();
    const { data: templates = [] } = useEmailTemplates();
    const createCampaign = useCreateEmailCampaign();
    const scheduleCampaign = useScheduleCampaign();

    const [currentStep, setCurrentStep] = useState<WizardStep>('details');
    const [campaignData, setCampaignData] = useState({
        name: '',
        subject: '',
        templateId: '',
        targetTiers: [] as string[],
        targetCreatedAfter: '',
        scheduleType: 'immediate' as 'immediate' | 'scheduled',
        scheduledAt: ''
    });

    const steps: { id: WizardStep; label: string; icon: any }[] = [
        { id: 'details', label: 'Details', icon: FileText },
        { id: 'template', label: 'Template', icon: Settings },
        { id: 'audience', label: 'Audience', icon: Users },
        { id: 'schedule', label: 'Schedule', icon: Send },
        { id: 'review', label: 'Review', icon: Check }
    ];

    const currentStepIndex = steps.findIndex(s => s.id === currentStep);

    const handleNext = () => {
        const nextIndex = currentStepIndex + 1;
        if (nextIndex < steps.length) {
            setCurrentStep(steps[nextIndex].id);
        }
    };

    const handleBack = () => {
        const prevIndex = currentStepIndex - 1;
        if (prevIndex >= 0) {
            setCurrentStep(steps[prevIndex].id);
        }
    };

    const handleCreate = async () => {
        const campaign = await createCampaign.mutateAsync({
            name: campaignData.name,
            subject: campaignData.subject,
            template_id: campaignData.templateId || undefined,
            target_audience: {
                tiers: campaignData.targetTiers,
                created_after: campaignData.targetCreatedAfter || undefined
            }
        });

        if (campaignData.scheduleType === 'scheduled' && campaignData.scheduledAt) {
            await scheduleCampaign.mutateAsync({
                id: campaign.id,
                scheduledAt: campaignData.scheduledAt
            });
        }

        navigate('/admin/email');
    };

    const canProceed = () => {
        switch (currentStep) {
            case 'details':
                return campaignData.name && campaignData.subject;
            case 'template':
                return true; // Template is optional
            case 'audience':
                return true; // Audience targeting is optional
            case 'schedule':
                return campaignData.scheduleType === 'immediate' ||
                    (campaignData.scheduleType === 'scheduled' && campaignData.scheduledAt);
            case 'review':
                return true;
            default:
                return false;
        }
    };

    const selectedTemplate = templates.find(t => t.id === campaignData.templateId);

    return (
        <div className="p-6 space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/admin/email')}>
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold">Create Email Campaign</h1>
                    <p className="text-muted-foreground">
                        Follow the wizard to set up your campaign
                    </p>
                </div>
            </div>

            {/* Progress Steps */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        {steps.map((step, index) => {
                            const Icon = step.icon;
                            const isActive = step.id === currentStep;
                            const isCompleted = index < currentStepIndex;

                            return (
                                <React.Fragment key={step.id}>
                                    <div className="flex flex-col items-center gap-2">
                                        <div
                                            className={`w-12 h-12 rounded-full flex items-center justify-center border-2 ${isActive
                                                    ? 'border-primary bg-primary text-primary-foreground'
                                                    : isCompleted
                                                        ? 'border-green-600 bg-green-600 text-white'
                                                        : 'border-muted bg-background'
                                                }`}
                                        >
                                            {isCompleted ? (
                                                <Check className="h-5 w-5" />
                                            ) : (
                                                <Icon className="h-5 w-5" />
                                            )}
                                        </div>
                                        <span
                                            className={`text-sm ${isActive ? 'font-semibold' : 'text-muted-foreground'
                                                }`}
                                        >
                                            {step.label}
                                        </span>
                                    </div>
                                    {index < steps.length - 1 && (
                                        <div className="flex-1 h-0.5 bg-muted mx-4" />
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Step Content */}
            <Card>
                <CardContent className="pt-6">
                    {/* Step 1: Details */}
                    {currentStep === 'details' && (
                        <div className="space-y-4">
                            <div>
                                <Label>Campaign Name</Label>
                                <Input
                                    placeholder="Monthly Newsletter - January 2026"
                                    value={campaignData.name}
                                    onChange={(e) =>
                                        setCampaignData({ ...campaignData, name: e.target.value })
                                    }
                                />
                            </div>

                            <div>
                                <Label>Email Subject</Label>
                                <Input
                                    placeholder="Your Monthly Update 📨"
                                    value={campaignData.subject}
                                    onChange={(e) =>
                                        setCampaignData({ ...campaignData, subject: e.target.value })
                                    }
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 2: Template */}
                    {currentStep === 'template' && (
                        <div className="space-y-4">
                            <div>
                                <Label>Email Template (Optional)</Label>
                                <Select
                                    value={campaignData.templateId}
                                    onValueChange={(val) =>
                                        setCampaignData({ ...campaignData, templateId: val })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a template or create custom content" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value=" ">No template (custom content)</SelectItem>
                                        {templates.map((template) => (
                                            <SelectItem key={template.id} value={template.id}>
                                                {template.name} ({template.template_type})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {selectedTemplate && (
                                <div className="border rounded-lg p-4 bg-muted/20">
                                    <h4 className="font-semibold mb-2">Preview</h4>
                                    <div className="text-sm mb-1">
                                        <strong>Subject:</strong> {selectedTemplate.subject}
                                    </div>
                                    <div className="text-sm mb-2">
                                        <strong>Type:</strong> {selectedTemplate.template_type}
                                    </div>
                                    {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
                                        <div className="text-sm">
                                            <strong>Variables:</strong>{' '}
                                            {selectedTemplate.variables.map((v) => `{{${v}}}`).join(', ')}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Audience */}
                    {currentStep === 'audience' && (
                        <div className="space-y-4">
                            <div>
                                <Label>Target User Tiers</Label>
                                <div className="space-y-2 mt-2">
                                    {['free', 'pro', 'enterprise'].map((tier) => (
                                        <div key={tier} className="flex items-center gap-2">
                                            <Checkbox
                                                checked={campaignData.targetTiers.includes(tier)}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        setCampaignData({
                                                            ...campaignData,
                                                            targetTiers: [...campaignData.targetTiers, tier]
                                                        });
                                                    } else {
                                                        setCampaignData({
                                                            ...campaignData,
                                                            targetTiers: campaignData.targetTiers.filter(
                                                                (t) => t !== tier
                                                            )
                                                        });
                                                    }
                                                }}
                                            />
                                            <Label className="capitalize">{tier}</Label>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">
                                    Leave all unchecked to target all users
                                </p>
                            </div>

                            <div>
                                <Label>Users Created After (Optional)</Label>
                                <Input
                                    type="date"
                                    value={campaignData.targetCreatedAfter}
                                    onChange={(e) =>
                                        setCampaignData({
                                            ...campaignData,
                                            targetCreatedAfter: e.target.value
                                        })
                                    }
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 4: Schedule */}
                    {currentStep === 'schedule' && (
                        <div className="space-y-4">
                            <div>
                                <Label>Send Schedule</Label>
                                <Select
                                    value={campaignData.scheduleType}
                                    onValueChange={(val: 'immediate' | 'scheduled') =>
                                        setCampaignData({ ...campaignData, scheduleType: val })
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="immediate">Send Immediately</SelectItem>
                                        <SelectItem value="scheduled">Schedule for Later</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {campaignData.scheduleType === 'scheduled' && (
                                <div>
                                    <Label>Schedule Date & Time</Label>
                                    <Input
                                        type="datetime-local"
                                        value={campaignData.scheduledAt}
                                        onChange={(e) =>
                                            setCampaignData({
                                                ...campaignData,
                                                scheduledAt: e.target.value
                                            })
                                        }
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 5: Review */}
                    {currentStep === 'review' && (
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg">Campaign Summary</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-muted-foreground">Campaign Name</Label>
                                    <p className="font-medium">{campaignData.name}</p>
                                </div>

                                <div>
                                    <Label className="text-muted-foreground">Subject</Label>
                                    <p className="font-medium">{campaignData.subject}</p>
                                </div>

                                <div>
                                    <Label className="text-muted-foreground">Template</Label>
                                    <p className="font-medium">
                                        {selectedTemplate ? selectedTemplate.name : 'Custom content'}
                                    </p>
                                </div>

                                <div>
                                    <Label className="text-muted-foreground">Target Audience</Label>
                                    <div className="flex gap-1 mt-1">
                                        {campaignData.targetTiers.length > 0 ? (
                                            campaignData.targetTiers.map((tier) => (
                                                <Badge key={tier} variant="outline">
                                                    {tier}
                                                </Badge>
                                            ))
                                        ) : (
                                            <span className="text-sm">All users</span>
                                        )}
                                    </div>
                                </div>

                                <div className="col-span-2">
                                    <Label className="text-muted-foreground">Schedule</Label>
                                    <p className="font-medium">
                                        {campaignData.scheduleType === 'immediate'
                                            ? 'Send immediately'
                                            : `Scheduled for ${campaignData.scheduledAt
                                                ? format(
                                                    new Date(campaignData.scheduledAt),
                                                    'MMM d, yyyy h:mm a'
                                                )
                                                : '-'
                                            }`}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between">
                <Button variant="outline" onClick={handleBack} disabled={currentStepIndex === 0}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Button>

                {currentStepIndex < steps.length - 1 ? (
                    <Button onClick={handleNext} disabled={!canProceed()}>
                        Next
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                ) : (
                    <Button onClick={handleCreate} disabled={!canProceed()}>
                        <Send className="mr-2 h-4 w-4" />
                        Create Campaign
                    </Button>
                )}
            </div>
        </div>
    );
}
