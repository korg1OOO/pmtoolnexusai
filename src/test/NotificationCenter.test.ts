/**
 * NotificationCenter Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { NotificationCenter } from '@/components/notifications/NotificationCenter';

describe('NotificationCenter', () => {
    it('exports the component', () => {
        expect(NotificationCenter).toBeDefined();
    });
});
