/**
 * PageList Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { PageList } from '@/components/notes/PageList';

describe('PageList', () => {
    it('exports the component', () => {
        expect(PageList).toBeDefined();
    });
});
