/**
 * Deep tests for keyboardShortcuts (109 lines, 4 pure functions + KEYBOARD_SHORTCUTS array)
 * matchesShortcut, getShortcutTooltip, getCurrentDate, getCurrentTime
 */
import { describe, it, expect } from 'vitest';
import {
    KEYBOARD_SHORTCUTS,
    matchesShortcut,
    getShortcutTooltip,
    getCurrentDate,
    getCurrentTime,
} from './keyboardShortcuts';

// =================== KEYBOARD_SHORTCUTS ===================
describe('KEYBOARD_SHORTCUTS', () => {
    it('has entries', () => {
        expect(KEYBOARD_SHORTCUTS.length).toBeGreaterThan(15);
    });

    it('all have required fields', () => {
        KEYBOARD_SHORTCUTS.forEach(s => {
            expect(s.key).toBeTruthy();
            expect(s.description).toBeTruthy();
            expect(['navigation', 'editing', 'formatting', 'features', 'clipboard']).toContain(s.category);
        });
    });

    it('has navigation shortcuts', () => {
        const nav = KEYBOARD_SHORTCUTS.filter(s => s.category === 'navigation');
        expect(nav.length).toBeGreaterThan(0);
    });

    it('has clipboard shortcuts', () => {
        const clip = KEYBOARD_SHORTCUTS.filter(s => s.category === 'clipboard');
        expect(clip.length).toBeGreaterThan(0);
        expect(clip.some(s => s.key === 'c' && s.ctrl)).toBe(true); // Copy
    });
});

// =================== matchesShortcut ===================
describe('matchesShortcut', () => {
    const makeEvent = (key: string, ctrl = false, shift = false, alt = false): KeyboardEvent => {
        return new KeyboardEvent('keydown', { key, ctrlKey: ctrl, shiftKey: shift, altKey: alt });
    };

    it('matches simple key', () => {
        const evt = makeEvent('ArrowUp');
        expect(matchesShortcut(evt, { key: 'ArrowUp', description: 'test', category: 'navigation' })).toBe(true);
    });

    it('matches ctrl+key', () => {
        const evt = makeEvent('c', true);
        expect(matchesShortcut(evt, { key: 'c', ctrl: true, description: 'Copy', category: 'clipboard' })).toBe(true);
    });

    it('rejects wrong modifier', () => {
        const evt = makeEvent('c', false); // no ctrl
        expect(matchesShortcut(evt, { key: 'c', ctrl: true, description: 'Copy', category: 'clipboard' })).toBe(false);
    });

    it('rejects extra modifier', () => {
        const evt = makeEvent('ArrowUp', true); // has ctrl but shortcut doesn't
        expect(matchesShortcut(evt, { key: 'ArrowUp', description: 'test', category: 'navigation' })).toBe(false);
    });

    it('matches ctrl+shift+key', () => {
        const evt = makeEvent(';', true, true);
        expect(matchesShortcut(evt, { key: ';', ctrl: true, shift: true, description: 'Time', category: 'formatting' })).toBe(true);
    });

    it('rejects wrong key', () => {
        const evt = makeEvent('x', true);
        expect(matchesShortcut(evt, { key: 'c', ctrl: true, description: 'Copy', category: 'clipboard' })).toBe(false);
    });
});

// =================== getShortcutTooltip ===================
describe('getShortcutTooltip', () => {
    it('finds Copy tooltip', () => {
        const r = getShortcutTooltip('clipboard', 'copy');
        expect(r).toContain('Ctrl');
        expect(r).toContain('c');
    });

    it('finds Bold tooltip', () => {
        const r = getShortcutTooltip('formatting', 'bold');
        expect(r).toContain('Ctrl');
        expect(r).toContain('b');
    });

    it('returns empty for unknown', () => {
        expect(getShortcutTooltip('clipboard', 'nonexistent')).toBe('');
    });

    it('returns empty for wrong category', () => {
        expect(getShortcutTooltip('navigation', 'copy')).toBe('');
    });
});

// =================== getCurrentDate ===================
describe('getCurrentDate', () => {
    it('returns date string', () => {
        const r = getCurrentDate();
        expect(r).toMatch(/\d{2}\/\d{2}\/\d{4}/); // MM/DD/YYYY
    });
});

// =================== getCurrentTime ===================
describe('getCurrentTime', () => {
    it('returns time string', () => {
        const r = getCurrentTime();
        expect(r).toMatch(/\d{2}:\d{2}/); // HH:MM
    });
});
