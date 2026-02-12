import React, { useState, useEffect, useRef } from 'react';
import GridLayout, { Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { BriefingSectionId, BRIEFING_SECTIONS, BriefingSection } from './types';
import { BriefingSectionCard } from './BriefingSectionCard';

interface FlexibleBriefingGridProps {
  sections: BriefingSectionId[];
  renderContent: (sectionId: BriefingSectionId) => React.ReactNode;
  isGenerating: boolean;
  lastUpdated: Date;
  onRefresh: () => void;
  isCustomizing: boolean;
}

const COLS = 12;
const ROW_HEIGHT = 80;

export function FlexibleBriefingGrid({
  sections,
  renderContent,
  isGenerating,
  lastUpdated,
  onRefresh,
  isCustomizing,
}: FlexibleBriefingGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1200);

  const getSectionConfig = (id: BriefingSectionId): BriefingSection | undefined => {
    return BRIEFING_SECTIONS.find(s => s.id === id);
  };

  const generateInitialLayout = (): Layout[] => {
    let currentY = 0;
    return sections.map((sectionId, index) => {
      const isFullWidth = sectionId === 'critical-alerts' || sectionId === 'ai-insights';
      const col = isFullWidth ? 0 : (index % 2) * 6;
      const y = currentY;
      if (isFullWidth || index % 2 === 1) {
        currentY += 4;
      }
      return {
        i: sectionId,
        x: col,
        y: y,
        w: isFullWidth ? 12 : 6,
        h: 4,
        minW: 3,
        minH: 2,
      };
    });
  };

  const [layout, setLayout] = useState<Layout[]>(generateInitialLayout);

  useEffect(() => {
    const measureWidth = () => {
      if (containerRef.current) {
        const newWidth = containerRef.current.getBoundingClientRect().width;
        if (newWidth > 0) setWidth(newWidth);
      }
    };
    measureWidth();
    const resizeObserver = new ResizeObserver(measureWidth);
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    const currentIds = new Set(layout.map(l => l.i));
    if (sections.length !== layout.length || sections.some(s => !currentIds.has(s))) {
      setLayout(generateInitialLayout());
    }
  }, [sections]);

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

  if (sections.length === 0) return null;

  return (
    <div className="briefing-grid-container w-full" ref={containerRef}>
      <style>{`
        .briefing-grid-container .react-grid-item {
          z-index: 1;
          transition: all 200ms ease;
        }
        .briefing-grid-container .react-grid-item.react-dragging,
        .briefing-grid-container .react-grid-item.resizing {
          z-index: 100;
          transition: none;
        }
        .briefing-grid-container .react-grid-item.react-grid-placeholder {
          background: hsl(var(--primary) / 0.15);
          border: 2px dashed hsl(var(--primary) / 0.6);
          border-radius: 0.75rem;
          z-index: 2;
        }
        .briefing-grid-container .react-resizable-handle {
          opacity: 0;
          transition: opacity 200ms ease;
        }
        .briefing-grid-container .react-grid-item:hover .react-resizable-handle {
          opacity: 1;
        }
        .briefing-grid-container .react-resizable-handle::after {
          border-color: hsl(var(--muted-foreground) / 0.5) !important;
        }
        .briefing-grid-container .react-grid-item:hover .react-resizable-handle::after {
          border-color: hsl(var(--primary)) !important;
        }
        .drag-handle { 
          cursor: grab;
          background: linear-gradient(to bottom, hsl(var(--background) / 0.95), transparent);
          backdrop-filter: blur(4px);
        }
        .drag-handle:active { cursor: grabbing; }
      `}</style>
      <GridLayout
        className="layout"
        layout={layout}
        cols={COLS}
        rowHeight={ROW_HEIGHT}
        width={width}
        onLayoutChange={isCustomizing ? setLayout : undefined}
        draggableHandle=".drag-handle"
        isResizable={isCustomizing}
        isDraggable={isCustomizing}
        compactType={null}
        preventCollision={true}
        margin={[20, 20]}
        containerPadding={[0, 0]}
      >
        {sections.map((sectionId) => (
          <div key={sectionId} className="relative">
            <div className="h-full flex flex-col relative">
              {isCustomizing && (
                <div className="drag-handle absolute top-0 left-0 right-0 h-12 z-20 rounded-t-lg flex items-center justify-center">
                  <div className="text-xs text-muted-foreground font-medium">
                    Drag to reposition
                  </div>
                </div>
              )}
              {renderSection(sectionId)}
            </div>
          </div>
        ))}
      </GridLayout>
    </div>
  );
}
