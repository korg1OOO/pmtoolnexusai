import React, { useState, useEffect, useRef } from 'react';
import GridLayout, { Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { BriefingSectionId, BRIEFING_SECTIONS, BriefingSection } from './types';
import { BriefingSectionCard } from './BriefingSectionCard';

interface FlexibleBriefingGridProps {
  sections: BriefingSectionId[];
  renderContent: (sectionId: BriefingSectionId, isLoading: boolean) => React.ReactNode;
  isGenerating: boolean;
  lastUpdated: Date;
  onRefresh: () => void;
  isCustomizing: boolean;
  enableSequentialLoading?: boolean;
  emptySections?: string[];
}

const COLS = 12;
const ROW_HEIGHT = 80;

// Full-width sections that span the entire row
const FULL_WIDTH_SECTIONS: BriefingSectionId[] = ['critical-alerts', 'ai-insights'];

export function FlexibleBriefingGrid({
  sections,
  renderContent,
  isGenerating,
  lastUpdated,
  onRefresh,
  isCustomizing,
  enableSequentialLoading = true,
  emptySections = [],
}: FlexibleBriefingGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1200);
  const [loadedSections, setLoadedSections] = useState<Set<BriefingSectionId>>(new Set());
  const [currentlyLoadingIndex, setCurrentlyLoadingIndex] = useState(0);

  const getSectionConfig = (id: BriefingSectionId): BriefingSection | undefined => {
    return BRIEFING_SECTIONS.find(s => s.id === id);
  };

  // ── Width measurement (for react-grid-layout customizing mode) ──
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

  // ── Sequential loading (applies to both modes) ──
  useEffect(() => {
    if (!enableSequentialLoading) {
      setLoadedSections(new Set(sections));
      return;
    }

    let mounted = true;
    let currentIndex = 0;

    const loadNext = () => {
      if (!mounted || currentIndex >= sections.length) return;
      const sectionId = sections[currentIndex];
      setCurrentlyLoadingIndex(currentIndex);
      setTimeout(() => {
        if (mounted) {
          setLoadedSections(prev => new Set([...prev, sectionId]));
          currentIndex++;
          loadNext();
        }
      }, 150);
    };

    loadNext();
    return () => { mounted = false; };
  }, [sections, enableSequentialLoading]);

  // ── Shared section renderer ──
  const renderSection = (sectionId: BriefingSectionId) => {
    const sectionConfig = getSectionConfig(sectionId);
    if (!sectionConfig) return null;
    const isLoading = enableSequentialLoading && !loadedSections.has(sectionId);
    return (
      <BriefingSectionCard
        section={sectionConfig}
        loading={isGenerating && sectionConfig.isAIPowered}
        generatedAt={sectionConfig.isAIPowered ? lastUpdated.toISOString() : undefined}
        onRefresh={sectionConfig.isAIPowered ? onRefresh : undefined}
      >
        {renderContent(sectionId, isLoading)}
      </BriefingSectionCard>
    );
  };

  if (sections.length === 0) return null;

  // ─── CSS Grid Mode (default — content auto-sizes) ────────────────────────
  if (!isCustomizing) {
    return (
      <div className="briefing-css-grid" ref={containerRef}>
        <style>{`
          .briefing-css-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            width: 100%;
          }
          .briefing-css-grid .section-full { grid-column: 1 / -1; }
          .briefing-css-grid .section-half { grid-column: span 1; }

          @media (max-width: 1024px) {
            .briefing-css-grid { grid-template-columns: 1fr; }
            .briefing-css-grid .section-half { grid-column: span 1; }
          }
        `}</style>
        {sections.map((sectionId) => {
          const isFullWidth = FULL_WIDTH_SECTIONS.includes(sectionId);
          return (
            <div key={sectionId} className={isFullWidth ? 'section-full' : 'section-half'}>
              {renderSection(sectionId)}
            </div>
          );
        })}
      </div>
    );
  }

  // ─── react-grid-layout Mode (customizing — drag & resize) ────────────────
  const generateInitialLayout = (): Layout[] => {
    let currentY = 0;
    return sections.map((sectionId, index) => {
      const isFullWidth = FULL_WIDTH_SECTIONS.includes(sectionId);
      const isEmpty = emptySections.includes(sectionId);
      const col = isFullWidth ? 0 : (index % 2) * 6;
      const y = currentY;
      if (isFullWidth || index % 2 === 1) {
        currentY += isEmpty ? 1 : 4;
      }
      return {
        i: sectionId,
        x: col,
        y,
        w: isFullWidth ? 12 : 6,
        h: isEmpty ? 1 : 4,
        minW: 3,
        minH: 1,
      };
    });
  };

  const loadLayoutFromStorage = (): Layout[] => {
    try {
      const saved = localStorage.getItem('morning-briefing-layout');
      if (saved) {
        const parsed = JSON.parse(saved);
        const savedIds = new Set(parsed.map((l: Layout) => l.i));
        if (sections.every(s => savedIds.has(s))) return parsed;
      }
    } catch { /* ignore */ }
    return generateInitialLayout();
  };

  return (
    <CustomizableGrid
      sections={sections}
      renderSection={renderSection}
      width={width}
      containerRef={containerRef}
      generateInitialLayout={generateInitialLayout}
      loadLayoutFromStorage={loadLayoutFromStorage}
      emptySections={emptySections}
    />
  );
}

