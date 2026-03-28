/**
 * EmojiPicker Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { EmojiPicker } from '@/components/chat/EmojiPicker';

describe('EmojiPicker', () => {
    it('exports the component', () => {
        expect(EmojiPicker).toBeDefined();
    });
});
