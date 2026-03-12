// @vitest-environment jsdom
/**
 * Tests batch 78: Remaining large components — NavigationMenu, Skeleton, various UI patterns
 * Also tests component library completeness
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

import { Skeleton } from '@/components/ui/skeleton';

describe('Skeleton component', () => {
    it('renders single skeleton', () => {
        const { container } = render(React.createElement(Skeleton, { className: 'h-12 w-12 rounded-full' }));
        expect(container.firstChild).toBeTruthy();
    });
    it('renders multiple skeletons', () => {
        const { container } = render(
            React.createElement('div', null,
                React.createElement(Skeleton, { className: 'h-4 w-[250px]' }),
                React.createElement(Skeleton, { className: 'h-4 w-[200px]' }),
                React.createElement(Skeleton, { className: 'h-4 w-[150px]' })
            )
        );
        expect(container.children[0].children.length).toBe(3);
    });
    it('renders card skeleton pattern', () => {
        const { container } = render(
            React.createElement('div', null,
                React.createElement(Skeleton, { className: 'h-[125px] w-[250px] rounded-xl' }),
                React.createElement(Skeleton, { className: 'h-4 w-[250px]' }),
                React.createElement(Skeleton, { className: 'h-4 w-[200px]' })
            )
        );
        expect(container.firstChild).toBeTruthy();
    });
});

// Test all component imports to ensure they export correctly
describe('UI Component Library completeness', () => {
    const components = [
        '@/components/ui/button',
        '@/components/ui/input',
        '@/components/ui/label',
        '@/components/ui/card',
        '@/components/ui/dialog',
        '@/components/ui/sheet',
        '@/components/ui/alert-dialog',
        '@/components/ui/select',
        '@/components/ui/tabs',
        '@/components/ui/accordion',
        '@/components/ui/dropdown-menu',
        '@/components/ui/popover',
        '@/components/ui/hover-card',
        '@/components/ui/toggle',
        '@/components/ui/tooltip',
        '@/components/ui/scroll-area',
        '@/components/ui/avatar',
        '@/components/ui/alert',
        '@/components/ui/radio-group',
        '@/components/ui/toggle-group',
        '@/components/ui/context-menu',
        '@/components/ui/menubar',
        '@/components/ui/collapsible',
        '@/components/ui/breadcrumb',
        '@/components/ui/table',
        '@/components/ui/badge',
        '@/components/ui/checkbox',
        '@/components/ui/switch',
        '@/components/ui/progress',
        '@/components/ui/separator',
        '@/components/ui/textarea',
        '@/components/ui/resizable',
        '@/components/ui/pagination',
        '@/components/ui/skeleton',
        '@/components/ui/aspect-ratio',
        '@/components/ui/drawer',
    ];

    for (const path of components) {
        const name = path.split('/').pop()!;
        it(`${name} exports correctly`, async () => {
            const mod = await import(/* @vite-ignore */ path);
            expect(mod).toBeDefined();
            expect(Object.keys(mod).length).toBeGreaterThan(0);
        });
    }
});
