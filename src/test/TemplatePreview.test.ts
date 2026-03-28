/**
 * TemplatePreview Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { TemplatePreview } from '@/components/project-creation/TemplatePreview';

describe('TemplatePreview', () => {
    it('exports the component', () => {
        expect(TemplatePreview).toBeDefined();
    });
});
