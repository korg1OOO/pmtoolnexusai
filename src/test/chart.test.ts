/**
 * chart Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

import { ChartContainer, ChartTooltipContent, ChartLegendContent, ChartTooltip, ChartLegend, ChartStyle } from '@/components/ui/chart';

describe('chart', () => {
    it('exports ChartContainer', () => {
        expect(ChartContainer).toBeDefined();
    });
    it('exports ChartTooltipContent', () => {
        expect(ChartTooltipContent).toBeDefined();
    });
    it('exports ChartLegendContent', () => {
        expect(ChartLegendContent).toBeDefined();
    });
    it('exports ChartTooltip', () => {
        expect(ChartTooltip).toBeDefined();
    });
    it('exports ChartLegend', () => {
        expect(ChartLegend).toBeDefined();
    });
    it('exports ChartStyle', () => {
        expect(ChartStyle).toBeDefined();
    });
});
