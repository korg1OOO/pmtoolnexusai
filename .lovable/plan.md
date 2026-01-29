
# Document Center Module - Full Implementation

## Overview
Transform the existing static Document Center into a fully functional module inspired by Microsoft OneDrive, with database persistence, file storage, comprehensive toolbar, folder management, and document workflow features.

## Visual Design

### Toolbar Features (OneDrive-inspired)
- **New**: Create new folder, upload file, upload folder
- **Copy/Move/Delete**: Bulk operations on selected files
- **Rename**: Quick rename functionality
- **Download**: Download selected files
- **Share**: Share documents with team members
- **Sort**: Sort by name, date modified, size, type
- **View Options**: Grid view, List view, Details view
- **Details Panel**: Toggle right sidebar with file properties

### Layout Structure
```text
+------------------+-----------------------------+----------------+
|    Folder Tree   |      Document Grid/List     | Details Panel  |
|                  |                             |   (Toggleable) |
|  - All Files     |  +-------+ +-------+        |                |
|  - Starred       |  | File1 | | File2 |        |  File Info     |
|  - Shared        |  +-------+ +-------+        |  Properties    |
|  - Recent        |  +-------+ +-------+        |  Versions      |
|  - Trash         |  | File3 | | File4 |        |  Activity      |
|  > Folder 1      |  +-------+ +-------+        |                |
|  > Folder 2      |                             |  Sharing       |
+------------------+-----------------------------+----------------+
```

---

## Technical Implementation

### Phase 1: Database Schema

**New table `documents`:**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| project_id | UUID | FK to projects |
| folder_id | UUID | FK to document_folders (nullable for root) |
| name | TEXT | File name |
| file_type | TEXT | pdf, doc, xls, ppt, image, other |
| file_url | TEXT | Storage URL |
| file_size | INTEGER | Size in bytes |
| version | TEXT | Current version number |
| status | TEXT | draft, review, approved, archived |
| uploaded_by | UUID | User who uploaded |
| uploaded_by_name | TEXT | Cached user name |
| is_starred | BOOLEAN | Starred/favorite |
| is_locked | BOOLEAN | Locked for editing |
| locked_by | UUID | User who locked |
| metadata | JSONB | Custom properties |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

**New table `document_folders`:**
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

**New table `document_versions`:**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| document_id | UUID | FK to documents |
| version | TEXT | Version number |
| file_url | TEXT | Storage URL for this version |
| file_size | INTEGER | Size in bytes |
| change_notes | TEXT | Description of changes |
| uploaded_by | UUID | User who uploaded |
| uploaded_by_name | TEXT | Cached user name |
| status | TEXT | current, approved, superseded, draft |
| approved_by | UUID | Approver user |
| approved_by_name | TEXT | Cached approver name |
| approved_at | TIMESTAMP | |
| created_at | TIMESTAMP | |

**New table `document_approvers`:**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| document_id | UUID | FK to documents |
| user_id | UUID | Approver user |
| user_name | TEXT | Cached user name |
| user_role | TEXT | Role in approval chain |
| order_num | INTEGER | Order in approval chain |
| status | TEXT | pending, approved, rejected, skipped |
| comment | TEXT | Approval/rejection comment |
| decided_at | TIMESTAMP | |
| created_at | TIMESTAMP | |

**New table `document_shares`:**
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| document_id | UUID | FK to documents |
| folder_id | UUID | FK to folders (for folder sharing) |
| shared_with_user_id | UUID | User shared with |
| shared_with_email | TEXT | Email for external sharing |
| permission | TEXT | view, comment, edit |
| share_link | TEXT | Public share link (if enabled) |
| expires_at | TIMESTAMP | Link expiration |
| created_by | UUID | |
| created_at | TIMESTAMP | |

**New storage bucket `project-documents`:**
- Public access for authenticated users
- RLS policies for project-based access

### Phase 2: Hooks & State Management

**`useDocuments.ts`:**
- CRUD operations for documents
- Upload with progress tracking
- Real-time subscriptions
- Search and filter functionality
- Bulk operations (delete, move, copy)

**`useDocumentFolders.ts`:**
- Folder tree management
- Drag-and-drop reordering
- Nested folder navigation

**`useDocumentVersions.ts`:**
- Version management
- Restore functionality
- Comparison logic

**`useDocumentSharing.ts`:**
- Share management
- Permission controls
- Link generation

### Phase 3: UI Components

**A. DocumentToolbar.tsx**
- Upload button with drag-drop zone
- New folder button
- View mode toggles (grid/list/details)
- Sort dropdown (name, date, size, type)
- Filter buttons (All, Starred, Shared, Recent)
- Bulk action buttons (appears when items selected)
- Search input
- Details panel toggle

**B. DocumentSidebar.tsx (Left Panel)**
- Quick access sections (All Files, Starred, Shared, Recent, Trash)
- Folder tree with nested navigation
- Drag-drop for moving files to folders
- Context menu for folder operations

