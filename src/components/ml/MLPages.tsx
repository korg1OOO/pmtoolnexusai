/**
 * ML Sub-Pages
 * Placeholder pages for ML Dashboard navigation
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Construction } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const MLPlaceholderPage = ({ title, description }: { title: string; description: string }) => {
    const navigate = useNavigate();

    return (
        <div className="p-6">
            <div className="mb-6">
                <Button variant="ghost" onClick={() => navigate('/admin/ml')}>
                    ← Back to ML Dashboard
                </Button>
            </div>
            <Card className="p-8 text-center">
                <Construction className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h1 className="text-2xl font-bold mb-2">{title}</h1>
                <p className="text-muted-foreground">{description}</p>
                <p className="text-sm text-muted-foreground mt-2">This page is under construction</p>
            </Card>
        </div>
    );
};

export const MLModelsPage = () => (
    <MLPlaceholderPage
        title="ML Models"
        description="View and manage all machine learning models"
    />
);

export const MLAlertsPage = () => (
    <MLPlaceholderPage
        title="ML Alerts"
        description="Monitor and acknowledge ML model alerts"
    />
);

export const MLPredictionsPage = () => (
    <MLPlaceholderPage
        title="Predictions"
        description="View prediction history and analytics"
    />
);

export const MLRetrainingPage = () => (
    <MLPlaceholderPage
        title="Retraining Jobs"
        description="Manage model retraining jobs and schedules"
    />
);

export const MLAccuracyPage = () => (
    <MLPlaceholderPage
        title="Accuracy Tracking"
        description="Monitor model accuracy and performance metrics"
    />
);

export const MLTrainingDataPage = () => (
    <MLPlaceholderPage
        title="Training Data"
        description="Manage training datasets and data quality"
    />
);
