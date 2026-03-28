/**
 * PinnedMessages Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { PinnedMessages } from '@/components/chat/PinnedMessages';

describe('PinnedMessages', () => {
    it('exports the component', () => {
        expect(PinnedMessages).toBeDefined();
    });
});
