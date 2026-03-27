import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, CheckCircle2, ArrowUpCircle } from 'lucide-react';
import EscalationLog from './governance/EscalationLog';

// Self-contained views — use React.lazy to ensure consistent lazy-loading pattern
const DecisionsViewContent = React.lazy(() => import('./DecisionsView'));
const ActionsViewContent = React.lazy(() => import('./ActionsView'));

export default function GovernanceView() {
  const [activeTab, setActiveTab] = useState('decisions');

  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <div className="border-b bg-background px-4 pt-3">
          <TabsList className="h-10 bg-transparent p-0 gap-1">
            <TabsTrigger
              value="decisions"
              className="h-9 px-4 text-sm data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none"
            >
              <Target className="h-4 w-4 mr-1.5" />
              Decisions
            </TabsTrigger>
            <TabsTrigger
              value="actions"
              className="h-9 px-4 text-sm data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none"
            >
              <CheckCircle2 className="h-4 w-4 mr-1.5" />
              Actions
            </TabsTrigger>
            <TabsTrigger
              value="escalations"
              className="h-9 px-4 text-sm data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none"
            >
              <ArrowUpCircle className="h-4 w-4 mr-1.5" />
              Escalations
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="decisions" className="flex-1 m-0 overflow-hidden">
          <React.Suspense fallback={null}>
            <DecisionsViewContent />
          </React.Suspense>
        </TabsContent>

        <TabsContent value="actions" className="flex-1 m-0 overflow-hidden">
          <React.Suspense fallback={null}>
            <ActionsViewContent />
          </React.Suspense>
        </TabsContent>

        <TabsContent value="escalations" className="flex-1 m-0 overflow-auto">
          <EscalationLog />
        </TabsContent>
      </Tabs>
    </div>
  );
}
