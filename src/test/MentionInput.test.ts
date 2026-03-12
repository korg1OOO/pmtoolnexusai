/**
 * MentionInput Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { MentionInput } from '@/components/chat/MentionInput';

describe('MentionInput', () => {
    it('exports the component', () => {
        expect(MentionInput).toBeDefined();
    });
});
