// @vitest-environment jsdom
/**
 * Tests batch 57: React UI render — DropdownMenu, Popover, Toggle, Tooltip, Slider, Scroll Area
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Toggle } from '@/components/ui/toggle';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';

describe('DropdownMenu component', () => {
    it('renders trigger', () => {
        render(
            React.createElement(DropdownMenu, null,
                React.createElement(DropdownMenuTrigger, null, 'Actions')
            )
        );
        expect(screen.getByText('Actions')).toBeTruthy();
    });
    it('renders open menu', () => {
        render(
            React.createElement(DropdownMenu, { open: true },
                React.createElement(DropdownMenuTrigger, null, 'Menu'),
                React.createElement(DropdownMenuContent, null,
                    React.createElement(DropdownMenuLabel, null, 'My Account'),
                    React.createElement(DropdownMenuSeparator),
                    React.createElement(DropdownMenuItem, null, 'Profile'),
                    React.createElement(DropdownMenuItem, null, 'Settings'),
                    React.createElement(DropdownMenuItem, null, 'Logout')
                )
            )
        );
        expect(screen.getByText('My Account')).toBeTruthy();
        expect(screen.getByText('Profile')).toBeTruthy();
    });
});

describe('Popover component', () => {
    it('renders trigger', () => {
        render(
            React.createElement(Popover, null,
                React.createElement(PopoverTrigger, null, 'Open Popover')
            )
        );
        expect(screen.getByText('Open Popover')).toBeTruthy();
    });
    it('renders open popover', () => {
        render(
            React.createElement(Popover, { open: true },
                React.createElement(PopoverTrigger, null, 'Trigger'),
                React.createElement(PopoverContent, null, 'Popover body text')
            )
        );
        expect(screen.getByText('Popover body text')).toBeTruthy();
    });
});

describe('Toggle component', () => {
    it('renders toggle', () => {
        render(React.createElement(Toggle, null, 'Bold'));
        expect(screen.getByText('Bold')).toBeTruthy();
    });
    it('renders pressed toggle', () => {
        render(React.createElement(Toggle, { pressed: true } as any, 'Active'));
        expect(screen.getByText('Active')).toBeTruthy();
    });
});

describe('Tooltip component', () => {
    it('renders trigger', () => {
        render(
            React.createElement(TooltipProvider, null,
                React.createElement(Tooltip, null,
                    React.createElement(TooltipTrigger, null, 'Hover me')
                )
            )
        );
        expect(screen.getByText('Hover me')).toBeTruthy();
    });
});

// Slider removed — requires ResizeObserver not available in JSDOM

describe('ScrollArea component', () => {
    it('renders with content', () => {
        render(React.createElement(ScrollArea, { className: 'h-48' } as any, 'Scrollable content'));
        expect(screen.getByText('Scrollable content')).toBeTruthy();
    });
});

describe('HoverCard component', () => {
    it('renders trigger', () => {
        render(
            React.createElement(HoverCard, null,
                React.createElement(HoverCardTrigger, null, 'Hover target')
            )
        );
        expect(screen.getByText('Hover target')).toBeTruthy();
    });
    it('renders open card', () => {
        render(
            React.createElement(HoverCard, { open: true },
                React.createElement(HoverCardTrigger, null, 'Target'),
                React.createElement(HoverCardContent, null, 'Card content here')
            )
        );
        expect(screen.getByText('Card content here')).toBeTruthy();
    });
});
