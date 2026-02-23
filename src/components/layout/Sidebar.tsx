import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  FolderKanban,
  CalendarDays,
  ListTodo,
  Users,
  BarChart3,
  Target,
  AlertTriangle,
  DollarSign,
  Presentation,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  GitBranch,
  Clock,
  Sparkles,
  Shield,
  Building2,
  User,
  CheckCircle2,
  FileText,
  Lightbulb,
  MessageSquare,
  Calendar,
  Folder,
  TrendingUp,
  Brain,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useProjectContext, ModuleVisibility } from '@/contexts/ProjectContext';
import { preloadRoute } from '@/utils/routePreloader';
import { useSidebarBadges } from '@/hooks/useSidebarBadges';
import { CreditBalanceWidget } from '@/components/credits/CreditBalanceWidget';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
  children?: NavItem[];
  moduleKey?: keyof ModuleVisibility;
  alwaysShow?: boolean;
}

const navItems: NavItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: LayoutDashboard,
    children: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, moduleKey: 'dashboard' },
      { id: 'morning-briefing', label: 'Morning Briefing', icon: Sparkles, alwaysShow: true },
      { id: 'executive-dashboard', label: 'Executive Dashboard', icon: TrendingUp, moduleKey: 'dashboard' },
      { id: 'strategic-dashboard', label: 'Strategic Dashboard', icon: Brain, moduleKey: 'dashboard' },
      { id: 'portfolio', label: 'Portfolio', icon: FolderKanban, moduleKey: 'portfolio' },
      { id: 'program-timeline', label: 'Project Timeline', icon: Clock, moduleKey: 'programTimeline' },
      { id: 'reports', label: 'Reports', icon: BarChart3, moduleKey: 'reports' },
    ]
  },
  {
    id: 'initiation',
    label: 'Initiation',
    icon: Target,
    children: [
      { id: 'project-charter', label: 'Project Charter', icon: BookOpen, alwaysShow: true },
      { id: 'stakeholders', label: 'Stakeholder Register', icon: Users, alwaysShow: true },
      { id: 'timeline-planner', label: 'Timeline Planner', icon: Clock, alwaysShow: true },
    ]
  },
  {
    id: 'planning',
    label: 'Planning',
    icon: CalendarDays,
    children: [
      { id: 'project-plan', label: 'Project Plan', icon: ListTodo, moduleKey: 'projectPlan' },
      { id: 'child-plans', label: 'Child Plans', icon: ListTodo, moduleKey: 'childPlans' },
      { id: 'gantt', label: 'Gantt Chart', icon: GitBranch, moduleKey: 'gantt' },
      { id: 'child-gantt', label: 'Child Gantt', icon: GitBranch, moduleKey: 'childGantt' },
      { id: 'milestones', label: 'Milestones', icon: Target, moduleKey: 'milestones' },
      { id: 'scenarios', label: 'Scenarios', icon: GitBranch, alwaysShow: true },
      { id: 'deliverables', label: 'Deliverables', icon: Target, alwaysShow: true },
    ]
  },
  {
    id: 'execution',
    label: 'Execution',
    icon: Briefcase,
    children: [
      { id: 'sprints', label: 'Sprints', icon: Clock, moduleKey: 'sprints' },
      { id: 'backlog', label: 'Backlog', icon: ListTodo, moduleKey: 'backlog' },
      { id: 'actions', label: 'Actions', icon: Target, moduleKey: 'actions' },
    ]
  },
  {
    id: 'monitoring',
    label: 'Monitoring & Control',
    icon: AlertTriangle,
    children: [
      { id: 'risks', label: 'Risks', icon: AlertTriangle, moduleKey: 'risks' },
      { id: 'issues', label: 'Issues', icon: AlertTriangle, moduleKey: 'issues' },
      { id: 'decisions', label: 'Decisions', icon: Target, moduleKey: 'decisions' },
      { id: 'change-requests', label: 'Change Requests', icon: Target, alwaysShow: true },
      { id: 'traceability', label: 'Traceability Matrix', icon: GitBranch, moduleKey: 'traceability' },
      { id: 'requirements', label: 'Requirements Matrix', icon: GitBranch, alwaysShow: true },
    ]
  },
  {
    id: 'financials-menu',
    label: 'Financials',
    icon: DollarSign,
    children: [
      { id: 'financials', label: 'Budget & Billing', icon: DollarSign, moduleKey: 'financials' },
      { id: 'evm', label: 'Earned Value (EVM)', icon: BarChart3, alwaysShow: true },
      { id: 'timeline-slippage', label: 'Timeline Slippage', icon: TrendingUp, alwaysShow: true },
      { id: 'tracking', label: 'Baseline & Tracking', icon: Target, alwaysShow: true },
    ]
  },
  {
    id: 'closing',
    label: 'Closing',
    icon: CheckCircle2,
    children: [
      { id: 'final-report', label: 'Final Report', icon: FileText, alwaysShow: true },
      { id: 'lessons-learned', label: 'Lessons Learned', icon: Lightbulb, alwaysShow: true },
    ]
  },
  {
    id: 'collaboration',
    label: 'Collaboration',
    icon: Users,
    children: [
      { id: 'collaboration-dashboard', label: 'Collab Dashboard', icon: LayoutDashboard, alwaysShow: true },
      { id: 'meetings', label: 'AI Meetings', icon: Users, moduleKey: 'meetings' },
      { id: 'meeting-analytics', label: 'Meeting Analytics', icon: BarChart3, moduleKey: 'meetings' },
      { id: 'calendar', label: 'Calendar', icon: Calendar, alwaysShow: true },
      { id: 'collaboration-spaces', label: 'Collaboration Spaces', icon: Users, alwaysShow: true },
      { id: 'team-chat', label: 'Team Chat', icon: MessageSquare, alwaysShow: true },
      { id: 'communications', label: 'Communications', icon: BarChart3, moduleKey: 'communications' },
      { id: 'notes', label: 'Notes', icon: BookOpen, moduleKey: 'notes' },
      { id: 'documents', label: 'Document Center', icon: BookOpen, alwaysShow: true },
      { id: 'program-documents', label: 'Program Documents', icon: Folder, alwaysShow: true },
      { id: 'knowledge-base', label: 'Knowledge Base', icon: BookOpen, alwaysShow: true },
      { id: 'resources', label: 'Resources', icon: Users, moduleKey: 'resources' },
      { id: 'team-management', label: 'Team Management', icon: Users, alwaysShow: true },
      { id: 'presentations', label: 'Presentations', icon: Presentation, moduleKey: 'presentations' },
      { id: 'communication-intelligence', label: 'AI Intelligence', icon: BarChart3, alwaysShow: true },
    ]
  },
];

