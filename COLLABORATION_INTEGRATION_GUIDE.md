// Integration Guide for Phase 3 Collaboration Features
// Add this to SpreadsheetEditor.tsx

// 1. ADD IMPORTS (after line 54)
import { PresenceCursors, PresenceSelections, CommentThread, ShareDialog, VersionHistoryPanel } from './spreadsheet/collaboration';
import { PresenceManager, generateUserColor, type UserPresence } from '@/services/presenceService';
import { CommentsService, type SpreadsheetComment } from '@/services/commentsService';
import { VersionHistoryService, type SpreadsheetVersion } from '@/services/versionHistoryService';
import { supabase } from '@/lib/supabase';

// 2. ADD STATE (after showConvertDialog state around line 84)
const [activeUsers, setActiveUsers] = useState<UserPresence[]>([]);
const [comments, setComments] = useState<SpreadsheetComment[]>([]);
const [commentThreadOpen, setCommentThreadOpen] = useState(false);
const [activeCommentCell, setActiveCommentCell] = useState<string | null>(null);
const [showShareDialog, setShowShareDialog] = useState(false);
const [showVersionHistory, setShowVersionHistory] = useState(false);
const presenceManagerRef = useRef<PresenceManager | null>(null);

// 3. ADD PRESENCE SETUP (in existing useEffect around line 130)
// Add to the useEffect that loads activeSheet data:
useEffect(() => {
  if (activeSheet) {
    // ... existing code ...
    
    // Setup collaboration
    setupPresence();
    loadComments();
  }
  
  return () => {
    presenceManagerRef.current?.unsubscribe();
  };
}, [activeSheet?.id]);

// 4. ADD HELPER FUNCTIONS (before render)
const setupPresence = async () => {
  if (!activeSheet?.id) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const manager = new PresenceManager(
    activeSheet.id,
    user.id,
    user.email || 'Anonymous',
    user.email,
    generateUserColor()
  );

  await manager.subscribe((state) => {
    setActiveUsers(manager.getActiveUsers());
  });

  presenceManagerRef.current = manager;
};

const loadComments = async () => {
  if (!activeSheet?.id) return;
  const comments = await CommentsService.getComments(activeSheet.id);
  setComments(comments);
  return CommentsService.subscribeToComments(activeSheet.id, setComments);
};

const handleOpenComments = (cellRef: string) => {
  setActiveCommentCell(cellRef);
  setCommentThreadOpen(true);
};

const handleAddComment = async (content: string, parentId?: string) => {
  if (!activeSheet?.id || !activeCommentCell) return;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await CommentsService.createComment(
    {
      sheet_id: activeSheet.id,
      cell_ref: activeCommentCell,
      content,
      parent_id: parentId,
    },
    user.email || 'Anonymous',
    user.email
  );
};

// 5. ADD TO RENDER (inside the main div, after grid)
{/* Presence Cursors */}
<PresenceCursors
  users={activeUsers}
  cellWidth={100}
  cellHeight={30}
  rowHeaderWidth={50}
  columnHeaderHeight={30}
/>

{/* Presence Selections */}
<PresenceSelections
  users={activeUsers}
  cellWidth={100}
  cellHeight={30}
  rowHeaderWidth={50}
  columnHeaderHeight={30}
/>

{/* Comment Thread */}
{commentThreadOpen && activeCommentCell && (
  <CommentThread
    cellRef={activeCommentCell}
    comments={comments.filter(c => c.cell_ref === activeCommentCell)}
    currentUserId={''} // Get from auth
    onAddComment={handleAddComment}
    onEditComment={(id, content) => CommentsService.updateComment(id, content)}
    onDeleteComment={(id) => CommentsService.deleteComment(id)}
    onResolve={(id, resolved) => CommentsService.resolveComment(id, resolved)}
    onClose={() => setCommentThreadOpen(false)}
  />
)}

{/* Share Dialog */}
<ShareDialog
  open={showShareDialog}
  onOpenChange={setShowShareDialog}
  spreadsheetId={spreadsheet?.id || ''}
  spreadsheetName={spreadsheet?.name || ''}
/>

{/* Version History */}
<VersionHistoryPanel
  open={showVersionHistory}
  onOpenChange={setShowVersionHistory}
  sheetId={activeSheet?.id || ''}
  onRestore={async (version) => {
    // Restore logic
    setLocalData(version.snapshot_data);
  }}
/>

// 6. ADD TOOLBAR BUTTONS (in SpreadsheetToolbar component)
// Add these buttons to the toolbar:
// - Share button → setShowShareDialog(true)
// - Comments button → handleOpenComments(getCellRefString(selection.start.row, selection.start.col))
// - History button → setShowVersionHistory(true)
