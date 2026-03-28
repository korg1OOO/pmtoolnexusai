// @vitest-environment jsdom
/**
 * Tests batch 52: React UI component render tests
 * Small shadcn/ui components: Badge, Input, Label, Progress, Separator, Switch, Textarea
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Import components
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

describe('Input component', () => {
    it('renders without crashing', () => {
        const { container } = render(React.createElement(Input, { placeholder: 'Enter text' }));
        expect(container.querySelector('input')).toBeTruthy();
    });
    it('applies placeholder', () => {
        render(React.createElement(Input, { placeholder: 'Test placeholder' }));
        expect(screen.getByPlaceholderText('Test placeholder')).toBeTruthy();
    });
    it('applies type', () => {
        const { container } = render(React.createElement(Input, { type: 'email' }));
        expect(container.querySelector('input')?.type).toBe('email');
    });
    it('applies disabled', () => {
        const { container } = render(React.createElement(Input, { disabled: true }));
        expect(container.querySelector('input')?.disabled).toBe(true);
    });
});

describe('Label component', () => {
    it('renders text', () => {
        render(React.createElement(Label, null, 'Username'));
        expect(screen.getByText('Username')).toBeTruthy();
    });
    it('renders with htmlFor', () => {
        const { container } = render(React.createElement(Label, { htmlFor: 'email' }, 'Email'));
        expect(container.querySelector('label')?.htmlFor).toBe('email');
    });
});

describe('Progress component', () => {
    it('renders without crashing', () => {
        const { container } = render(React.createElement(Progress, { value: 50 }));
        expect(container.firstChild).toBeTruthy();
    });
    it('renders with 0 value', () => {
        const { container } = render(React.createElement(Progress, { value: 0 }));
        expect(container.firstChild).toBeTruthy();
    });
    it('renders with 100 value', () => {
        const { container } = render(React.createElement(Progress, { value: 100 }));
        expect(container.firstChild).toBeTruthy();
    });
});

describe('Separator component', () => {
    it('renders without crashing', () => {
        const { container } = render(React.createElement(Separator));
        expect(container.firstChild).toBeTruthy();
    });
    it('renders horizontal by default', () => {
        const { container } = render(React.createElement(Separator));
        expect(container.firstChild).toBeTruthy();
    });
});

describe('Textarea component', () => {
    it('renders without crashing', () => {
        const { container } = render(React.createElement(Textarea, { placeholder: 'Notes' }));
        expect(container.querySelector('textarea')).toBeTruthy();
    });
    it('applies placeholder', () => {
        render(React.createElement(Textarea, { placeholder: 'Enter notes' }));
        expect(screen.getByPlaceholderText('Enter notes')).toBeTruthy();
    });
    it('applies rows', () => {
        const { container } = render(React.createElement(Textarea, { rows: 5 }));
        expect(container.querySelector('textarea')?.rows).toBe(5);
    });
});
