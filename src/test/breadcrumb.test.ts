/**
 * breadcrumb Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbEllipsis } from '@/components/ui/breadcrumb';

describe('breadcrumb', () => {
    it('exports Breadcrumb', () => {
        expect(Breadcrumb).toBeDefined();
    });
    it('exports BreadcrumbList', () => {
        expect(BreadcrumbList).toBeDefined();
    });
    it('exports BreadcrumbItem', () => {
        expect(BreadcrumbItem).toBeDefined();
    });
    it('exports BreadcrumbLink', () => {
        expect(BreadcrumbLink).toBeDefined();
    });
    it('exports BreadcrumbPage', () => {
        expect(BreadcrumbPage).toBeDefined();
    });
    it('exports BreadcrumbSeparator', () => {
        expect(BreadcrumbSeparator).toBeDefined();
    });
    it('exports BreadcrumbEllipsis', () => {
        expect(BreadcrumbEllipsis).toBeDefined();
    });
});
