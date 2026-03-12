// @vitest-environment jsdom
/**
 * Tests batch 53: React UI component render tests — Checkbox, Switch, Avatar, Toggle
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';

describe('Checkbox component', () => {
    it('renders without crashing', () => {
        const { container } = render(React.createElement(Checkbox));
        expect(container.firstChild).toBeTruthy();
    });
    it('renders with checked state', () => {
        const { container } = render(React.createElement(Checkbox, { checked: true }));
        expect(container.firstChild).toBeTruthy();
    });
    it('renders unchecked', () => {
        const { container } = render(React.createElement(Checkbox, { checked: false }));
        expect(container.firstChild).toBeTruthy();
    });
    it('handles disabled', () => {
        const { container } = render(React.createElement(Checkbox, { disabled: true }));
        expect(container.firstChild).toBeTruthy();
    });
});

describe('Switch component', () => {
    it('renders without crashing', () => {
        const { container } = render(React.createElement(Switch));
        expect(container.firstChild).toBeTruthy();
    });
    it('renders checked', () => {
        const { container } = render(React.createElement(Switch, { checked: true }));
        expect(container.firstChild).toBeTruthy();
    });
    it('renders disabled', () => {
        const { container } = render(React.createElement(Switch, { disabled: true }));
        expect(container.firstChild).toBeTruthy();
    });
});

describe('Badge component', () => {
    it('renders with text', async () => {
        const { Badge } = await import('@/components/ui/badge');
        const { container } = render(React.createElement(Badge, null, 'Active'));
        expect(container.textContent).toContain('Active');
    });
    it('renders with variant', async () => {
        const { Badge } = await import('@/components/ui/badge');
        const { container } = render(React.createElement(Badge, { variant: 'destructive' } as any, 'Error'));
        expect(container.textContent).toContain('Error');
    });
    it('renders secondary variant', async () => {
        const { Badge } = await import('@/components/ui/badge');
        const { container } = render(React.createElement(Badge, { variant: 'secondary' } as any, 'Info'));
        expect(container.textContent).toContain('Info');
    });
});
