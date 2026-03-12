/**
 * form Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

import { FormItem, FormLabel, FormControl, FormDescription, FormMessage, useFormField, Form, FormField } from '@/components/ui/form';

describe('form', () => {
    it('exports FormItem', () => {
        expect(FormItem).toBeDefined();
    });
    it('exports FormLabel', () => {
        expect(FormLabel).toBeDefined();
    });
    it('exports FormControl', () => {
        expect(FormControl).toBeDefined();
    });
    it('exports FormDescription', () => {
        expect(FormDescription).toBeDefined();
    });
    it('exports FormMessage', () => {
        expect(FormMessage).toBeDefined();
    });
    it('exports useFormField', () => {
        expect(useFormField).toBeDefined();
    });
    it('exports Form', () => {
        expect(Form).toBeDefined();
    });
    it('exports FormField', () => {
        expect(FormField).toBeDefined();
    });
});
