// @vitest-environment jsdom
/**
 * Tests batch 70: Edge cases and accessibility for rendered components
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';

describe('Button edge cases', () => {
    it('renders as child (asChild)', () => {
        const { container } = render(React.createElement(Button, { asChild: true } as any,
            React.createElement('a', { href: '/home' }, 'Home Link')
        ));
        expect(screen.getByText('Home Link')).toBeTruthy();
    });
    it('renders icon variant', () => {
        const { container } = render(React.createElement(Button, { size: 'icon', variant: 'ghost' } as any, '⚙'));
        expect(container.firstChild).toBeTruthy();
    });
    it('renders with className override', () => {
        const { container } = render(React.createElement(Button, { className: 'custom-class' }, 'Custom'));
        expect(container.querySelector('.custom-class')).toBeTruthy();
    });
});

describe('Input edge cases', () => {
    it('renders with all input types', () => {
        const types = ['text', 'email', 'password', 'number', 'tel', 'url', 'search', 'date'];
        for (const type of types) {
            const { container, unmount } = render(React.createElement(Input, { type }));
            expect(container.querySelector(`input[type="${type}"]`)).toBeTruthy();
            unmount();
        }
    });
    it('renders with value and onChange', () => {
        const onChange = vi.fn();
        const { container } = render(React.createElement(Input, { value: 'test', onChange }));
        expect(container.querySelector('input')?.value).toBe('test');
    });
});

describe('Card layout edge cases', () => {
    it('renders card with all 6 sub-components', () => {
        render(
            React.createElement(Card, { className: 'w-full' },
                React.createElement(CardHeader, null,
                    React.createElement(CardTitle, null, 'Full Card'),
                    React.createElement(CardDescription, null, 'With description')
                ),
                React.createElement(CardContent, null,
                    React.createElement(Progress, { value: 45 }),
                    React.createElement(Separator),
                    React.createElement(Alert, null,
                        React.createElement(AlertTitle, null, 'Notice'),
                        React.createElement(AlertDescription, null, 'Card alert')
                    )
                ),
                React.createElement(CardFooter, null,
                    React.createElement(Button, null, 'Action')
                )
            )
        );
        expect(screen.getByText('Full Card')).toBeTruthy();
        expect(screen.getByText('With description')).toBeTruthy();
        expect(screen.getByText('Notice')).toBeTruthy();
    });
});

describe('Complex data table', () => {
    it('renders large table with mixed cell content', () => {
        const rows = Array.from({ length: 10 }, (_, i) => ({
            id: i + 1,
            name: `Item ${i + 1}`,
            status: i % 2 === 0 ? 'Active' : 'Inactive',
            progress: (i + 1) * 10,
        }));

        render(
            React.createElement(Table, null,
                React.createElement(TableHeader, null,
                    React.createElement(TableRow, null,
                        React.createElement(TableHead, null, '#'),
                        React.createElement(TableHead, null, 'Name'),
                        React.createElement(TableHead, null, 'Status'),
                        React.createElement(TableHead, null, 'Progress')
                    )
                ),
                React.createElement(TableBody, null,
                    ...rows.map(r => React.createElement(TableRow, { key: r.id },
                        React.createElement(TableCell, null, React.createElement(Checkbox)),
                        React.createElement(TableCell, null,
                            React.createElement('div', null,
                                React.createElement(Avatar, null, React.createElement(AvatarFallback, null, r.name[0])),
                                r.name
                            )
                        ),
                        React.createElement(TableCell, null, React.createElement(Badge, { variant: r.status === 'Active' ? 'default' : 'secondary' } as any, r.status)),
                        React.createElement(TableCell, null, React.createElement(Progress, { value: r.progress }))
                    ))
                )
            )
        );
        expect(screen.getByText('Item 1')).toBeTruthy();
        expect(screen.getByText('Item 10')).toBeTruthy();
        expect(screen.getAllByText('Active').length).toBe(5);
        expect(screen.getAllByText('Inactive').length).toBe(5);
    });
});

describe('Deep dialog nesting', () => {
    it('renders dialog with form and select inside', () => {
        render(
            React.createElement(Dialog, { open: true },
                React.createElement(DialogContent, null,
                    React.createElement(DialogHeader, null,
                        React.createElement(DialogTitle, null, 'Configure')
                    ),
                    React.createElement('div', null,
                        React.createElement(Label, { htmlFor: 'cfg-name' }, 'Name'),
                        React.createElement(Input, { id: 'cfg-name', defaultValue: 'Default' }),
                        React.createElement(Label, null, 'Category'),
                        React.createElement(Select, null,
                            React.createElement(SelectTrigger, null, React.createElement(SelectValue, { placeholder: 'Choose' })),
                            React.createElement(SelectContent, null,
                                React.createElement(SelectItem, { value: 'a' }, 'Cat A'),
                                React.createElement(SelectItem, { value: 'b' }, 'Cat B')
                            )
                        ),
                        React.createElement('div', null,
                            React.createElement(Switch),
                            React.createElement(Label, null, 'Enable feature'),
                        ),
                        React.createElement(Label, null, 'Notes'),
                        React.createElement(Textarea, { placeholder: 'Additional notes' })
                    ),
                    React.createElement(Button, null, 'Apply')
                )
            )
        );
        expect(screen.getByText('Configure')).toBeTruthy();
        expect(screen.getByLabelText('Name')).toBeTruthy();
        expect(screen.getByText('Choose')).toBeTruthy();
        expect(screen.getByText('Apply')).toBeTruthy();
    });
});