const adminItems: NavItem[] = [
  {
    id: 'administration',
    label: 'Administration',
    icon: Shield,
    children: [
      { id: 'admin-redirect', label: 'Platform Admin', icon: Building2, alwaysShow: true },
      { id: 'admin-project', label: 'Project Admin', icon: Settings, alwaysShow: true },
      { id: 'admin-templates', label: 'Templates Admin', icon: FolderKanban, alwaysShow: true },
    ]
  },
  {
    id: 'tenant-admin',
    label: 'Tenant Admin',
    icon: Building2,
    children: [
      { id: 'tenant', label: 'Tenant Dashboard', icon: LayoutDashboard, alwaysShow: true },
      { id: 'tenant/workspaces', label: 'Workspaces', icon: FolderKanban, alwaysShow: true },
      { id: 'tenant/users', label: 'User Management', icon: Users, alwaysShow: true },
      { id: 'tenant/departments', label: 'Departments', icon: GitBranch, alwaysShow: true },
      { id: 'tenant/licenses', label: 'Licenses', icon: Shield, alwaysShow: true },
      { id: 'tenant/analytics', label: 'Analytics', icon: BarChart3, alwaysShow: true },
      { id: 'tenant/settings', label: 'Settings', icon: Settings, alwaysShow: true },
    ]
  },
  {
    id: 'workspace-admin',
    label: 'Workspace Admin',
    icon: FolderKanban,
    children: [
      { id: 'workspace-select', label: 'Select Workspace', icon: FolderKanban, alwaysShow: true },
    ]
  },
  {
    id: 'portfolio-admin',
    label: 'Portfolio Admin',
    icon: Briefcase,
    children: [
      { id: 'portfolio-select', label: 'Select Portfolio', icon: Briefcase, alwaysShow: true },
    ]
  },
  {
    id: 'program-admin',
    label: 'Program Admin',
    icon: GitBranch,
    children: [
      { id: 'program-select', label: 'Select Program', icon: GitBranch, alwaysShow: true },
    ]
  },
  {
    id: 'ai-credits',
    label: 'AI Credits',
    icon: Sparkles,
    children: [
      { id: 'purchase-credits', label: 'Purchase Credits', icon: DollarSign, alwaysShow: true },
      { id: 'usage-dashboard', label: 'Usage Dashboard', icon: BarChart3, alwaysShow: true },
      { id: 'auto-recharge', label: 'Auto-Recharge', icon: Target, alwaysShow: true },
    ]
  },
  { id: 'settings', label: 'Settings', icon: User, alwaysShow: true },
];

