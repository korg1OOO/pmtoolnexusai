/**
 * MessageEditor Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { MessageActionsMenu } from '@/components/chat/MessageEditor';

describe('MessageEditor', () => {
    it('exports the component', () => {
        expect(MessageActionsMenu).toBeDefined();
    });
});
