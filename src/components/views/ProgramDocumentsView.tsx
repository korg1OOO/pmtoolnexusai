import React from 'react';
import { useProjectContext } from '@/contexts/ProjectContext';
import { ProgramDocumentLibrary } from '@/components/program/ProgramDocumentLibrary';

export default function ProgramDocumentsView() {
    const { settings } = useProjectContext();

    if (!settings?.id) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <p className="text-muted-foreground">
                        No program selected. Please select a program to view documents.
                    </p>
                </div>
            </div>
        );
    }

    return <ProgramDocumentLibrary programId={settings.id} />;
}
