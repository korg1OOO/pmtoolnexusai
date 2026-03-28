// @vitest-environment jsdom
/**
 * Tests batch 81: More UI variations — exercise different prop combinations
 * to maximize branch coverage gains
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

describe('Button all variants', () => {
    const variants = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link'] as const;
    for (const v of variants) {
        it(`renders ${v} variant`, () => {
            const { container } = render(React.createElement(Button, { variant: v } as any, `${v} button`));
            expect(screen.getByText(`${v} button`)).toBeTruthy();
        });
    }
});

describe('Button all sizes', () => {
    const sizes = ['default', 'sm', 'lg', 'icon'] as const;
    for (const s of sizes) {
        it(`renders ${s} size`, () => {
            const { container } = render(React.createElement(Button, { size: s } as any, s === 'icon' ? '⚙' : `${s} button`));
            expect(container.firstChild).toBeTruthy();
        });
    }
});

describe('Badge all variants', () => {
    const variants = ['default', 'secondary', 'destructive', 'outline'] as const;
    for (const v of variants) {
        it(`renders ${v} variant`, () => {
            const { container } = render(React.createElement(Badge, { variant: v } as any, `${v} badge`));
            expect(screen.getByText(`${v} badge`)).toBeTruthy();
        });
    }
});

describe('Alert all variants', () => {
    it('renders default alert', () => {
        render(React.createElement(Alert, null,
            React.createElement(AlertTitle, null, 'Default'),
            React.createElement(AlertDescription, null, 'Default alert')
        ));
        expect(screen.getByText('Default')).toBeTruthy();
    });
    it('renders destructive alert', () => {
        render(React.createElement(Alert, { variant: 'destructive' } as any,
            React.createElement(AlertTitle, null, 'Error'),
            React.createElement(AlertDescription, null, 'Something went wrong')
        ));
        expect(screen.getByText('Error')).toBeTruthy();
    });
});

describe('Progress all values', () => {
    const values = [0, 25, 50, 75, 100];
    for (const v of values) {
        it(`renders ${v}% progress`, () => {
            const { container } = render(React.createElement(Progress, { value: v }));
            expect(container.firstChild).toBeTruthy();
        });
    }
});

describe('Input all states', () => {
    it('renders disabled input', () => {
        const { container } = render(React.createElement(Input, { disabled: true, placeholder: 'Disabled' }));
        expect(container.querySelector('input:disabled')).toBeTruthy();
    });
    it('renders readonly input', () => {
        const { container } = render(React.createElement(Input, { readOnly: true, value: 'Read only' }));
        expect(container.querySelector('input[readonly]')).toBeTruthy();
    });
    it('renders required input', () => {
        const { container } = render(React.createElement(Input, { required: true }));
        expect(container.querySelector('input[required]')).toBeTruthy();
    });
});

describe('Card minimal patterns', () => {
    it('renders header-only card', () => {
        render(React.createElement(Card, null, React.createElement(CardHeader, null, React.createElement(CardTitle, null, 'Title Only'))));
        expect(screen.getByText('Title Only')).toBeTruthy();
    });
    it('renders footer-only card', () => {
        render(React.createElement(Card, null, React.createElement(CardFooter, null, React.createElement(Button, null, 'Action'))));
        expect(screen.getByText('Action')).toBeTruthy();
    });
    it('renders description card', () => {
        render(React.createElement(Card, null,
            React.createElement(CardHeader, null,
                React.createElement(CardTitle, null, 'With Desc'),
                React.createElement(CardDescription, null, 'A description')
            )
        ));
        expect(screen.getByText('A description')).toBeTruthy();
    });
});