**C. DocumentGrid.tsx / DocumentList.tsx**
- Grid view with thumbnails and file icons
- List view with columns (Name, Modified, Size, Status)
- Multi-select with checkboxes
- Drag-drop for bulk operations
- Right-click context menu
- Double-click to open/preview

**D. DocumentDetailsPanel.tsx (Right Panel - Toggleable)**
- File preview thumbnail
- Basic info (name, size, type, location)
- Properties editing (status, tags)
- Version history accordion
- Sharing management
- Activity log
- Approval workflow (if applicable)

**E. DocumentUploadDialog.tsx**
- Drag-and-drop zone
- File picker button
- Multiple file support
- Upload progress bars
- Version upload option (for existing files)
- Metadata input (description, tags)

**F. FolderCreateDialog.tsx**
- Folder name input
- Parent folder selection
- Color picker

**G. DocumentShareDialog.tsx**
- Search/add users
- Permission level dropdown
- Generate shareable link
- Expiration date picker
- Copy link button

**H. DocumentMoveDialog.tsx**
- Folder tree picker
- Move/Copy toggle
- Confirmation

### Phase 4: Integration Features

**A. Breadcrumb Navigation**
- Current folder path
- Click to navigate up

**B. Drag-and-Drop**
- Files to folders
- Reorder folders
- Multi-file operations

**C. Keyboard Shortcuts**
- Delete: Move to trash
- Ctrl+C/V: Copy/Paste files
- Ctrl+A: Select all
- Enter: Open/Preview
- F2: Rename

**D. Search & Filter**
- Real-time search across names
- Filter by file type
- Filter by status
- Filter by date range
- Filter by uploader

---

## File Storage Strategy

Using Lovable Cloud Storage bucket `project-documents`:
```text
project-documents/
  {project_id}/
    {document_id}/
      v1/original_filename.pdf
      v2/original_filename.pdf
      ...
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `src/hooks/useDocuments.ts` | Document CRUD and uploads |
| `src/hooks/useDocumentFolders.ts` | Folder management |
| `src/hooks/useDocumentVersions.ts` | Version control |
| `src/hooks/useDocumentSharing.ts` | Sharing functionality |
| `src/components/documents/DocumentToolbar.tsx` | Main toolbar component |
| `src/components/documents/DocumentSidebar.tsx` | Left navigation panel |
| `src/components/documents/DocumentGrid.tsx` | Grid view display |
| `src/components/documents/DocumentList.tsx` | List view display |
| `src/components/documents/DocumentDetailsPanel.tsx` | Right details panel |
| `src/components/documents/DocumentUploadDialog.tsx` | Upload interface |
| `src/components/documents/FolderCreateDialog.tsx` | Create folder dialog |
| `src/components/documents/DocumentShareDialog.tsx` | Sharing dialog |
| `src/components/documents/DocumentMoveDialog.tsx` | Move/copy dialog |
| `src/components/documents/DocumentContextMenu.tsx` | Right-click menu |
| `src/components/documents/DocumentPreviewDialog.tsx` | File preview modal |
| `supabase/migrations/xxx_documents_schema.sql` | Database tables |

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/views/DocumentCenterView.tsx` | Complete refactor to use new components |
| `src/components/documents/VersionHistory.tsx` | Connect to database |
| `src/components/documents/DocumentApprovalWorkflow.tsx` | Connect to database |

---

## User Workflow

### Uploading Documents:
1. Click "Upload" or drag files to the drop zone
2. Select single or multiple files
3. Add optional description/tags
4. Files upload to storage with progress indicator
5. Document records created in database
6. Real-time updates show new files immediately

### Organizing Documents:
1. Create folders via toolbar or right-click
2. Drag-drop files into folders
3. Use breadcrumb to navigate folder hierarchy
4. Star important files for quick access
5. Use search/filter to find specific documents

### Versioning:
1. Right-click file and select "Upload New Version"
2. Previous version moves to version history
3. View all versions in details panel
4. Restore previous version if needed
5. Compare versions side-by-side

### Sharing:
1. Select file and click "Share" in toolbar
2. Add users with specific permissions (view/edit)
3. Optionally generate public link with expiration
4. Recipients see shared files in their "Shared with me" section

### Approval Workflow:
1. Upload document and set status to "Review"
2. Add approvers in order
3. Each approver receives notification
4. Approvers approve/reject with comments
5. Document status updates automatically

---

## Enhancement Ideas for Future

1. **Document Preview**: In-browser preview for PDFs, images, and Office files
2. **Comments/Annotations**: Comment on specific parts of documents
3. **Tags/Labels**: Categorize documents with custom tags
4. **Favorites/Collections**: Group related documents
5. **Activity Feed**: See all document activity in one place
6. **Email Notifications**: Notify on shares, approvals, comments
7. **Offline Access**: Mark files for offline access
8. **Bulk Upload**: Upload entire folder structures
9. **AI Integration**: Auto-categorize, summarize documents
10. **Integration with Tasks**: Link documents to project tasks
