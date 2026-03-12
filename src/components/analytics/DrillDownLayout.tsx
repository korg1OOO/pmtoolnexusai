/**
 * Drill-Down Layout Component
 * Provides consistent layout for analytics drill-down views with breadcrumbs and navigation
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Home } from 'lucide-react';
import { AnalyticsBreadcrumb, BreadcrumbItem } from './AnalyticsBreadcrumb';

interface DrillDownLayoutProps {
    title: string;
    description?: string;
    breadcrumbs: BreadcrumbItem[];
    onBack?: () => void;
    children: React.ReactNode;
    actions?: React.ReactNode;
    governancePanel?: React.ReactNode;
}

export function DrillDownLayout({
    title,
    description,
    breadcrumbs,
    onBack,
    children,
    actions,
    governancePanel
}: DrillDownLayoutProps) {
    const navigate = useNavigate();

    const handleBack = () => {
        if (onBack) {
            onBack();
        } else {
            navigate(-1);
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Breadcrumb Navigation */}
            <AnalyticsBreadcrumb items={breadcrumbs} />

            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleBack}
                            className="gap-2"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Button>
                        <div className="h-6 w-px bg-border" />
                        <h1 className="text-3xl font-bold">{title}</h1>
                    </div>
                    {description && (
                        <p className="text-muted-foreground ml-24">{description}</p>
                    )}
                </div>
                {actions && <div className="flex gap-2">{actions}</div>}
            </div>

            {/* Main Content Area */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Primary Content */}
                <div className={governancePanel ? 'lg:col-span-2' : 'lg:col-span-3'}>
                    {children}
                </div>

                {/* Governance Panel (if provided) */}
                {governancePanel && (
                    <div className="lg:col-span-1">
                        {governancePanel}
                    </div>
                )}
            </div>
        </div>
    );
}
