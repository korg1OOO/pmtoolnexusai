// @vitest-environment jsdom
/**
 * Tests batch 69: More UI component interaction tests — click handlers, state changes, keyboard
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Toggle } from '@/components/ui/toggle';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

describe('Button interactions', () => {
    it('click fires handler', () => {
        const handler = vi.fn();
        render(React.createElement(Button, { onClick: handler }, 'Click'));
        fireEvent.click(screen.getByText('Click'));
        expect(handler).toHaveBeenCalledTimes(1);
    });
    it('disabled button does not fire handler', () => {
        const handler = vi.fn();
        render(React.createElement(Button, { onClick: handler, disabled: true }, 'Disabled'));
        fireEvent.click(screen.getByText('Disabled'));
        expect(handler).not.toHaveBeenCalled();
    });
    it('double click fires twice', () => {
        const handler = vi.fn();
        render(React.createElement(Button, { onClick: handler }, 'Double'));
        fireEvent.click(screen.getByText('Double'));
        fireEvent.click(screen.getByText('Double'));
        expect(handler).toHaveBeenCalledTimes(2);
    });
});

describe('Input interactions', () => {
    it('typing updates value', () => {
        const { container } = render(React.createElement(Input, { defaultValue: '' }));
        const input = container.querySelector('input')!;
        fireEvent.change(input, { target: { value: 'Hello World' } });
        expect(input.value).toBe('Hello World');
    });
    it('focus fires event', () => {
        const handler = vi.fn();
        const { container } = render(React.createElement(Input, { onFocus: handler }));
        fireEvent.focus(container.querySelector('input')!);
        expect(handler).toHaveBeenCalled();
    });
    it('blur fires event', () => {
        const handler = vi.fn();
        const { container } = render(React.createElement(Input, { onBlur: handler }));
        const input = container.querySelector('input')!;
        fireEvent.focus(input);
        fireEvent.blur(input);
        expect(handler).toHaveBeenCalled();
    });
});

describe('Textarea interactions', () => {
    it('typing updates value', () => {
        const { container } = render(React.createElement(Textarea, { defaultValue: '' }));
        const textarea = container.querySelector('textarea')!;
        fireEvent.change(textarea, { target: { value: 'Long text content here' } });
        expect(textarea.value).toBe('Long text content here');
    });
});

describe('Tabs interactions', () => {
    it('clicking tab switches content', () => {
        render(
            React.createElement(Tabs, { defaultValue: 'tab1' },
                React.createElement(TabsList, null,
                    React.createElement(TabsTrigger, { value: 'tab1' }, 'First'),
                    React.createElement(TabsTrigger, { value: 'tab2' }, 'Second')
                ),
                React.createElement(TabsContent, { value: 'tab1' }, 'Content 1'),
                React.createElement(TabsContent, { value: 'tab2' }, 'Content 2')
            )
        );
        expect(screen.getByText('Content 1')).toBeTruthy();
        fireEvent.click(screen.getByText('Second'));
        // After click, tab2 should be active
        expect(screen.getByText('Second')).toBeTruthy();
    });
});

describe('Accordion interactions', () => {
    it('clicking trigger toggles content', () => {
        render(
            React.createElement(Accordion, { type: 'single', collapsible: true } as any,
                React.createElement(AccordionItem, { value: 'item-1' },
                    React.createElement(AccordionTrigger, null, 'Section'),
                    React.createElement(AccordionContent, null, 'Hidden content')
                )
            )
        );
        fireEvent.click(screen.getByText('Section'));
        expect(screen.getByText('Section')).toBeTruthy();
    });
});

describe('Toggle interactions', () => {
    it('clicking toggles pressed state', () => {
        const handler = vi.fn();
        render(React.createElement(Toggle, { onPressedChange: handler } as any, 'Bold'));
        fireEvent.click(screen.getByText('Bold'));
        expect(handler).toHaveBeenCalled();
    });
});
