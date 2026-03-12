/**
 * KeyboardShortcutsDialog Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { KeyboardShortcutsDialog } from '@/components/sprint/KeyboardShortcutsDialog';

describe('KeyboardShortcutsDialog', () => {
    it('exports the component', () => {
        expect(KeyboardShortcutsDialog).toBeDefined();
    });
});
