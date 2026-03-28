/**
 * navigation-menu Component Tests
 */
import { describe, it, expect, vi } from 'vitest';

import { NavigationMenu, NavigationMenuList, NavigationMenuTrigger, NavigationMenuContent, NavigationMenuViewport, NavigationMenuIndicator, navigationMenuTriggerStyle, NavigationMenuItem, NavigationMenuLink } from '@/components/ui/navigation-menu';

describe('navigation-menu', () => {
    it('exports NavigationMenu', () => {
        expect(NavigationMenu).toBeDefined();
    });
    it('exports NavigationMenuList', () => {
        expect(NavigationMenuList).toBeDefined();
    });
    it('exports NavigationMenuTrigger', () => {
        expect(NavigationMenuTrigger).toBeDefined();
    });
    it('exports NavigationMenuContent', () => {
        expect(NavigationMenuContent).toBeDefined();
    });
    it('exports NavigationMenuViewport', () => {
        expect(NavigationMenuViewport).toBeDefined();
    });
    it('exports NavigationMenuIndicator', () => {
        expect(NavigationMenuIndicator).toBeDefined();
    });
    it('exports navigationMenuTriggerStyle', () => {
        expect(navigationMenuTriggerStyle).toBeDefined();
    });
    it('exports NavigationMenuItem', () => {
        expect(NavigationMenuItem).toBeDefined();
    });
    it('exports NavigationMenuLink', () => {
        expect(NavigationMenuLink).toBeDefined();
    });
});
