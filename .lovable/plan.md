

# Fix: Page Loading and Disappearing Issue

## Problem Identified
The page loads and then disappears due to an **infinite re-render loop** in the `ContextSelector` component.

### Root Cause
In `src/components/ai/ContextSelector.tsx` (lines 141-149), there's a `useEffect` that:
1. Checks if `selectedContexts.length === 0`
2. Calls `onContextChange([currentPage])` to auto-add the current page
3. Has incomplete dependencies (`[currentView]` only)

This causes a render cascade:
- Parent (`GlobalAISidebar`) creates a new `selectedContexts` state
- Effect runs, calls `onContextChange`, which updates parent state
- Parent re-renders, passes new array reference
- Component re-renders, checking conditions again

## Solution

### Fix the useEffect in ContextSelector.tsx

**Current problematic code:**
```javascript
React.useEffect(() => {
  if (selectedContexts.length === 0) {
    const currentPage = AVAILABLE_PAGES.find(p => p.id === currentView);
    if (currentPage) {
      onContextChange([currentPage]);
    }
  }
}, [currentView]);
```

**Fixed code:**
```javascript
// Use a ref to track if we've already auto-added
const hasAutoAddedRef = React.useRef(false);

React.useEffect(() => {
  // Only auto-add once on mount when contexts are empty
  if (!hasAutoAddedRef.current && selectedContexts.length === 0) {
    const currentPage = AVAILABLE_PAGES.find(p => p.id === currentView);
    if (currentPage) {
      hasAutoAddedRef.current = true;
      onContextChange([currentPage]);
    }
  }
}, [currentView, selectedContexts.length, onContextChange]);

// Reset ref when view changes significantly
React.useEffect(() => {
  hasAutoAddedRef.current = false;
}, [currentView]);
```

### Alternative (Simpler) Fix

Move the initialization logic to the parent component (`GlobalAISidebar`) using a `useMemo` or initializing the state with a value:

**In GlobalAISidebar.tsx (line 62):**
```javascript
// Initialize with current page context instead of empty array
const [selectedContexts, setSelectedContexts] = useState<ContextItem[]>(() => {
  const viewContext = getViewContext(currentView);
  return [{
    id: currentView,
    type: 'page',
    label: viewContext.title,
    icon: undefined, // Will be rendered by component
    description: viewContext.description,
  }];
});
```

And remove the `useEffect` from `ContextSelector` entirely.

## Files to Modify

1. **`src/components/ai/ContextSelector.tsx`**
   - Add a `useRef` to track auto-add state
   - Fix the `useEffect` dependencies
   - Prevent infinite loop by checking ref

2. **`src/components/ai/GlobalAISidebar.tsx`** (alternative)
   - Initialize `selectedContexts` state with current page
   - Avoids the need for effect-based initialization

## Technical Details

The fix ensures:
- The auto-add only happens once per mount
- Proper dependency tracking for React hooks
- No infinite re-render loops
- Current page is still auto-selected on first load

