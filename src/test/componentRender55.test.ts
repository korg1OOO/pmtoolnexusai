// @vitest-environment jsdom
/**
 * Tests batch 55: React UI component render tests — Dialog, Sheet, AlertDialog, Drawer
 * These are Radix-based compound components
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';

describe('Dialog component', () => {
    it('renders trigger', () => {
        render(
            React.createElement(Dialog, null,
                React.createElement(DialogTrigger, null, 'Open Dialog')
            )
        );
        expect(screen.getByText('Open Dialog')).toBeTruthy();
    });
    it('renders closed by default', () => {
        const { container } = render(
            React.createElement(Dialog, null,
                React.createElement(DialogTrigger, null, 'Open'),
                React.createElement(DialogContent, null,
                    React.createElement(DialogHeader, null,
                        React.createElement(DialogTitle, null, 'Title'),
                        React.createElement(DialogDescription, null, 'Description')
                    )
                )
            )
        );
        expect(screen.getByText('Open')).toBeTruthy();
    });
    it('renders open dialog', () => {
        render(
            React.createElement(Dialog, { open: true },
                React.createElement(DialogContent, null,
                    React.createElement(DialogHeader, null,
                        React.createElement(DialogTitle, null, 'My Dialog'),
                        React.createElement(DialogDescription, null, 'Dialog description')
                    ),
                    React.createElement(DialogFooter, null, 'Footer content')
                )
            )
        );
        expect(screen.getByText('My Dialog')).toBeTruthy();
        expect(screen.getByText('Dialog description')).toBeTruthy();
    });
});

describe('Sheet component', () => {
    it('renders trigger', () => {
        render(
            React.createElement(Sheet, null,
                React.createElement(SheetTrigger, null, 'Open Sheet')
            )
        );
        expect(screen.getByText('Open Sheet')).toBeTruthy();
    });
    it('renders open sheet', () => {
        render(
            React.createElement(Sheet, { open: true },
                React.createElement(SheetContent, null,
                    React.createElement(SheetHeader, null,
                        React.createElement(SheetTitle, null, 'Sheet Title'),
                        React.createElement(SheetDescription, null, 'Sheet desc')
                    )
                )
            )
        );
        expect(screen.getByText('Sheet Title')).toBeTruthy();
    });
});

describe('AlertDialog component', () => {
    it('renders trigger', () => {
        render(
            React.createElement(AlertDialog, null,
                React.createElement(AlertDialogTrigger, null, 'Delete Item')
            )
        );
        expect(screen.getByText('Delete Item')).toBeTruthy();
    });
    it('renders open alert dialog', () => {
        render(
            React.createElement(AlertDialog, { open: true },
                React.createElement(AlertDialogContent, null,
                    React.createElement(AlertDialogHeader, null,
                        React.createElement(AlertDialogTitle, null, 'Are you sure?'),
                        React.createElement(AlertDialogDescription, null, 'This action cannot be undone.')
                    ),
                    React.createElement(AlertDialogFooter, null,
                        React.createElement(AlertDialogCancel, null, 'Cancel'),
                        React.createElement(AlertDialogAction, null, 'Confirm')
                    )
                )
            )
        );
        expect(screen.getByText('Are you sure?')).toBeTruthy();
        expect(screen.getByText('Cancel')).toBeTruthy();
        expect(screen.getByText('Confirm')).toBeTruthy();
    });
});
