

# Presentations Module - Full Implementation (Enhanced)

## Overview
Transform the existing static Presentations module into a fully functional Canva/PowerPoint-style slide builder with database persistence, WYSIWYG TipTap rich text editing, comprehensive toolbar, folder organization, collaboration, and advanced features.

---

## Visual Design

### Main Toolbar (Top Bar)
```text
+-----------------------------------------------------------------------------------------------+
| [New] [Open] [Save] | Title Input | [B] [I] [U] [S] | [H1] [H2] | [Left] [Center] [Right]     |
|                     |             | [List] [Ordered] | [Link] [Image] [Table] | [Undo] [Redo] |
|                     |             | [Text Color] [BG Color] | [Shapes] | [Chart] |            |
|                     |             | [Present] [Export PDF] [Share] | [Collab: 2 users]        |
+-----------------------------------------------------------------------------------------------+
```

### Layout Structure (3-Column with Enhanced Sidebar)
```text
+----------------------+-----------------------------+----------------+
|   PRESENTATIONS      |      Editable Canvas        | Properties     |
|   & FOLDERS          |   (TipTap WYSIWYG Editor)   |   Panel        |
|                      |                             |                |
|  > Folder 1          |  +----------------------+   | Slide Master   |
|    - Presentation A  |  |   Click to edit...   |   | Template       |
|  > Folder 2          |  |                      |   | Theme Colors   |
|    - Presentation B  |  |   [Rich Text Here]   |   | Background     |
|  [+ New Folder]      |  |   [Image] [Shape]    |   | Transitions    |
|                      |  +----------------------+   | Linked Data    |
|  ------------------- |                             |                |
|  SLIDES              |  Speaker Notes:             | Insert Options |
|  [1] Slide 1         |  +----------------------+   |                |
|  [2] Slide 2         |  | Hidden notes here... |   | Version History|
|  [3] Slide 3         |  +----------------------+   |                |
|  [+ Add Slide]       |                             | Collaborators  |
+----------------------+-----------------------------+----------------+
```

---

## Technical Implementation

### Phase 1: Database Schema

**New table `presentation_folders`:**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| project_id | UUID | FK to projects |
| parent_id | UUID | FK to self (nullable for root) |
| name | TEXT | Folder name |
| color | TEXT | Folder color/icon |
| sort_order | INTEGER | Order in tree |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

**New table `presentations`:**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| project_id | UUID | FK to projects |
| folder_id | UUID | FK to presentation_folders (nullable) |
| title | TEXT | Presentation title |
| template | TEXT | executive-status, steering-committee, etc. |
| theme | JSONB | Theme configuration (colors, fonts, logo) |
| slide_master | JSONB | Global slide styles (header, footer, fonts) |
| transitions | JSONB | Default transition settings |
| created_by | UUID | User who created |
| created_by_name | TEXT | Cached user name |
| is_shared | BOOLEAN | Shared with team |
| version | INTEGER | Current version number |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

**New table `presentation_slides`:**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| presentation_id | UUID | FK to presentations |
| title | TEXT | Slide title |
| template | TEXT | title, executive-summary, metrics, blank, etc. |
| content | JSONB | Full slide content (heading, body, bullets, etc.) |
| html_content | TEXT | TipTap HTML content for rich text |
| speaker_notes | TEXT | Hidden speaker notes |
| transition | JSONB | Slide-specific transition settings |
| background | JSONB | Background settings (color, image) |
| shapes | JSONB | Array of shape objects on slide |
| images | JSONB | Array of image objects on slide |
| charts | JSONB | Array of chart references |
| sort_order | INTEGER | Order in presentation |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

**New table `presentation_versions`:**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| presentation_id | UUID | FK to presentations |
| version | INTEGER | Version number |
| slides_snapshot | JSONB | Full snapshot of all slides |
| change_notes | TEXT | Description of changes |
| created_by | UUID | |
| created_by_name | TEXT | |
| created_at | TIMESTAMP | |

**New table `presentation_collaborators`:**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| presentation_id | UUID | FK to presentations |
| user_id | UUID | Collaborator user |
| user_name | TEXT | Cached user name |
| user_email | TEXT | |
| permission | TEXT | view, comment, edit |
| cursor_position | JSONB | Real-time cursor position |
| last_active | TIMESTAMP | |
| created_at | TIMESTAMP | |

**New storage bucket `presentation-assets`:**
- For storing uploaded images
- RLS policies for project-based access

**Enable realtime for all tables.**

### Phase 2: New TipTap Extensions to Install