// ── Separate component for the drag-mode grid (keeps hooks stable) ──
function CustomizableGrid({
  sections,
  renderSection,
  width,
  containerRef,
  generateInitialLayout,
  loadLayoutFromStorage,
  emptySections,
}: {
  sections: BriefingSectionId[];
  renderSection: (id: BriefingSectionId) => React.ReactNode;
  width: number;
  containerRef: React.RefObject<HTMLDivElement>;
  generateInitialLayout: () => Layout[];
  loadLayoutFromStorage: () => Layout[];
  emptySections: string[];
}) {
  const [layout, setLayout] = useState<Layout[]>(loadLayoutFromStorage);

  useEffect(() => {
    if (layout.length > 0) {
      try {
        localStorage.setItem('morning-briefing-layout', JSON.stringify(layout));
      } catch { /* ignore */ }
    }
  }, [layout]);

  useEffect(() => {
    const currentIds = new Set(layout.map(l => l.i));
    if (sections.length !== layout.length || sections.some(s => !currentIds.has(s))) {
      setLayout(generateInitialLayout());
    }
  }, [sections]);

  return (
    <div className="briefing-grid-container w-full" ref={containerRef as any}>
      <style>{`
        .briefing-grid-container .react-grid-item {
          z-index: 1; transition: all 200ms ease;
        }
        .briefing-grid-container .react-grid-item.react-dragging,
        .briefing-grid-container .react-grid-item.resizing {
          z-index: 100; transition: none;
        }
        .briefing-grid-container .react-grid-item.react-grid-placeholder {
          background: hsl(var(--primary) / 0.15);
          border: 2px dashed hsl(var(--primary) / 0.6);
          border-radius: 0.75rem; z-index: 2;
        }
        .briefing-grid-container .react-resizable-handle { opacity: 0; transition: opacity 200ms ease; }
        .briefing-grid-container .react-grid-item:hover .react-resizable-handle { opacity: 1; }
        .briefing-grid-container .react-resizable-handle::after {
          border-color: hsl(var(--muted-foreground) / 0.5) !important;
        }
        .drag-handle { cursor: grab; }
        .drag-handle:active { cursor: grabbing; }
      `}</style>
      <GridLayout
        className="layout"
        layout={layout}
        cols={COLS}
        rowHeight={ROW_HEIGHT}
        width={width}
        onLayoutChange={setLayout}
        draggableHandle=".drag-handle"
        isResizable={true}
        isDraggable={true}
        compactType="vertical"
        preventCollision={false}
        margin={[20, 20]}
        containerPadding={[0, 0]}
      >
        {sections.map((sectionId) => (
          <div key={sectionId} className="relative">
            <div className="h-full flex flex-col relative">
              <div className="drag-handle absolute top-0 left-0 right-0 h-12 z-20 rounded-t-lg flex items-center justify-center">
                <div className="text-xs text-muted-foreground font-medium">
                  Drag to reposition
                </div>
              </div>
              {renderSection(sectionId)}
            </div>
          </div>
        ))}
      </GridLayout>
    </div>
  );
}
