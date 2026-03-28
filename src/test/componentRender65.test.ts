// @vitest-environment jsdom
/**
 * Tests batch 65: More composed component patterns + form validation patterns
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

describe('Composed: Project Creation Form', () => {
    it('renders complete project form', () => {
        render(
            React.createElement(Card, null,
                React.createElement(CardHeader, null, React.createElement(CardTitle, null, 'New Project')),
                React.createElement(CardContent, null,
                    React.createElement('div', null,
                        React.createElement(Label, null, 'Project Name'),
                        React.createElement(Input, { placeholder: 'Enter project name' })
                    ),
                    React.createElement('div', null,
                        React.createElement(Label, null, 'Description'),
                        React.createElement(Textarea, { placeholder: 'Project description...' })
                    ),
                    React.createElement('div', null,
                        React.createElement(Label, null, 'Priority'),
                        React.createElement(Select, null,
                            React.createElement(SelectTrigger, null, React.createElement(SelectValue, { placeholder: 'Select priority' })),
                            React.createElement(SelectContent, null,
                                React.createElement(SelectItem, { value: 'high' }, 'High'),
                                React.createElement(SelectItem, { value: 'medium' }, 'Medium'),
                                React.createElement(SelectItem, { value: 'low' }, 'Low')
                            )
                        )
                    ),
                    React.createElement('div', null,
                        React.createElement(Checkbox), React.createElement(Label, null, 'Make this project public')
                    )
                ),
                React.createElement(CardFooter, null,
                    React.createElement(Button, { variant: 'outline' } as any, 'Cancel'),
                    React.createElement(Button, null, 'Create Project')
                )
            )
        );
        expect(screen.getByText('New Project')).toBeTruthy();
        expect(screen.getByPlaceholderText('Enter project name')).toBeTruthy();
        expect(screen.getByPlaceholderText('Project description...')).toBeTruthy();
        expect(screen.getByText('Select priority')).toBeTruthy();
        expect(screen.getByText('Create Project')).toBeTruthy();
    });
});

describe('Composed: User Profile Card', () => {
    it('renders profile card with avatar and badges', () => {
        render(
            React.createElement(Card, null,
                React.createElement(CardContent, null,
                    React.createElement('div', null,
                        React.createElement(Avatar, null, React.createElement(AvatarFallback, null, 'JD')),
                        React.createElement('div', null,
                            React.createElement('h3', null, 'John Doe'),
                            React.createElement('p', null, 'john@example.com'),
                            React.createElement('div', null,
                                React.createElement(Badge, null, 'Admin'),
                                React.createElement(Badge, { variant: 'secondary' } as any, 'Active')
                            )
                        )
                    ),
                    React.createElement(Separator),
                    React.createElement('div', null,
                        React.createElement(Label, null, 'Notifications'),
                        React.createElement(Switch),
                    ),
                    React.createElement(Progress, { value: 75 })
                )
            )
        );
        expect(screen.getByText('JD')).toBeTruthy();
        expect(screen.getByText('John Doe')).toBeTruthy();
        expect(screen.getByText('Admin')).toBeTruthy();
        expect(screen.getByText('Active')).toBeTruthy();
    });
});

describe('Composed: Dashboard with Tabs and Alerts', () => {
    it('renders dashboard layout', () => {
        render(
            React.createElement('div', null,
                React.createElement(Alert, null,
                    React.createElement(AlertTitle, null, 'System Update'),
                    React.createElement(AlertDescription, null, 'Scheduled maintenance tonight at 2am.')
                ),
                React.createElement(Tabs, { defaultValue: 'overview' },
                    React.createElement(TabsList, null,
                        React.createElement(TabsTrigger, { value: 'overview' }, 'Overview'),
                        React.createElement(TabsTrigger, { value: 'analytics' }, 'Analytics'),
                        React.createElement(TabsTrigger, { value: 'reports' }, 'Reports')
                    ),
                    React.createElement(TabsContent, { value: 'overview' },
                        React.createElement(Card, null,
                            React.createElement(CardHeader, null, React.createElement(CardTitle, null, 'Project Summary')),
                            React.createElement(CardContent, null,
                                React.createElement(Progress, { value: 60 }),
                                React.createElement('p', null, '12 tasks completed, 8 remaining')
                            )
                        )
                    )
                )
            )
        );
        expect(screen.getByText('System Update')).toBeTruthy();
        expect(screen.getByText('Overview')).toBeTruthy();
        expect(screen.getByText('Analytics')).toBeTruthy();
        expect(screen.getByText('Project Summary')).toBeTruthy();
        expect(screen.getByText('12 tasks completed, 8 remaining')).toBeTruthy();
    });
});

describe('Composed: Modal with Form inside Dialog', () => {
    it('renders edit dialog', () => {
        render(
            React.createElement(Dialog, { open: true },
                React.createElement(DialogContent, null,
                    React.createElement(DialogHeader, null,
                        React.createElement(DialogTitle, null, 'Edit Task'),
                        React.createElement(DialogDescription, null, 'Update the task details below.')
                    ),
                    React.createElement('div', null,
                        React.createElement(Label, { htmlFor: 'taskName' }, 'Task Name'),
                        React.createElement(Input, { id: 'taskName', defaultValue: 'Design Review' })
                    ),
                    React.createElement('div', null,
                        React.createElement(Label, { htmlFor: 'taskDesc' }, 'Description'),
                        React.createElement(Textarea, { id: 'taskDesc', defaultValue: 'Review design specs' })
                    ),
                    React.createElement(DialogFooter, null,
                        React.createElement(Button, { variant: 'outline' } as any, 'Discard'),
                        React.createElement(Button, null, 'Save Changes')
                    )
                )
            )
        );
        expect(screen.getByText('Edit Task')).toBeTruthy();
        expect(screen.getByLabelText('Task Name')).toBeTruthy();
        expect(screen.getByLabelText('Description')).toBeTruthy();
        expect(screen.getByText('Save Changes')).toBeTruthy();
    });
});
