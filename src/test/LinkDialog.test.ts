/**
 * LinkDialog Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { LinkDialog } from '@/components/linking/LinkDialog';

describe('LinkDialog', () => {
    it('exports the component', () => {
        expect(LinkDialog).toBeDefined();
    });
});
