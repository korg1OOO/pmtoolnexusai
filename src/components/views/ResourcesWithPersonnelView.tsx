import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Shield } from 'lucide-react';
import KeyPersonnelTab from './resources/KeyPersonnelTab';

// ResourcesView is self-contained — use React.lazy to avoid type issues
const ResourcesContent = React.lazy(() => import('./ResourcesView'));

export default function ResourcesWithPersonnelView() {
  const [activeTab, setActiveTab] = useState('resources');

  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <div className="border-b bg-background px-4 pt-3">
          <TabsList className="h-10 bg-transparent p-0 gap-1">
            <TabsTrigger
              value="resources"
              className="h-9 px-4 text-sm data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none"
            >
              <Users className="h-4 w-4 mr-1.5" />
              Resources
            </TabsTrigger>
            <TabsTrigger
              value="key-personnel"
              className="h-9 px-4 text-sm data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none"
            >
              <Shield className="h-4 w-4 mr-1.5" />
              Key Personnel
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="resources" className="flex-1 m-0 overflow-hidden">
          <React.Suspense fallback={null}>
            <ResourcesContent />
          </React.Suspense>
        </TabsContent>

        <TabsContent value="key-personnel" className="flex-1 m-0 overflow-auto">
          <KeyPersonnelTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