interface SidebarProps {
  activeItem: string;
  onItemClick: (id: string) => void;
  className?: string;
}

const ROUTE_PREFIXES = ['tenant', 'settings'];

const isRouteBasedItem = (id: string): boolean => {
  return ROUTE_PREFIXES.some(prefix => id === prefix || id.startsWith(prefix + '/'));
};

export function Sidebar({ activeItem, onItemClick, className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(true);
  const { isModuleVisible, settings } = useProjectContext();
  const navigate = useNavigate();
  const { data: badges } = useSidebarBadges(settings?.id);

  // Find which group contains the active item
  const findParentGroup = useMemo(() => {
    const allGroups = [...navItems, ...adminItems];
    for (const group of allGroups) {
      if (group.children?.some(child => child.id === activeItem)) {
        return group.id;
      }
    }
    return null;
  }, [activeItem]);

  // Only expand the group containing the active page
  const [expandedGroups, setExpandedGroups] = useState<string[]>(() =>
    findParentGroup ? [findParentGroup] : []
  );

  // Update expanded group when active item changes
  useEffect(() => {
    if (findParentGroup && !expandedGroups.includes(findParentGroup)) {
      setExpandedGroups([findParentGroup]);
    }
  }, [findParentGroup]);

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const isItemVisible = (item: NavItem): boolean => {
    if (item.alwaysShow) return true;
    if (!item.moduleKey) return true;
    return isModuleVisible(item.moduleKey);
  };

  const filterVisibleChildren = (children?: NavItem[]): NavItem[] | undefined => {
    if (!children) return undefined;
    return children.filter(isItemVisible);
  };

  const renderNavItem = (item: NavItem, depth = 0) => {
    if (!isItemVisible(item)) return null;

    const visibleChildren = filterVisibleChildren(item.children);
    const hasVisibleChildren = visibleChildren && visibleChildren.length > 0;

    // If this is a group and no children are visible, hide the group
    if (item.children && !hasVisibleChildren) return null;

    const isActive = activeItem === item.id;
    const isExpanded = expandedGroups.includes(item.id);
    const Icon = item.icon;

    // Resolve dynamic badge count for live items
    const liveBadge = badges
      ? item.id === 'actions' ? (badges.actions > 0 ? badges.actions : undefined)
        : item.id === 'risks' ? (badges.risks > 0 ? badges.risks : undefined)
          : item.id === 'issues' ? (badges.issues > 0 ? badges.issues : undefined)
            : item.id === 'meetings' ? (badges.meetings > 0 ? badges.meetings : undefined)
              : item.badge
      : item.badge;

    const itemContent = (
      <motion.button
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.98 }}
        onMouseEnter={() => {
          // Preload route on hover
          if (item.id === 'admin-redirect') {
            preloadRoute('/admin');
          } else if (item.id === 'workspace-select') {
            preloadRoute('/tenant/workspaces');
          } else if (item.id === 'portfolio-select') {
            preloadRoute('/portfolio');
          } else if (item.id === 'program-select') {
            preloadRoute('/program');
          } else if (isRouteBasedItem(item.id)) {
            preloadRoute('/' + item.id);
          } else {
            preloadRoute('/' + item.id);
          }
        }}
        onFocus={() => {
          // Preload route on focus (keyboard navigation)
          if (item.id === 'admin-redirect') {
            preloadRoute('/admin');
          } else if (item.id === 'workspace-select') {
            preloadRoute('/tenant/workspaces');
          } else if (item.id === 'portfolio-select') {
            preloadRoute('/portfolio');
          } else if (item.id === 'program-select') {
            preloadRoute('/program');
          } else if (isRouteBasedItem(item.id)) {
            preloadRoute('/' + item.id);
          } else {
            preloadRoute('/' + item.id);
          }
        }}
        onClick={() => {
          if (hasVisibleChildren) {
            if (collapsed) {
              setCollapsed(false);
              if (!expandedGroups.includes(item.id)) {
                setExpandedGroups((prev) => [...prev, item.id]);
              }
            } else {
              toggleGroup(item.id);
            }
          } else if (item.id === 'admin-redirect') {
            navigate('/admin');
          } else if (item.id === 'workspace-select') {
            navigate('/tenant/workspaces');
          } else if (item.id === 'portfolio-select') {
            navigate('/portfolio');
          } else if (item.id === 'program-select') {
            navigate('/program');
          } else if (isRouteBasedItem(item.id)) {
            navigate('/' + item.id);
          } else {
            onItemClick(item.id);
          }
        }}
        className={cn(
          'flex items-center w-full gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
          'text-sidebar-foreground hover:text-sidebar-accent-foreground',
          isActive
            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
            : 'hover:bg-sidebar-accent/50',
          depth > 0 && 'ml-4 pl-6 border-l border-sidebar-border'
        )}
      >
        <Icon className={cn('h-4 w-4 shrink-0', isActive && 'text-primary')} />
        {!collapsed && (
          <>
            <span className="flex-1 text-left truncate">{item.label}</span>
            {liveBadge !== undefined && liveBadge !== null && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/20 px-1.5 text-xs font-medium text-primary">
                {liveBadge}
              </span>
            )}
            {hasVisibleChildren && (
              <ChevronRight
                className={cn(
                  'h-4 w-4 transition-transform duration-200',
                  isExpanded && 'rotate-90'
                )}
              />
            )}
          </>
        )}
      </motion.button>
    );

    if (collapsed) {
      return (
        <Tooltip key={item.id} delayDuration={0}>
          <TooltipTrigger asChild>{itemContent}</TooltipTrigger>
          <TooltipContent side="right" className="flex items-center gap-2">
            {item.label}
            {liveBadge !== undefined && liveBadge !== null && (
              <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-xs text-primary">
                {liveBadge}
              </span>
            )}
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <div key={item.id}>
        {itemContent}
        {hasVisibleChildren && isExpanded && !collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-1 space-y-1"
          >
            {visibleChildren!.map((child) => renderNavItem(child, depth + 1))}
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 256 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className={cn(
        'flex flex-col h-full bg-sidebar border-r border-sidebar-border z-20 relative',
        className
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">ProjectOye</span>
          </motion.div>
        )}
        <Button
          variant="ghost"
          size="iconSm"
          onClick={() => setCollapsed(!collapsed)}
          className="shrink-0"
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {/* Projects Button */}
        <div className="mb-4">
          <Button
            className={cn(
              "w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-all",
              collapsed ? "justify-center px-0 h-10" : "justify-start gap-2 h-10 px-3"
            )}
            onClick={() => {
              if (collapsed) setCollapsed(false);
              navigate('/projects');
            }}
          >
            <FolderKanban className={cn("shrink-0", collapsed ? "h-5 w-5" : "h-4 w-4")} />
            {!collapsed && <span className="font-semibold">Projects</span>}
          </Button>
        </div>

        {navItems.map((item) => renderNavItem(item))}

        {/* Separator */}
        <div className="my-4 border-t border-sidebar-border" />

        {/* Admin Items */}
        {adminItems.map((item) => renderNavItem(item))}
      </nav>

      {/* Low Credits widget — pinned to sidebar bottom */}
      <div className={`border-t border-sidebar-border p-3 ${collapsed ? 'flex justify-center' : ''}`}>
        <CreditBalanceWidget compact showPurchaseButton={!collapsed} />
      </div>
    </motion.aside>
  );
}
