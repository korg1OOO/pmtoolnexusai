export { PresentationSidebar } from './PresentationSidebar';
export { PresentationToolbar } from './PresentationToolbar';
export { SlideEditor } from './SlideEditor';
export { SlidePropertiesPanel } from './SlidePropertiesPanel';
export { SpeakerNotesPanel } from './SpeakerNotesPanel';
export { ShapeLibrary } from './ShapeLibrary';
export { ComponentPicker } from './ComponentPicker';
export { EmbeddedDashboardWidget } from './EmbeddedDashboardWidget';

// Re-export types
export type { PresentationFolder } from '@/hooks/usePresentationFolders';
export type { Presentation } from '@/hooks/usePresentations';
export type { PresentationSlide, SlideShape, SlideImage, SlideChart } from '@/hooks/useSlides';
export type { EmbeddedComponentData } from './EmbeddedDashboardWidget';
