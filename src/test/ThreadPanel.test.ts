/**
 * ThreadPanel Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { ThreadPanel } from '@/components/chat/ThreadPanel';

describe('ThreadPanel', () => {
    it('exports the component', () => {
        expect(ThreadPanel).toBeDefined();
    });
});
