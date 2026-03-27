import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, AlertCircle, BookOpen, Link2 } from 'lucide-react';
import AssumptionsRegister from './raid/AssumptionsRegister';
import DependenciesRegister from './raid/DependenciesRegister';

// These views are self-contained (get projectId from useProjectContext internally).
// We use React.lazy-compatible dynamic imports to avoid the circular void return type issue.
const RisksViewContent = React.lazy(() => import('./RisksView'));
const IssuesViewContent = React.lazy(() => import('./IssuesRegisterView'));

export default function RAIDView() {
  const [activeTab, setActiveTab] = useState('risks');

  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <div className="border-b bg-background px-4 pt-3">
          <TabsList className="h-10 bg-transparent p-0 gap-1">
            <TabsTrigger
              value="risks"
              className="h-9 px-4 text-sm data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none"
            >
              <AlertTriangle className="h-4 w-4 mr-1.5" />
              Risks
            </TabsTrigger>
            <TabsTrigger
              value="issues"
              className="h-9 px-4 text-sm data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none"
            >
              <AlertCircle className="h-4 w-4 mr-1.5" />
              Issues
            </TabsTrigger>
            <TabsTrigger
              value="assumptions"
              className="h-9 px-4 text-sm data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none"
            >
              <BookOpen className="h-4 w-4 mr-1.5" />
              Assumptions
            </TabsTrigger>
            <TabsTrigger
              value="dependencies"
              className="h-9 px-4 text-sm data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none"
            >
              <Link2 className="h-4 w-4 mr-1.5" />
              Dependencies
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="risks" className="flex-1 m-0 overflow-hidden">
          <React.Suspense fallback={null}>
            <RisksViewContent />
          </React.Suspense>
        </TabsContent>

        <TabsContent value="issues" className="flex-1 m-0 overflow-hidden">
          <React.Suspense fallback={null}>
            <IssuesViewContent />
          </React.Suspense>
        </TabsContent>

        <TabsContent value="assumptions" className="flex-1 m-0 overflow-auto">
          <AssumptionsRegister />
        </TabsContent>

        <TabsContent value="dependencies" className="flex-1 m-0 overflow-auto">
          <DependenciesRegister />
        </TabsContent>
      </Tabs>
    </div>
  );
}
