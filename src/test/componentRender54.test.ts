// @vitest-environment jsdom
/**
 * Tests batch 54: React UI component render tests — Button, Table, Breadcrumb, Pagination
 */
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

describe('Button component', () => {
    it('renders with text', () => {
        render(React.createElement(Button, null, 'Click me'));
        expect(screen.getByText('Click me')).toBeTruthy();
    });
    it('renders default variant', () => {
        const { container } = render(React.createElement(Button, null, 'Default'));
        expect(container.querySelector('button')).toBeTruthy();
    });
    it('renders destructive variant', () => {
        render(React.createElement(Button, { variant: 'destructive' } as any, 'Delete'));
        expect(screen.getByText('Delete')).toBeTruthy();
    });
    it('renders outline variant', () => {
        render(React.createElement(Button, { variant: 'outline' } as any, 'Outline'));
        expect(screen.getByText('Outline')).toBeTruthy();
    });
    it('renders ghost variant', () => {
        render(React.createElement(Button, { variant: 'ghost' } as any, 'Ghost'));
        expect(screen.getByText('Ghost')).toBeTruthy();
    });
    it('renders disabled', () => {
        const { container } = render(React.createElement(Button, { disabled: true }, 'Disabled'));
        expect(container.querySelector('button')?.disabled).toBe(true);
    });
    it('fires onClick', () => {
        let clicked = false;
        render(React.createElement(Button, { onClick: () => { clicked = true; } }, 'Click'));
        fireEvent.click(screen.getByText('Click'));
        expect(clicked).toBe(true);
    });
    it('renders sm size', () => {
        render(React.createElement(Button, { size: 'sm' } as any, 'Small'));
        expect(screen.getByText('Small')).toBeTruthy();
    });
    it('renders lg size', () => {
        render(React.createElement(Button, { size: 'lg' } as any, 'Large'));
        expect(screen.getByText('Large')).toBeTruthy();
    });
});

describe('Table component', () => {
    it('renders table structure', () => {
        const { container } = render(
            React.createElement(Table, null,
                React.createElement(TableHeader, null,
                    React.createElement(TableRow, null,
                        React.createElement(TableHead, null, 'Name'),
                        React.createElement(TableHead, null, 'Status')
                    )
                ),
                React.createElement(TableBody, null,
                    React.createElement(TableRow, null,
                        React.createElement(TableCell, null, 'Project A'),
                        React.createElement(TableCell, null, 'Active')
                    )
                )
            )
        );
        expect(container.querySelector('table')).toBeTruthy();
        expect(screen.getByText('Name')).toBeTruthy();
        expect(screen.getByText('Project A')).toBeTruthy();
    });
    it('renders empty table', () => {
        const { container } = render(
            React.createElement(Table, null,
                React.createElement(TableBody, null)
            )
        );
        expect(container.querySelector('table')).toBeTruthy();
    });
    it('renders multiple rows', () => {
        const { container } = render(
            React.createElement(Table, null,
                React.createElement(TableBody, null,
                    React.createElement(TableRow, null, React.createElement(TableCell, null, 'Row 1')),
                    React.createElement(TableRow, null, React.createElement(TableCell, null, 'Row 2')),
                    React.createElement(TableRow, null, React.createElement(TableCell, null, 'Row 3'))
                )
            )
        );
        expect(screen.getByText('Row 1')).toBeTruthy();
        expect(screen.getByText('Row 3')).toBeTruthy();
    });
});

describe('Breadcrumb component', () => {
    it('renders breadcrumb navigation', () => {
        const { container } = render(
            React.createElement(Breadcrumb, null,
                React.createElement(BreadcrumbList, null,
                    React.createElement(BreadcrumbItem, null,
                        React.createElement(BreadcrumbLink, { href: '/' }, 'Home')
                    ),
                    React.createElement(BreadcrumbSeparator),
                    React.createElement(BreadcrumbItem, null,
                        React.createElement(BreadcrumbLink, { href: '/projects' }, 'Projects')
                    )
                )
            )
        );
        expect(container.querySelector('nav')).toBeTruthy();
        expect(screen.getByText('Home')).toBeTruthy();
        expect(screen.getByText('Projects')).toBeTruthy();
    });
});
