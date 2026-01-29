import React, { useState } from 'react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { cn } from '@/lib/utils';
import { BriefingSectionId, BRIEFING_SECTIONS, BriefingSection } from './types';
import { BriefingSectionCard } from './BriefingSectionCard';
import { GripVertical } from 'lucide-react';

interface ResizableBriefingLayoutProps {
  sections: BriefingSectionId[];
  renderContent: (sectionId: BriefingSectionId) => React.ReactNode;
  isGenerating: boolean;
  lastUpdated: Date;
  onRefresh: () => void;
}

export function ResizableBriefingLayout({
  sections,
  renderContent,
  isGenerating,
  lastUpdated,
  onRefresh,
}: ResizableBriefingLayoutProps) {
  const getSectionConfig = (id: BriefingSectionId): BriefingSection | undefined => {
    return BRIEFING_SECTIONS.find(s => s.id === id);
  };

  // Group sections into rows of 2 for resizable layout
  const groupSections = () => {
    const rows: { sections: BriefingSectionId[]; isFullWidth: boolean }[] = [];
    let i = 0;

    while (i < sections.length) {
      const sectionId = sections[i];
      const isFullWidth = sectionId === 'critical-alerts' || sectionId === 'ai-insights';

      if (isFullWidth) {
        rows.push({ sections: [sectionId], isFullWidth: true });
        i++;
      } else {
        // Try to pair with next section if it's not full width
        const nextSection = sections[i + 1];
        const nextIsFullWidth = nextSection === 'critical-alerts' || nextSection === 'ai-insights';

        if (nextSection && !nextIsFullWidth) {
          rows.push({ sections: [sectionId, nextSection], isFullWidth: false });
          i += 2;
        } else {
          rows.push({ sections: [sectionId], isFullWidth: false });
          i++;
        }
      }
    }

    return rows;
  };

  const rows = groupSections();

  const renderSection = (sectionId: BriefingSectionId) => {
    const sectionConfig = getSectionConfig(sectionId);
    if (!sectionConfig) return null;

    return (
      <BriefingSectionCard
        section={sectionConfig}
        loading={isGenerating && sectionConfig.isAIPowered}
        generatedAt={sectionConfig.isAIPowered ? lastUpdated.toISOString() : undefined}
        onRefresh={sectionConfig.isAIPowered ? onRefresh : undefined}
      >
        {renderContent(sectionId)}
      </BriefingSectionCard>
    );
  };

  if (sections.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="h-[350px]">
          {row.isFullWidth || row.sections.length === 1 ? (
            <div className="h-full">
              {renderSection(row.sections[0])}
            </div>
          ) : (
            <ResizablePanelGroup direction="horizontal" className="h-full">
              <ResizablePanel 
                defaultSize={50} 
                minSize={25}
                className="transition-all duration-200"
              >
                <div className="h-full pr-2">
                  {renderSection(row.sections[0])}
                </div>
              </ResizablePanel>
              <ResizableHandle 
                withHandle 
                className="mx-1 w-2 bg-border/50 hover:bg-primary/30 transition-colors cursor-col-resize rounded"
              />
              <ResizablePanel 
                defaultSize={50} 
                minSize={25}
                className="transition-all duration-200"
              >
                <div className="h-full pl-2">
                  {renderSection(row.sections[1])}
                </div>
              </ResizablePanel>
            </ResizablePanelGroup>
          )}
        </div>
      ))}
    </div>
  );
}
