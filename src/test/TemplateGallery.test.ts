/**
 * TemplateGallery Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { TemplateGallery } from '@/components/project-creation/TemplateGallery';

describe('TemplateGallery', () => {
    it('exports the component', () => {
        expect(TemplateGallery).toBeDefined();
    });
});
