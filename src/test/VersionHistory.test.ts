/**
 * VersionHistory Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { VersionHistory } from '@/components/documents/VersionHistory';

describe('VersionHistory', () => {
    it('exports the component', () => {
        expect(VersionHistory).toBeDefined();
    });
});
