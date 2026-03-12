// @vitest-environment jsdom
/**
 * Tests batch 58: React UI render — Avatar, Alert, RadioGroup, ToggleGroup
 */
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

describe('Avatar component', () => {
    it('renders with fallback', () => {
        render(
            React.createElement(Avatar, null,
                React.createElement(AvatarFallback, null, 'JD')
            )
        );
        expect(screen.getByText('JD')).toBeTruthy();
    });
    it('renders with image', () => {
        const { container } = render(
            React.createElement(Avatar, null,
                React.createElement(AvatarImage, { src: 'https://example.com/avatar.jpg', alt: 'User' }),
                React.createElement(AvatarFallback, null, 'U')
            )
        );
        expect(container.firstChild).toBeTruthy();
    });
    it('renders multiple avatars', () => {
        const { container } = render(
            React.createElement('div', null,
                React.createElement(Avatar, null, React.createElement(AvatarFallback, null, 'A')),
                React.createElement(Avatar, null, React.createElement(AvatarFallback, null, 'B')),
                React.createElement(Avatar, null, React.createElement(AvatarFallback, null, 'C'))
            )
        );
        expect(screen.getByText('A')).toBeTruthy();
        expect(screen.getByText('C')).toBeTruthy();
    });
});

describe('Alert component', () => {
    it('renders default alert', () => {
        render(
            React.createElement(Alert, null,
                React.createElement(AlertTitle, null, 'Heads up!'),
                React.createElement(AlertDescription, null, 'You can add components to your app.')
            )
        );
        expect(screen.getByText('Heads up!')).toBeTruthy();
        expect(screen.getByText('You can add components to your app.')).toBeTruthy();
    });
    it('renders destructive alert', () => {
        render(
            React.createElement(Alert, { variant: 'destructive' } as any,
                React.createElement(AlertTitle, null, 'Error'),
                React.createElement(AlertDescription, null, 'Something went wrong.')
            )
        );
        expect(screen.getByText('Error')).toBeTruthy();
    });
});

describe('RadioGroup component', () => {
    it('renders radio options', () => {
        render(
            React.createElement(RadioGroup, { defaultValue: 'option1' } as any,
                React.createElement('div', null,
                    React.createElement(RadioGroupItem, { value: 'option1', id: 'opt1' }),
                    React.createElement('label', { htmlFor: 'opt1' }, 'Option 1')
                ),
                React.createElement('div', null,
                    React.createElement(RadioGroupItem, { value: 'option2', id: 'opt2' }),
                    React.createElement('label', { htmlFor: 'opt2' }, 'Option 2')
                )
            )
        );
        expect(screen.getByText('Option 1')).toBeTruthy();
        expect(screen.getByText('Option 2')).toBeTruthy();
    });
});

describe('ToggleGroup component', () => {
    it('renders toggle group items', () => {
        render(
            React.createElement(ToggleGroup, { type: 'single' } as any,
                React.createElement(ToggleGroupItem, { value: 'bold' } as any, 'B'),
                React.createElement(ToggleGroupItem, { value: 'italic' } as any, 'I'),
                React.createElement(ToggleGroupItem, { value: 'underline' } as any, 'U')
            )
        );
        expect(screen.getByText('B')).toBeTruthy();
        expect(screen.getByText('I')).toBeTruthy();
        expect(screen.getByText('U')).toBeTruthy();
    });
    it('renders multiple type toggle group', () => {
        render(
            React.createElement(ToggleGroup, { type: 'multiple' } as any,
                React.createElement(ToggleGroupItem, { value: 'a' } as any, 'X'),
                React.createElement(ToggleGroupItem, { value: 'b' } as any, 'Y')
            )
        );
        expect(screen.getByText('X')).toBeTruthy();
        expect(screen.getByText('Y')).toBeTruthy();
    });
});