```json
{
  "@tiptap/extension-text-align": "^2.x",
  "@tiptap/extension-underline": "^2.x",
  "@tiptap/extension-color": "^2.x",
  "@tiptap/extension-text-style": "^2.x",
  "@tiptap/extension-highlight": "^2.x",
  "@tiptap/extension-image": "^2.x",
  "@tiptap/extension-table": "^2.x",
  "@tiptap/extension-table-row": "^2.x",
  "@tiptap/extension-table-cell": "^2.x",
  "@tiptap/extension-table-header": "^2.x"
}
```

### Phase 3: Hooks & State Management

**`usePresentationFolders.ts`:**
- Folder tree management (mirroring useDocumentFolders pattern)
- CRUD operations for folders
- Nested folder navigation
- Real-time subscriptions

**`usePresentations.ts`:**
- List all presentations for project (filterable by folder)
- CRUD operations (create, update, delete)
- Duplicate presentation
- Move between folders
- Real-time subscriptions

**`useSlides.ts`:**
- CRUD operations for slides within a presentation
- Reorder slides (update sort_order)
- Duplicate slide
- Image upload integration
- Shape management
- Chart linking
- Real-time subscriptions

**`usePresentationVersions.ts`:**
- Create version snapshots
- List version history
- Restore to previous version
- Compare versions

**`usePresentationCollaboration.ts`:**
- Track active collaborators
- Broadcast cursor positions
- Lock editing regions
- Conflict resolution

### Phase 4: UI Components

**A. PresentationSidebar.tsx (Left Panel - Dual Purpose)**
- **Upper Section: Folders & Presentations**
  - Folder tree with nested navigation (same pattern as DocumentSidebar)
  - Presentations listed under folders
  - Quick access: All, Recent, Shared
  - Create new folder/presentation buttons
  - Drag-drop for moving presentations to folders
  
- **Lower Section: Slides**
  - Draggable slide thumbnails
  - Add slide button with template picker
  - Right-click context menu (duplicate, delete, move)
  - Visual indicator for selected slide

**B. PresentationToolbar.tsx (Main Toolbar)**
A comprehensive toolbar with:
- **File Operations**: New Presentation, Open (dropdown), Save indicator, Auto-save toggle
- **Presentation Title**: Editable input field
- **Text Formatting**: Bold, Italic, Underline, Strikethrough
- **Headings**: H1, H2, H3 dropdown
- **Alignment**: Left, Center, Right, Justify
- **Lists**: Bullet list, Numbered list
- **Insert**: Link, Image (upload), Table, Shape library, Chart picker
- **Colors**: Text color picker, Background/Highlight color picker
- **History**: Undo, Redo
- **Actions**: Present, Export PDF, Share
- **Collaboration Indicator**: Shows active collaborators with avatars

**C. SlideEditor.tsx (WYSIWYG Canvas)**
A TipTap-based rich text editor for slide content:
- Full TipTap with all extensions
- Large, slide-appropriate typography
- Click to edit behavior
- Auto-save on content change (debounced 1 second)
- Image placeholders with drag-drop upload
- Shape rendering layer
- Chart embedding

**D. SpeakerNotesPanel.tsx (Collapsible Bottom Panel)**
- Hidden by default, toggle to show
- TipTap editor for notes (simpler formatting)
- Linked to current slide
- Visible only to presenter in presentation mode

**E. SlidePropertiesPanel.tsx (Right Panel)**
- **Slide Master**: Apply/edit global styles
- **Template**: Switch slide template
- **Theme**: Color picker for primary/accent colors
- **Background**: Solid color, gradient, or image
- **Transitions**: Animation type and duration
- **Linked Artifacts**: Connect to project data
- **Version History**: View/restore past versions
- **Collaborators**: Manage sharing and see active users

**F. ShapeLibrary.tsx (Modal/Popover)**
Basic shapes with properties:
- Rectangles, Rounded Rectangles, Circles, Ovals
- Triangles, Arrows, Lines
- Stars, Callouts
- Each shape: fill color, stroke color, stroke width
- Drag to position, resize handles
- Layer ordering (bring forward, send back)

**G. ChartPicker.tsx (Modal)**
- Select from project charts/KPIs
- Types: Bar, Line, Pie, Donut, Area
- Live data from: Tasks progress, Budget, Sprint velocity, Risk counts
- Auto-update when project data changes

**H. ImageUploadHandler.tsx**
- Drag-drop zone for images
- Upload to presentation-assets bucket
- Insert into TipTap as image node
- Resize and position controls
- Alt text support

