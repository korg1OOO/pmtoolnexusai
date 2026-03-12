/**
 * Admin Panel Layout
 * Main container for admin interface with sidebar navigation
 */

import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AdminPanel() {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    const handleBackToApp = () => {
        navigate('/dashboard');
    };

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-background">
            {/* Mobile Sidebar Overlay */}
            {mobileSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                    onClick={() => setMobileSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div
                className={cn(
                    "fixed lg:sticky top-0 left-0 h-screen z-50 transition-transform lg:transition-all",
                    mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
                    sidebarCollapsed ? "lg:w-20" : "lg:w-64"
                )}
            >
                <AdminSidebar
                    collapsed={sidebarCollapsed}
                    onCollapse={setSidebarCollapsed}
                    onBackToApp={handleBackToApp}
                />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Top Bar - Mobile only */}
                <div className="lg:hidden flex items-center justify-between p-4 border-b bg-card">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setMobileSidebarOpen(!mobileSidebarOpen)}
                    >
                        {mobileSidebarOpen ? (
                            <X className="h-5 w-5" />
                        ) : (
                            <Menu className="h-5 w-5" />
                        )}
                    </Button>
                    <h1 className="text-lg font-bold">Admin Panel</h1>
                    <Button variant="ghost" size="sm" onClick={handleBackToApp}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        App
                    </Button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
