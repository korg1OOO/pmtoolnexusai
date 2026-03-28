/**
 * MessageSearch Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { MessageSearch } from '@/components/chat/MessageSearch';

describe('MessageSearch', () => {
    it('exports the component', () => {
        expect(MessageSearch).toBeDefined();
    });
});