**I. PresentationListDialog.tsx**
- Grid of existing presentations grouped by folder
- Create new presentation button
- Search/filter
- Duplicate, Delete, Move actions

**J. TransitionSettings.tsx**
- Transition type: None, Fade, Slide, Zoom, Flip
- Duration: 0.3s, 0.5s, 1s
- Direction: Left, Right, Up, Down
- Apply to single slide or all

**K. SlideMasterEditor.tsx (Modal)**
- Define global header/footer
- Default fonts and sizes
- Logo placement
- Page numbering style
- Apply to all existing slides option

**L. PresentationVersionHistory.tsx**
- List of saved versions with timestamps
- Preview thumbnail
- Restore button
- Change notes display

**M. CollaborationPanel.tsx**
- List of active collaborators
- Colored cursors on canvas
- "User is editing..." indicators
- Manage permissions

### Phase 5: Presentation Mode Enhancements

**Enhanced Full-Screen Presenter View:**
- Main display: Current slide full-screen
- Presenter view (optional second screen):
  - Current slide
  - Next slide preview
  - Speaker notes
  - Timer/clock
  - Slide navigation
- Keyboard controls: Arrow keys, Escape, F for fullscreen
- Laser pointer simulation (mouse click shows dot)
- Transition animations between slides

### Phase 6: PDF Export (Edge Function)

**`supabase/functions/presentation-export-pdf/index.ts`:**
- Accept presentation ID
- Fetch all slides
- Generate PDF using server-side rendering
- Return downloadable PDF URL
- Handle images and charts

### Phase 7: AI Generation

**`supabase/functions/presentation-ai-generate/index.ts`:**
- Accept prompt + project context
- Use Lovable AI (google/gemini-3-flash-preview)
- Generate slide content suggestions:
  - Executive summary from project data
  - Risk matrix from active risks
  - Timeline from milestones
  - Budget overview from financials
- Return structured content to populate slides

---

## File Structure

### New Files to Create
| File | Purpose |
|------|---------|
| `src/hooks/usePresentationFolders.ts` | Folder management |
| `src/hooks/usePresentations.ts` | Presentation CRUD and real-time |
| `src/hooks/useSlides.ts` | Slide CRUD and reordering |
| `src/hooks/usePresentationVersions.ts` | Version history |
| `src/hooks/usePresentationCollaboration.ts` | Real-time collaboration |
| `src/components/presentations/PresentationSidebar.tsx` | Combined folders/slides panel |
| `src/components/presentations/PresentationToolbar.tsx` | Main formatting toolbar |
| `src/components/presentations/SlideEditor.tsx` | TipTap WYSIWYG editor for slides |
| `src/components/presentations/SpeakerNotesPanel.tsx` | Hidden notes editor |
| `src/components/presentations/SlidePropertiesPanel.tsx` | Right panel for properties |
| `src/components/presentations/ShapeLibrary.tsx` | Basic shapes picker |
| `src/components/presentations/ChartPicker.tsx` | Project chart integration |
| `src/components/presentations/ImageUploadHandler.tsx` | Image drag-drop upload |
| `src/components/presentations/PresentationListDialog.tsx` | Presentation manager |
| `src/components/presentations/TransitionSettings.tsx` | Slide transitions |
| `src/components/presentations/SlideMasterEditor.tsx` | Global slide styles |
| `src/components/presentations/PresentationVersionHistory.tsx` | Version management |
| `src/components/presentations/CollaborationPanel.tsx` | Real-time collab UI |
| `src/components/presentations/SlideTemplateRenderer.tsx` | Template-specific rendering |
| `src/components/presentations/PresenterView.tsx` | Full-screen presentation mode |
| `supabase/functions/presentation-export-pdf/index.ts` | PDF generation |
| `supabase/functions/presentation-ai-generate/index.ts` | AI content generation |
| `supabase/migrations/xxx_presentations_schema.sql` | Database migration |

### Files to Modify
| File | Changes |
|------|---------|
| `src/components/views/PresentationsView.tsx` | Complete refactor to use new components |
| `package.json` | Add new TipTap extensions |

---

## Feature Details

### Folders and Presentations Organization
- Mirror the Document Center sidebar pattern
- Folders can be nested (parent_id reference)
- Presentations belong to folders (or root)
- Drag-drop to reorganize
- Quick filters: All, Recent, Shared with me

### Image Upload
- Drag-drop images directly onto slide
- Click "Insert Image" button
- Upload to `presentation-assets` bucket
- Automatic resizing/optimization
- Stored as TipTap image nodes
- Resize handles on selected images

