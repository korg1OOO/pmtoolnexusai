/**
 * ComposeArea Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { ComposeArea } from '@/components/chat/ComposeArea';

describe('ComposeArea', () => {
    it('exports the component', () => {
        expect(ComposeArea).toBeDefined();
    });
});
