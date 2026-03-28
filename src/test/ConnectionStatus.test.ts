/**
 * ConnectionStatus Component Tests
 */
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';

import { ConnectionStatus } from '@/components/realtime/ConnectionStatus';

describe('ConnectionStatus', () => {
    it('exports the component', () => {
        expect(ConnectionStatus).toBeDefined();
    });
});
