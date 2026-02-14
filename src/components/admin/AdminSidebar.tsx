/**
 * Admin Sidebar Navigation
 * Dark-themed sidebar with admin navigation items
 */

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    Activity,
    Bot,
    Users,
    Crown,
    FileText,
    Key,
    ShieldCheck,
    CreditCard,
    Percent,
    UserCog,
    MessageSquare,
    BarChart3,
    Mail as MailIcon,
    Megaphone,
    Users2,
    Database,
    ChevronLeft,
    ArrowLeft,
    Brain,
    Building2,
    Shield,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';

interface AdminSidebarProps {
    collapsed: boolean;
    onCollapse: (collapsed: boolean) => void;
    onBackToApp: () => void;
}

interface NavItem {
    id: string;
    label: string;
    icon: React.ElementType;
    path: string;
}

const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/admin' },
    { id: 'health', label: 'Health Check', icon: Activity, path: '/admin/health' },
    { id: 'ai-usage', label: 'AI Usage & Costs', icon: Bot, path: '/admin/ai-usage' },
    { id: 'ml-models', label: 'ML Models', icon: Brain, path: '/admin/ml' },
    { id: 'users', label: 'Users', icon: Users, path: '/admin/users' },
    { id: 'pro-users', label: 'Pro Users', icon: Crown, path: '/admin/pro-users' },
    { id: 'organizations', label: 'Organizations', icon: Building2, path: '/admin/organizations' },
    { id: 'content', label: 'Content Management', icon: FileText, path: '/admin/content' },
    { id: 'licenses', label: 'License Keys', icon: Key, path: '/admin/licenses' },
    { id: 'security-settings', label: 'Security Settings', icon: Shield, path: '/admin/security' },
    { id: 'api-keys', label: 'API Keys', icon: Key, path: '/admin/api-keys' },
    { id: 'audit-logs', label: 'Audit Logs', icon: FileText, path: '/admin/audit-logs' },
    { id: 'security', label: 'Security & Audit', icon: ShieldCheck, path: '/admin/management' },
    { id: 'billing', label: 'Billing', icon: CreditCard, path: '/admin/billing' },
    { id: 'discounts', label: 'Discount Codes', icon: Percent, path: '/admin/discounts' },
    { id: 'admin-mgmt', label: 'Admin Management', icon: UserCog, path: '/admin/management' },
    { id: 'requests', label: 'Requests & Issues', icon: MessageSquare, path: '/admin/requests' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, path: '/admin/analytics' },
    { id: 'marketing', label: 'Marketing', icon: Megaphone, path: '/admin/marketing' },
    { id: 'email', label: 'Email Automation', icon: MailIcon, path: '/admin/email' },
    { id: 'affiliates', label: 'Affiliates', icon: Users2, path: '/admin/affiliates' },
    { id: 'backups', label: 'Database Backups', icon: Database, path: '/admin/backups' },
    { id: 'migration', label: 'Database Migration', icon: Database, path: '/admin/migration' },
];

export function AdminSidebar({ collapsed, onCollapse, onBackToApp }: AdminSidebarProps) {
    const location = useLocation();

    const isActive = (path: string) => {
        if (path === '/admin') {
            return location.pathname === '/admin';
        }
        return location.pathname.startsWith(path);
    };

    return (
        <div className="h-full flex flex-col bg-slate-900 text-slate-100 border-r border-slate-800">
            {/* Header */}
            <div className="p-4 flex items-center justify-between border-b border-slate-800">
                {!collapsed && (
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                            <ShieldCheck className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <span className="font-bold text-lg">Admin Panel</span>
                    </div>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    className="text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                    onClick={() => onCollapse(!collapsed)}
                >
                    <ChevronLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
                </Button>
            </div>

            {/* Back to App Button */}
            {!collapsed && (
                <div className="p-4">
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full justify-start border-slate-700 hover:bg-slate-800"
                        onClick={onBackToApp}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to App
                    </Button>
                </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.path);

                    return (
                        <Link
                            key={item.id}
                            to={item.path}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                                "hover:bg-slate-800",
                                active
                                    ? "bg-primary text-primary-foreground"
                                    : "text-slate-300 hover:text-slate-100",
                                collapsed && "justify-center"
                            )}
                            title={collapsed ? item.label : undefined}
                        >
                            <Icon className={cn("h-5 w-5 flex-shrink-0", collapsed && "h-6 w-6")} />
                            {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                        </Link>
                    );
                })}
            </nav>

            {/* Footer - User Info */}
            {!collapsed && (
                <>
                    <Separator className="bg-slate-800" />
                    <div className="p-4">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                                <AvatarImage src="" />
                                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                    AD
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">Admin User</div>
                                <div className="text-xs text-slate-400 truncate">admin@projectoye.com</div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
