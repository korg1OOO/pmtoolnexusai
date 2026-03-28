// @vitest-environment jsdom
/**
 * Tests batch 56: React UI render — Select, Tabs, Card, Accordion
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

describe('Select component', () => {
    it('renders trigger with placeholder', () => {
        render(
            React.createElement(Select, null,
                React.createElement(SelectTrigger, null,
                    React.createElement(SelectValue, { placeholder: 'Pick one' })
                ),
                React.createElement(SelectContent, null,
                    React.createElement(SelectItem, { value: 'a' }, 'Option A'),
                    React.createElement(SelectItem, { value: 'b' }, 'Option B')
                )
            )
        );
        expect(screen.getByText('Pick one')).toBeTruthy();
    });
    it('renders with default value', () => {
        render(
            React.createElement(Select, { defaultValue: 'a' },
                React.createElement(SelectTrigger, null,
                    React.createElement(SelectValue, null)
                ),
                React.createElement(SelectContent, null,
                    React.createElement(SelectItem, { value: 'a' }, 'Alpha'),
                    React.createElement(SelectItem, { value: 'b' }, 'Beta')
                )
            )
        );
        expect(screen.getByText('Alpha')).toBeTruthy();
    });
});

describe('Tabs component', () => {
    it('renders tab list', () => {
        render(
            React.createElement(Tabs, { defaultValue: 'tab1' },
                React.createElement(TabsList, null,
                    React.createElement(TabsTrigger, { value: 'tab1' }, 'Overview'),
                    React.createElement(TabsTrigger, { value: 'tab2' }, 'Details')
                ),
                React.createElement(TabsContent, { value: 'tab1' }, 'Overview content'),
                React.createElement(TabsContent, { value: 'tab2' }, 'Details content')
            )
        );
        expect(screen.getByText('Overview')).toBeTruthy();
        expect(screen.getByText('Details')).toBeTruthy();
        expect(screen.getByText('Overview content')).toBeTruthy();
    });
    it('renders with no default', () => {
        render(
            React.createElement(Tabs, null,
                React.createElement(TabsList, null,
                    React.createElement(TabsTrigger, { value: 'a' }, 'Tab A')
                )
            )
        );
        expect(screen.getByText('Tab A')).toBeTruthy();
    });
});

describe('Card component', () => {
    it('renders full card', () => {
        render(
            React.createElement(Card, null,
                React.createElement(CardHeader, null,
                    React.createElement(CardTitle, null, 'Project Status'),
                    React.createElement(CardDescription, null, 'Current sprint overview')
                ),
                React.createElement(CardContent, null, 'Main content area'),
                React.createElement(CardFooter, null, 'Footer actions')
            )
        );
        expect(screen.getByText('Project Status')).toBeTruthy();
        expect(screen.getByText('Current sprint overview')).toBeTruthy();
        expect(screen.getByText('Main content area')).toBeTruthy();
        expect(screen.getByText('Footer actions')).toBeTruthy();
    });
    it('renders minimal card', () => {
        render(React.createElement(Card, null, React.createElement(CardContent, null, 'Simple')));
        expect(screen.getByText('Simple')).toBeTruthy();
    });
});

describe('Accordion component', () => {
    it('renders accordion items', () => {
        render(
            React.createElement(Accordion, { type: 'single', collapsible: true } as any,
                React.createElement(AccordionItem, { value: 'item-1' },
                    React.createElement(AccordionTrigger, null, 'Section 1'),
                    React.createElement(AccordionContent, null, 'Content 1')
                ),
                React.createElement(AccordionItem, { value: 'item-2' },
                    React.createElement(AccordionTrigger, null, 'Section 2'),
                    React.createElement(AccordionContent, null, 'Content 2')
                )
            )
        );
        expect(screen.getByText('Section 1')).toBeTruthy();
        expect(screen.getByText('Section 2')).toBeTruthy();
    });
});
