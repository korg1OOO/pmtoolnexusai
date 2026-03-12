/**
 * MessageBubble Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { MessageBubble } from '@/components/chat/MessageBubble';

describe('MessageBubble', () => {
    it('exports the component', () => {
        expect(MessageBubble).toBeDefined();
    });
});
