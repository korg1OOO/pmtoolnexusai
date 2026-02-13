/**
 * Centralized keyboard shortcuts registry for spreadsheet
 */

export interface KeyboardShortcut {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    description: string;
    category: 'navigation' | 'editing' | 'formatting' | 'features' | 'clipboard';
}

export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
    // Navigation
    { key: 'ArrowUp', description: 'Move selection up', category: 'navigation' },
    { key: 'ArrowDown', description: 'Move selection down', category: 'navigation' },
    { key: 'ArrowLeft', description: 'Move selection left', category: 'navigation' },
    { key: 'ArrowRight', description: 'Move selection right', category: 'navigation' },
    { key: 'Enter', description: 'Move down and commit edit', category: 'navigation' },
    { key: 'Tab', description: 'Move right', category: 'navigation' },
    { key: 'Tab', shift: true, description: 'Move left', category: 'navigation' },
    { key: 'Home', ctrl: true, description: 'Go to A1', category: 'navigation' },
    { key: 'End', ctrl: true, description: 'Go to last used cell', category: 'navigation' },

    // Editing
    { key: 'F2', description: 'Start editing cell', category: 'editing' },
    { key: 'Escape', description: 'Cancel edit', category: 'editing' },
    { key: 'Delete', description: 'Clear cell contents', category: 'editing' },
    { key: 'Backspace', description: 'Clear cell and start editing', category: 'editing' },

    // Clipboard
    { key: 'c', ctrl: true, description: 'Copy', category: 'clipboard' },
    { key: 'x', ctrl: true, description: 'Cut', category: 'clipboard' },
    { key: 'v', ctrl: true, description: 'Paste', category: 'clipboard' },
    { key: 'z', ctrl: true, description: 'Undo', category: 'clipboard' },
    { key: 'y', ctrl: true, description: 'Redo', category: 'clipboard' },

    // Formatting
    { key: 'b', ctrl: true, description: 'Bold', category: 'formatting' },
    { key: 'i', ctrl: true, description: 'Italic', category: 'formatting' },
    { key: 'u', ctrl: true, description: 'Underline', category: 'formatting' },
    { key: ';', ctrl: true, description: 'Insert current date', category: 'formatting' },
    { key: ';', ctrl: true, shift: true, description: 'Insert current time', category: 'formatting' },

    // Features
    { key: 'm', ctrl: true, description: 'Merge cells', category: 'features' },
    { key: 'm', ctrl: true, shift: true, description: 'Unmerge cells', category: 'features' },
    { key: 'd', ctrl: true, description: 'Fill down', category: 'features' },
];

/**
 * Check if a keyboard event matches a shortcut
 */
export function matchesShortcut(
    event: KeyboardEvent,
    shortcut: KeyboardShortcut
): boolean {
    const keyMatches = event.key === shortcut.key;
    const ctrlMatches = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
    const shiftMatches = shortcut.shift ? event.shiftKey : !event.shiftKey;
    const altMatches = shortcut.alt ? event.altKey : !event.altKey;

    return keyMatches && ctrlMatches && shiftMatches && altMatches;
}

/**
 * Get shortcut description for tooltip
 */
export function getShortcutTooltip(category: string, action: string): string {
    const shortcut = KEYBOARD_SHORTCUTS.find(
        s => s.category === category && s.description.toLowerCase().includes(action.toLowerCase())
    );

    if (!shortcut) return '';

    const parts: string[] = [];
    if (shortcut.ctrl) parts.push('Ctrl');
    if (shortcut.shift) parts.push('Shift');
    if (shortcut.alt) parts.push('Alt');
    parts.push(shortcut.key);

    return `(${parts.join('+')})`;
}

/**
 * Format current date for insertion
 */
export function getCurrentDate(): string {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    });
}

/**
 * Format current time for insertion
 */
export function getCurrentTime(): string {
    const now = new Date();
    return now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    });
}
