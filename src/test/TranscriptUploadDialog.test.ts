/**
 * TranscriptUploadDialog Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { TranscriptUploadDialog } from '@/components/meetings/TranscriptUploadDialog';

describe('TranscriptUploadDialog', () => {
    it('exports the component', () => {
        expect(TranscriptUploadDialog).toBeDefined();
    });
});
