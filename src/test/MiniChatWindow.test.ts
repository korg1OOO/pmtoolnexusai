/**
 * MiniChatWindow Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { MiniChatWindow } from '@/components/chat/MiniChatWindow';

describe('MiniChatWindow', () => {
    it('exports the component', () => {
        expect(MiniChatWindow).toBeDefined();
    });
});