### Shape Library
- Pre-defined SVG shapes
- Stored in slide.shapes JSONB array
- Properties: x, y, width, height, rotation, fill, stroke
- Rendered as overlay on slide
- Drag to move, handles to resize
- Z-index management

### Charts Integration
- Connect to project metrics
- Bar chart: Task completion by phase
- Line chart: Sprint velocity trend
- Pie chart: Budget allocation
- Donut chart: Risk distribution
- Auto-refresh from live project data

### Speaker Notes
- Text area below slide editor (collapsible)
- Rich text with basic formatting
- Visible only in presenter view
- Stored in slide.speaker_notes column

### Transitions
- Applied between slides during presentation
- Types: Fade, Slide, Zoom, Flip, None
- Duration: Short (0.3s), Medium (0.5s), Long (1s)
- Direction for slide/zoom types
- Per-slide or global setting

### Real-Time Collaboration
- Track active editors via Supabase Realtime
- Broadcast cursor positions (slide ID + x,y)
- Show colored cursors for each collaborator
- Lock indicator when someone is editing a slide
- Conflict resolution: last-write-wins with notification

### PDF Export
- Edge function using puppeteer or similar
- Render each slide to PDF page
- Include transitions as notes
- Handle embedded images
- Option: Include speaker notes as separate pages

### Slide Master
- Define header (logo, title)
- Define footer (page number, date)
- Default font family and sizes
- Background template
- Apply to new slides automatically
- Option to apply to existing slides

### Version History
- Auto-save creates minor versions
- Manual "Save Version" for milestones
- Snapshots stored in presentation_versions table
- Restore replaces current slides with snapshot
- Compare view: side-by-side diff

### AI Generation
- "Generate with AI" button
- Options:
  - Executive Summary (from project status)
  - Risk Overview (from risk register)
  - Timeline (from milestones/Gantt)
  - Financial Summary (from budget)
  - Custom prompt
- AI returns structured content
- User reviews and accepts/edits before inserting

---

## User Workflows

### Creating a Presentation
1. Click "New" in sidebar or toolbar
2. Enter title and select folder
3. Choose template or blank
4. First slide auto-created
5. Click canvas to start editing

### Editing Slide Content
1. Click anywhere on the slide canvas
2. TipTap editor activates with cursor
3. Use toolbar to format text (bold, italic, headings, etc.)
4. Insert images, shapes, or charts via toolbar
5. Changes auto-save after 1 second
6. "Saved" indicator appears in toolbar

### Adding Speaker Notes
1. Toggle speaker notes panel (bottom)
2. Enter notes for current slide
3. Notes auto-save with slide
4. View notes in presenter view

### Organizing Presentations
1. Create folders in sidebar
2. Drag presentations to folders
3. Rename/delete via context menu
4. Use quick filters for navigation

### Collaborating
1. Click "Share" in toolbar
2. Add collaborators by email
3. Set permissions (view/edit)
4. See active users in collaboration panel
5. Real-time cursor visibility

### Presenting
1. Click "Present" button
2. Full-screen mode with transitions
3. Use arrow keys or click to navigate
4. Press 'N' for presenter notes view
5. Press Escape to exit

### Exporting to PDF
1. Click "Export PDF" in toolbar
2. Choose options (include notes, one slide per page)
3. Wait for generation (edge function)
4. Download PDF file

### AI Content Generation
1. Click "AI Generate" button
2. Select content type or enter custom prompt
3. AI generates slide content
4. Preview and edit suggestions
5. Accept to insert into slide

---

## Implementation Order

1. **Database Migration**: Create all tables and storage bucket
2. **Install TipTap Extensions**: Add new packages
3. **Hooks**: usePresentationFolders, usePresentations, useSlides
4. **PresentationSidebar**: Folders and slides navigation
5. **PresentationToolbar**: Full formatting toolbar
6. **SlideEditor**: TipTap WYSIWYG canvas
7. **SlidePropertiesPanel**: Right panel with all options
8. **SpeakerNotesPanel**: Notes editor
9. **ImageUploadHandler**: Image drag-drop and storage
10. **ShapeLibrary**: Basic shapes picker and rendering
11. **ChartPicker**: Project data integration
12. **TransitionSettings**: Animation configuration
13. **Refactor PresentationsView**: Integrate all components
14. **PresenterView**: Enhanced presentation mode
15. **SlideMasterEditor**: Global styles
16. **PresentationVersionHistory**: Version management
17. **CollaborationPanel**: Real-time presence
18. **Edge Functions**: PDF export and AI generation

