/**
 * sidebar Tests
 */
import { describe, it, expect, vi } from 'vitest';

import { SidebarProvider, Sidebar, SidebarTrigger, SidebarRail, SidebarInset, SidebarInput, SidebarHeader, SidebarFooter, SidebarSeparator, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarGroupAction, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuAction, SidebarMenuBadge, SidebarMenuSkeleton, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton, useSidebar } from '@/components/ui/sidebar';

describe('sidebar', () => {
    it('exports SidebarProvider', () => {
        expect(SidebarProvider).toBeDefined();
    });
    it('exports Sidebar', () => {
        expect(Sidebar).toBeDefined();
    });
    it('exports SidebarTrigger', () => {
        expect(SidebarTrigger).toBeDefined();
    });
    it('exports SidebarRail', () => {
        expect(SidebarRail).toBeDefined();
    });
    it('exports SidebarInset', () => {
        expect(SidebarInset).toBeDefined();
    });
    it('exports SidebarInput', () => {
        expect(SidebarInput).toBeDefined();
    });
    it('exports SidebarHeader', () => {
        expect(SidebarHeader).toBeDefined();
    });
    it('exports SidebarFooter', () => {
        expect(SidebarFooter).toBeDefined();
    });
    it('exports SidebarSeparator', () => {
        expect(SidebarSeparator).toBeDefined();
    });
    it('exports SidebarContent', () => {
        expect(SidebarContent).toBeDefined();
    });
    it('exports SidebarGroup', () => {
        expect(SidebarGroup).toBeDefined();
    });
    it('exports SidebarGroupLabel', () => {
        expect(SidebarGroupLabel).toBeDefined();
    });
    it('exports SidebarGroupAction', () => {
        expect(SidebarGroupAction).toBeDefined();
    });
    it('exports SidebarGroupContent', () => {
        expect(SidebarGroupContent).toBeDefined();
    });
    it('exports SidebarMenu', () => {
        expect(SidebarMenu).toBeDefined();
    });
    it('exports SidebarMenuItem', () => {
        expect(SidebarMenuItem).toBeDefined();
    });
    it('exports SidebarMenuButton', () => {
        expect(SidebarMenuButton).toBeDefined();
    });
    it('exports SidebarMenuAction', () => {
        expect(SidebarMenuAction).toBeDefined();
    });
    it('exports SidebarMenuBadge', () => {
        expect(SidebarMenuBadge).toBeDefined();
    });
    it('exports SidebarMenuSkeleton', () => {
        expect(SidebarMenuSkeleton).toBeDefined();
    });
    it('exports SidebarMenuSub', () => {
        expect(SidebarMenuSub).toBeDefined();
    });
    it('exports SidebarMenuSubItem', () => {
        expect(SidebarMenuSubItem).toBeDefined();
    });
    it('exports SidebarMenuSubButton', () => {
        expect(SidebarMenuSubButton).toBeDefined();
    });
    it('exports useSidebar', () => {
        expect(useSidebar).toBeDefined();
    });
});
