import React, { useState } from 'react';
import { Database } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DatabaseMigrationPanel } from '@/components/admin/DatabaseMigrationPanel';

export default function PlatformAdminView() {
    const [activeTab, setActiveTab] = useState('database');

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b bg-card">
                <div>
                    <h1 className="text-2xl font-bold">Platform Administration</h1>
                    <p className="text-muted-foreground text-sm mt-1">
                        Manage platform-wide database and system configuration
                    </p>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="mb-6">
                        <TabsTrigger value="database" className="gap-2">
                            <Database className="h-4 w-4" />
                            Database
                        </TabsTrigger>
                    </TabsList>

                    {/* Database Tab */}
                    <TabsContent value="database" className="space-y-4">
                        <DatabaseMigrationPanel />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
