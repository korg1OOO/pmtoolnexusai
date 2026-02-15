import React from 'react';
import { useProjectContext } from '@/contexts/ProjectContext';
import { CollaborationSpaces } from '@/components/program/CollaborationSpaces';

export default function CollaborationSpacesView() {
    const { settings } = useProjectContext();

    if (!settings?.id) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <p className="text-muted-foreground">
                        No program selected. Please select a program to view collaboration spaces.
                    </p>
                </div>
            </div>
        );
    }

    return <CollaborationSpaces programId={settings.id} />;
}
