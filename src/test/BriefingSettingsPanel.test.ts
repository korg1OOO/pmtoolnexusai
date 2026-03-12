/**
 * BriefingSettingsPanel Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { BriefingSettingsPanel } from '@/components/briefing/BriefingSettingsPanel';

describe('BriefingSettingsPanel', () => {
    it('exports the component', () => {
        expect(BriefingSettingsPanel).toBeDefined();
    });
});
