import React from 'react';
import { useProjectContext } from '@/contexts/ProjectContext';
import { KnowledgeBaseBrowser } from '@/components/program/KnowledgeBaseBrowser';

export function KnowledgeBaseView() {
    const { settings } = useProjectContext();

    if (!settings?.id) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <p className="text-muted-foreground">
                        No program selected. Please select a program to view the knowledge base.
                    </p>
                </div>
            </div>
        );
    }

    return <KnowledgeBaseBrowser scope="program" scopeId={settings.id} />;
}
