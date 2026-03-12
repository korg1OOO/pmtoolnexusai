/**
 * table Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

import { Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption } from '@/components/ui/table';

describe('table', () => {
    it('exports Table', () => {
        expect(Table).toBeDefined();
    });
    it('exports TableHeader', () => {
        expect(TableHeader).toBeDefined();
    });
    it('exports TableBody', () => {
        expect(TableBody).toBeDefined();
    });
    it('exports TableFooter', () => {
        expect(TableFooter).toBeDefined();
    });
    it('exports TableRow', () => {
        expect(TableRow).toBeDefined();
    });
    it('exports TableHead', () => {
        expect(TableHead).toBeDefined();
    });
    it('exports TableCell', () => {
        expect(TableCell).toBeDefined();
    });
    it('exports TableCaption', () => {
        expect(TableCaption).toBeDefined();
    });
});
