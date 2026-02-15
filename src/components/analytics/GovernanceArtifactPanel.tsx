/**
 * Governance Artifact Panel
 * Displays related governance documents, audit logs, and compliance artifacts
 */

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Shield, AlertTriangle, CheckCircle, ExternalLink, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export interface GovernanceArtifact {
    id: string;
    type: 'audit_log' | 'policy' | 'approval' | 'risk_assessment' | 'compliance';
    title: string;
    relatedEntity: string;
    relatedEntityType: 'project' | 'portfolio' | 'program' | 'workspace';
    lastUpdated: string;
    url?: string;
    status?: 'active' | 'pending' | 'archived';
}

interface GovernanceArtifactPanelProps {
    entityId: string;
    entityType: 'project' | 'portfolio' | 'program' | 'workspace';
}

const ARTIFACT_ICONS = {
    audit_log: Clock,
    policy: Shield,
    approval: CheckCircle,
    risk_assessment: AlertTriangle,
    compliance: FileText,
};

const ARTIFACT_COLORS = {
    audit_log: 'bg-blue-100 text-blue-700',
    policy: 'bg-purple-100 text-purple-700',
    approval: 'bg-green-100 text-green-700',
    risk_assessment: 'bg-orange-100 text-orange-700',
    compliance: 'bg-indigo-100 text-indigo-700',
};

export function GovernanceArtifactPanel({ entityId, entityType }: GovernanceArtifactPanelProps) {
    const { data: artifacts = [], isLoading } = useQuery({
        queryKey: ['governance-artifacts', entityId, entityType],
        queryFn: async (): Promise<GovernanceArtifact[]> => {
            // Fetch audit logs
            const { data: auditLogs } = await (supabase as any)
                .from('audit_logs')
                .select('*')
                .eq('entity_id', entityId)
                .eq('entity_type', entityType)
                .order('created_at', { ascending: false })
                .limit(5);

            // Fetch risk assessments
            const { data: risks } = await (supabase as any)
                .from('risks')
                .select('*')
                .eq(`${entityType}_id`, entityId)
                .order('created_at', { ascending: false })
                .limit(3);

            const artifacts: GovernanceArtifact[] = [];

            // Add audit logs
            (auditLogs || []).forEach((log: any) => {
                artifacts.push({
                    id: log.id,
                    type: 'audit_log',
                    title: `${log.action} - ${log.entity_type}`,
                    relatedEntity: entityId,
                    relatedEntityType: entityType,
                    lastUpdated: log.created_at,
                    status: 'active',
                });
            });

            // Add risk assessments
            (risks || []).forEach((risk: any) => {
                artifacts.push({
                    id: risk.id,
                    type: 'risk_assessment',
                    title: risk.title || risk.description?.substring(0, 50),
                    relatedEntity: entityId,
                    relatedEntityType: entityType,
                    lastUpdated: risk.created_at,
                    status: risk.status === 'open' ? 'active' : 'archived',
                });
            });

            return artifacts;
        },
        enabled: !!entityId,
    });

    const groupedArtifacts = artifacts.reduce((acc, artifact) => {
        if (!acc[artifact.type]) {
            acc[artifact.type] = [];
        }
        acc[artifact.type].push(artifact);
        return acc;
    }, {} as Record<string, GovernanceArtifact[]>);

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Governance Artifacts</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Loading...</p>
                </CardContent>
            </Card>
        );
    }

    if (artifacts.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Governance Artifacts</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">No governance artifacts found</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg">Governance Artifacts</CardTitle>
                <p className="text-sm text-muted-foreground">Related compliance and audit documents</p>
            </CardHeader>
            <CardContent className="space-y-4">
                {Object.entries(groupedArtifacts).map(([type, items]) => {
                    const Icon = ARTIFACT_ICONS[type as keyof typeof ARTIFACT_ICONS];
                    const colorClass = ARTIFACT_COLORS[type as keyof typeof ARTIFACT_COLORS];

                    return (
                        <div key={type} className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4 text-muted-foreground" />
                                <h3 className="text-sm font-semibold capitalize">
                                    {type.replace('_', ' ')} ({items.length})
                                </h3>
                            </div>
                            <div className="space-y-2 pl-6">
                                {items.map((artifact) => (
                                    <div
                                        key={artifact.id}
                                        className="flex items-start justify-between gap-2 p-2 rounded-lg border hover:bg-accent transition-colors cursor-pointer"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{artifact.title}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {new Date(artifact.lastUpdated).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {artifact.status && (
                                                <Badge variant="outline" className={`text-xs ${colorClass}`}>
                                                    {artifact.status}
                                                </Badge>
                                            )}
                                            {artifact.url && (
                                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                                    <ExternalLink className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </CardContent>
        </Card>
    );
}
