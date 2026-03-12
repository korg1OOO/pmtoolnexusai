/**
 * MessageThread Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { ReplyPreview } from '@/components/chat/MessageThread';

describe('MessageThread', () => {
    it('exports the component', () => {
        expect(ReplyPreview).toBeDefined();
    });
});
