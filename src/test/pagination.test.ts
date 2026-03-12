/**
 * pagination Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

import { PaginationContent, PaginationItem, Pagination, PaginationEllipsis, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';

describe('pagination', () => {
    it('exports PaginationContent', () => {
        expect(PaginationContent).toBeDefined();
    });
    it('exports PaginationItem', () => {
        expect(PaginationItem).toBeDefined();
    });
    it('exports Pagination', () => {
        expect(Pagination).toBeDefined();
    });
    it('exports PaginationEllipsis', () => {
        expect(PaginationEllipsis).toBeDefined();
    });
    it('exports PaginationLink', () => {
        expect(PaginationLink).toBeDefined();
    });
    it('exports PaginationNext', () => {
        expect(PaginationNext).toBeDefined();
    });
    it('exports PaginationPrevious', () => {
        expect(PaginationPrevious).toBeDefined();
    });
});
