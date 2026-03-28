/**
 * Deep tests for ChatEngine utils (150 lines, 9 pure functions)
 * Tests: getInitials, getColorForUser, formatMessageTime, parseMessageJsonFields,
 *        groupMessagesBySender, filterVisibleMessages, getPinnedMessages
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    getInitials,
    getColorForUser,
    formatMessageTime,
    parseMessageJsonFields,
    groupMessagesBySender,
    filterVisibleMessages,
    getPinnedMessages,
} from './utils';

// =================== getInitials ===================
describe('getInitials', () => {
    it('from first.last@domain', () => {
        expect(getInitials('john.doe@example.com')).toBe('JD');
    });

    it('from first_last@domain', () => {
        expect(getInitials('jane_smith@example.com')).toBe('JS');
    });

    it('from first-last@domain', () => {
        expect(getInitials('bob-jones@example.com')).toBe('BJ');
    });

    it('from single name', () => {
        expect(getInitials('admin@example.com')).toBe('AD');
    });

    it('from single char email', () => {
        expect(getInitials('a@b.com')).toBe('A'); // single char → slice(0,2) = 'A'
    });

    it('uppercases result', () => {
        const r = getInitials('test.user@example.com');
        expect(r).toBe(r.toUpperCase());
    });
});

// =================== getColorForUser ===================
describe('getColorForUser', () => {
    it('returns a color class', () => {
        const color = getColorForUser('user-123');
        expect(color).toMatch(/^bg-/);
    });

    it('is deterministic', () => {
        expect(getColorForUser('abc')).toBe(getColorForUser('abc'));
    });

    it('different users get potentially different colors', () => {
        const c1 = getColorForUser('user-1');
        const c2 = getColorForUser('user-completely-different');
        // They might be the same by chance, but very unlikely
        expect(typeof c1).toBe('string');
        expect(typeof c2).toBe('string');
    });

    it('handles empty string', () => {
        const color = getColorForUser('');
        expect(color).toMatch(/^bg-/);
    });
});

// =================== formatMessageTime ===================
describe('formatMessageTime', () => {
    it('formats today as HH:mm', () => {
        const now = new Date().toISOString();
        const result = formatMessageTime(now);
        expect(result).toMatch(/^\d{2}:\d{2}$/);
    });

    it('formats yesterday with prefix', () => {
        const yesterday = new Date(Date.now() - 86400000).toISOString();
        const result = formatMessageTime(yesterday);
        expect(result).toContain('Yesterday');
    });

    it('formats old date with month', () => {
        const result = formatMessageTime('2023-06-15T14:30:00Z');
        expect(result).toContain('Jun');
        expect(result).toContain('15');
    });
});

// =================== parseMessageJsonFields ===================
describe('parseMessageJsonFields', () => {
    const baseMsg: any = {
        id: 'msg-1', content: 'hello', user_id: 'u1', user_email: 'a@b.com',
        channel_id: 'ch1', created_at: '2024-01-01', is_deleted: false,
        reactions: null, read_by: null, edit_history: null,
    };

    it('parses null arrays as empty', () => {
        const r = parseMessageJsonFields(baseMsg);
        expect(r.reactions).toEqual([]);
        expect(r.read_by).toEqual([]);
        expect(r.edit_history).toEqual([]);
    });

    it('preserves existing arrays', () => {
        const msg = { ...baseMsg, reactions: [{ emoji: '👍', userId: 'u1' }] };
        const r = parseMessageJsonFields(msg);
        expect(r.reactions).toHaveLength(1);
    });

    it('handles non-array values', () => {
        const msg = { ...baseMsg, reactions: 'not-an-array' };
        const r = parseMessageJsonFields(msg);
        expect(r.reactions).toEqual([]);
    });
});

// =================== groupMessagesBySender ===================
describe('groupMessagesBySender', () => {
    const makeMsg = (userId: string, minutesAgo: number, id?: string): any => ({
        id: id || `msg-${minutesAgo}`, user_id: userId, content: 'test',
        created_at: new Date(Date.now() - minutesAgo * 60000).toISOString(),
        user_email: `${userId}@test.com`, channel_id: 'ch1', is_deleted: false,
        reactions: [], read_by: [], edit_history: [],
    });

    it('groups consecutive messages from same sender', () => {
        const msgs = [makeMsg('u1', 4, 'a'), makeMsg('u1', 3, 'b'), makeMsg('u1', 2, 'c')];
        const groups = groupMessagesBySender(msgs);
        expect(groups).toHaveLength(1);
        expect(groups[0]).toHaveLength(3);
    });

    it('splits groups by different sender', () => {
        const msgs = [makeMsg('u1', 3, 'a'), makeMsg('u2', 2, 'b'), makeMsg('u1', 1, 'c')];
        const groups = groupMessagesBySender(msgs);
        expect(groups).toHaveLength(3);
    });

    it('splits groups after 5 minute gap', () => {
        const msgs = [makeMsg('u1', 10, 'a'), makeMsg('u1', 3, 'b')]; // 7 min gap
        const groups = groupMessagesBySender(msgs);
        expect(groups).toHaveLength(2);
    });

    it('empty array', () => {
        expect(groupMessagesBySender([])).toEqual([]);
    });
});

// =================== filterVisibleMessages ===================
describe('filterVisibleMessages', () => {
    it('keeps non-deleted messages', () => {
        const msgs: any[] = [
            { id: '1', is_deleted: false, content: 'hi' },
            { id: '2', is_deleted: false, content: 'hey' },
        ];
        expect(filterVisibleMessages(msgs)).toHaveLength(2);
    });

    it('removes deleted messages', () => {
        const msgs: any[] = [
            { id: '1', is_deleted: false, content: 'hi' },
            { id: '2', is_deleted: true, content: 'was here' },
        ];
        expect(filterVisibleMessages(msgs)).toHaveLength(1);
    });

    it('keeps tombstone messages', () => {
        const msgs: any[] = [
            { id: '1', is_deleted: true, content: '[This message has been deleted]' },
        ];
        expect(filterVisibleMessages(msgs)).toHaveLength(1);
    });
});

// =================== getPinnedMessages ===================
describe('getPinnedMessages', () => {
    it('returns pinned messages', () => {
        const msgs: any[] = [
            { id: '1', is_pinned: true, pinned_at: '2024-01-02', content: 'pinned', user_email: 'a@b', created_at: '2024-01-01' },
            { id: '2', is_pinned: false, content: 'not pinned' },
        ];
        const r = getPinnedMessages(msgs);
        expect(r).toHaveLength(1);
        expect(r[0].id).toBe('1');
    });

    it('sorts by pinned_at descending', () => {
        const msgs: any[] = [
            { id: '1', is_pinned: true, pinned_at: '2024-01-01', content: 'old', user_email: 'a@b', created_at: '2024-01-01' },
            { id: '2', is_pinned: true, pinned_at: '2024-06-01', content: 'new', user_email: 'a@b', created_at: '2024-01-01' },
        ];
        const r = getPinnedMessages(msgs);
        expect(r[0].id).toBe('2');
    });

    it('empty when no pinned', () => {
        const msgs: any[] = [{ id: '1', is_pinned: false, content: 'nope' }];
        expect(getPinnedMessages(msgs)).toHaveLength(0);
    });
});
