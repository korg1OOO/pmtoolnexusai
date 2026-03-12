// @vitest-environment jsdom
/**
 * Tests batch 61: React UI render — Drawer, NavigationMenu, Carousel-like patterns
 * Plus: combination tests rendering multiple components together
 */
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';

describe('Composed: Login Form', () => {
    it('renders complete login form', () => {
        render(
            React.createElement(Card, null,
                React.createElement(CardHeader, null,
                    React.createElement(CardTitle, null, 'Sign In')
                ),
                React.createElement(CardContent, null,
                    React.createElement('div', null,
                        React.createElement(Label, { htmlFor: 'email' }, 'Email'),
                        React.createElement(Input, { id: 'email', type: 'email', placeholder: 'name@example.com' })
                    ),
                    React.createElement('div', null,
                        React.createElement(Label, { htmlFor: 'password' }, 'Password'),
                        React.createElement(Input, { id: 'password', type: 'password' })
                    )
                ),
                React.createElement(CardFooter, null,
                    React.createElement(Button, null, 'Sign In')
                )
            )
        );
        expect(screen.getAllByText('Sign In').length).toBeGreaterThanOrEqual(1);
        expect(screen.getByLabelText('Email')).toBeTruthy();
        expect(screen.getByLabelText('Password')).toBeTruthy();
        expect(screen.getByPlaceholderText('name@example.com')).toBeTruthy();
    });
});

describe('Composed: Settings Panel', () => {
    it('renders settings with tabs', () => {
        render(
            React.createElement(Card, null,
                React.createElement(CardHeader, null, React.createElement(CardTitle, null, 'Settings')),
                React.createElement(CardContent, null,
                    React.createElement(Tabs, { defaultValue: 'general' },
                        React.createElement(TabsList, null,
                            React.createElement(TabsTrigger, { value: 'general' }, 'General'),
                            React.createElement(TabsTrigger, { value: 'notifications' }, 'Notifications'),
                            React.createElement(TabsTrigger, { value: 'security' }, 'Security')
                        ),
                        React.createElement(TabsContent, { value: 'general' },
                            React.createElement(Label, null, 'Display Name'),
                            React.createElement(Input, { defaultValue: 'John Doe' })
                        ),
                        React.createElement(TabsContent, { value: 'notifications' },
                            React.createElement('div', null,
                                React.createElement(Label, null, 'Email Notifications'),
                                React.createElement(Switch)
                            )
                        )
                    )
                )
            )
        );
        expect(screen.getByText('Settings')).toBeTruthy();
        expect(screen.getByText('General')).toBeTruthy();
        expect(screen.getByText('Notifications')).toBeTruthy();
        expect(screen.getByText('Security')).toBeTruthy();
    });
});

describe('Composed: Data Table', () => {
    it('renders project status table', () => {
        render(
            React.createElement(Card, null,
                React.createElement(CardHeader, null, React.createElement(CardTitle, null, 'Projects')),
                React.createElement(CardContent, null,
                    React.createElement(Table, null,
                        React.createElement(TableHeader, null,
                            React.createElement(TableRow, null,
                                React.createElement(TableHead, null, 'Project'),
                                React.createElement(TableHead, null, 'Status'),
                                React.createElement(TableHead, null, 'Owner')
                            )
                        ),
                        React.createElement(TableBody, null,
                            React.createElement(TableRow, null,
                                React.createElement(TableCell, null, 'Website Redesign'),
                                React.createElement(TableCell, null, React.createElement(Badge, null, 'Active')),
                                React.createElement(TableCell, null, 'Alice')
                            ),
                            React.createElement(TableRow, null,
                                React.createElement(TableCell, null, 'Mobile App'),
                                React.createElement(TableCell, null, React.createElement(Badge, { variant: 'secondary' } as any, 'Paused')),
                                React.createElement(TableCell, null, 'Bob')
                            )
                        )
                    )
                )
            )
        );
        expect(screen.getByText('Projects')).toBeTruthy();
        expect(screen.getByText('Website Redesign')).toBeTruthy();
        expect(screen.getByText('Active')).toBeTruthy();
        expect(screen.getByText('Alice')).toBeTruthy();
    });
});

describe('Composed: Confirm Dialog', () => {
    it('renders delete confirmation', () => {
        render(
            React.createElement(Dialog, { open: true },
                React.createElement(DialogContent, null,
                    React.createElement(DialogHeader, null,
                        React.createElement(DialogTitle, null, 'Delete Project?')
                    ),
                    React.createElement('p', null, 'This will permanently remove all data.'),
                    React.createElement(DialogFooter, null,
                        React.createElement(Button, { variant: 'outline' } as any, 'Cancel'),
                        React.createElement(Button, { variant: 'destructive' } as any, 'Delete')
                    )
                )
            )
        );
        expect(screen.getByText('Delete Project?')).toBeTruthy();
        expect(screen.getByText('Cancel')).toBeTruthy();
        expect(screen.getByText('Delete')).toBeTruthy();
    });
});
