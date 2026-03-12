/**
 * SpeakerNotesPanel Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { SpeakerNotesPanel } from '@/components/presentations/SpeakerNotesPanel';

describe('SpeakerNotesPanel', () => {
    it('exports the component', () => {
        expect(SpeakerNotesPanel).toBeDefined();
    });
});
