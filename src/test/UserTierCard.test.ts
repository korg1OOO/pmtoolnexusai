/**
 * UserTierCard Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { UserTierCard } from '@/components/admin/components/UserTierCard';

describe('UserTierCard', () => {
    it('exports the component', () => {
        expect(UserTierCard).toBeDefined();
    });
});
