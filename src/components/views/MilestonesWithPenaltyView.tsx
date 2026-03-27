import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Flag, DollarSign } from 'lucide-react';
import PenaltyTrackerTab from './milestones/PenaltyTrackerTab';

// MilestonesView is self-contained — use React.lazy to avoid type issues
const MilestonesContent = React.lazy(() => import('./MilestonesView'));

export default function MilestonesWithPenaltyView() {
  const [activeTab, setActiveTab] = useState('milestones');

  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <div className="border-b bg-background px-4 pt-3">
          <TabsList className="h-10 bg-transparent p-0 gap-1">
            <TabsTrigger
              value="milestones"
              className="h-9 px-4 text-sm data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none"
            >
              <Flag className="h-4 w-4 mr-1.5" />
              Milestones
            </TabsTrigger>
            <TabsTrigger
              value="penalty"
              className="h-9 px-4 text-sm data-[state=active]:bg-background data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none rounded-none"
            >
              <DollarSign className="h-4 w-4 mr-1.5" />
              Penalty Tracker
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="milestones" className="flex-1 m-0 overflow-hidden">
          <React.Suspense fallback={null}>
            <MilestonesContent />
          </React.Suspense>
        </TabsContent>

        <TabsContent value="penalty" className="flex-1 m-0 overflow-auto">
          <PenaltyTrackerTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
