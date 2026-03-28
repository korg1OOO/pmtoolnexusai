/**
 * ReadReceipts Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { ReadReceipts } from '@/components/chat/ReadReceipts';

describe('ReadReceipts', () => {
    it('exports the component', () => {
        expect(ReadReceipts).toBeDefined();
    });
});
