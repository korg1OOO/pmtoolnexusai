/**
 * Email Campaign Detail View
 * View and manage individual email campaign
 */

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Send,
    Pause,
    Eye,
    Users,
    Mail,
    TrendingUp
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    useEmailCampaign,
    useCancelCampaign
} from '@/hooks/useEmailAutomation';
import { format } from 'date-fns';

export function EmailCampaignDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { data: campaign } = useEmailCampaign(id || '');
    const cancelCampaign = useCancelCampaign();

    if (!campaign) {
        return (
            <div className="p-6">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/admin/email')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <p>Loading campaign...</p>
                </div>
            </div>
        );
    }

    const handleCancel = async () => {
        if (confirm('Are you sure you want to cancel this campaign?')) {
            await cancelCampaign.mutateAsync(campaign.id);
            navigate('/admin/email');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft': return 'bg-gray-600';
            case 'scheduled': return 'bg-blue-600';
            case 'sending': return 'bg-yellow-600';
            case 'sent': return 'bg-green-600';
            case 'cancelled': return 'bg-red-600';
            default: return 'bg-gray-600';
        }
    };

    const openRate = campaign.sent_count > 0
        ? ((campaign.open_count / campaign.sent_count) * 100).toFixed(1)
        : '0.0';
    const clickRate = campaign.open_count > 0
        ? ((campaign.click_count / campaign.open_count) * 100).toFixed(1)
        : '0.0';

    return (
        <div className="p-6 space-y-6 max-w-6xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/admin/email')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">{campaign.name}</h1>
                        <p className="text-muted-foreground">{campaign.subject}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Badge className={getStatusColor(campaign.status)}>
                        {campaign.status}
                    </Badge>
                    {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
                        <Button variant="destructive" onClick={handleCancel}>
                            <Pause className="mr-2 h-4 w-4" />
                            Cancel Campaign
                        </Button>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Sent</CardTitle>
                        <Send className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{campaign.sent_count.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Total recipients</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Opens</CardTitle>
                        <Eye className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{campaign.open_count.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">{openRate}% open rate</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Clicks</CardTitle>
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{campaign.click_count.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">{clickRate}% click rate</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium">Status</CardTitle>
                        <Mail className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold capitalize">{campaign.status}</div>
                        <p className="text-xs text-muted-foreground">
                            {campaign.sent_at
                                ? `Sent ${format(new Date(campaign.sent_at), 'MMM d')}`
                                : campaign.scheduled_at
                                    ? `Scheduled for ${format(new Date(campaign.scheduled_at), 'MMM d')}`
                                    : 'Not scheduled'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Campaign Details */}
            <Card>
                <CardHeader>
                    <CardTitle>Campaign Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <Label className="text-sm text-muted-foreground">Template</Label>
                            <p className="font-medium">{campaign.template_name || 'Custom content'}</p>
                        </div>

                        <div>
                            <Label className="text-sm text-muted-foreground">Created By</Label>
                            <p className="font-medium">{campaign.created_by_email || 'Unknown'}</p>
                        </div>

                        <div>
                            <Label className="text-sm text-muted-foreground">Created At</Label>
                            <p className="font-medium">
                                {format(new Date(campaign.created_at), 'MMM d, yyyy h:mm a')}
                            </p>
                        </div>

                        {campaign.scheduled_at && (
                            <div>
                                <Label className="text-sm text-muted-foreground">Scheduled For</Label>
                                <p className="font-medium">
                                    {format(new Date(campaign.scheduled_at), 'MMM d, yyyy h:mm a')}
                                </p>
                            </div>
                        )}

                        {campaign.sent_at && (
                            <div>
                                <Label className="text-sm text-muted-foreground">Sent At</Label>
                                <p className="font-medium">
                                    {format(new Date(campaign.sent_at), 'MMM d, yyyy h:mm a')}
                                </p>
                            </div>
                        )}

                        {campaign.target_audience && (
                            <div className="col-span-2">
                                <Label className="text-sm text-muted-foreground">Target Audience</Label>
                                <pre className="text-sm bg-muted p-2 rounded mt-1">
                                    {JSON.stringify(campaign.target_audience, null, 2)}
                                </pre>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Performance Timeline (placeholder) */}
            {campaign.status === 'sent' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Performance Timeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">
                            Detailed performance metrics will be displayed here.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

const Label = ({ className, children }: { className?: string; children: React.ReactNode }) => (
    <div className={className}>{children}</div>
);
