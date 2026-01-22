import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  FolderKanban,
  CalendarDays,
  ListTodo,
  Users,
  FileText,
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: string | number;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'executive-dashboard', label: 'Executive Dashboard', icon: Sparkles },
  { id: 'strategic', label: 'Strategic Dashboard', icon: Target },
  { id: 'portfolio', label: 'Portfolio', icon: FolderKanban },
  { id: 'projects', label: 'Projects', icon: FolderKanban, badge: 3 },
  { 
    id: 'planning', 
    label: 'Planning', 
    icon: CalendarDays,
    children: [
      { id: 'project-plan', label: 'Project Plan', icon: ListTodo },
      { id: 'gantt', label: 'Gantt Chart', icon: GitBranch },
      { id: 'milestones', label: 'Milestones', icon: Target },
      { id: 'program-timeline', label: 'Program Timeline', icon: Clock },
    ]
  },
  {
    id: 'execution',
    label: 'Execution',
    icon: Briefcase,
    children: [
      { id: 'sprints', label: 'Sprints', icon: Clock },
      { id: 'backlog', label: 'Backlog', icon: ListTodo },
    ]
  },
  { id: 'meetings', label: 'AI Meetings', icon: Users, badge: 2 },
  { id: 'communications', label: 'Communications', icon: BarChart3 },
  { id: 'resources', label: 'Resources', icon: Users },
  { id: 'risks', label: 'Risks & Issues', icon: AlertTriangle, badge: 5 },
  { id: 'decisions', label: 'Decisions', icon: Target },
  { id: 'financials', label: 'Financials', icon: DollarSign },
  { id: 'notes', label: 'Notes', icon: BookOpen },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'presentations', label: 'Presentations', icon: Presentation },
];

interface SidebarProps {
  activeItem: string;
  onItemClick: (id: string) => void;
  className?: string;
}

export function Sidebar({ activeItem, onItemClick, className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['planning', 'execution']);

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
    );
  };

  const renderNavItem = (item: NavItem, depth = 0) => {
    const isActive = activeItem === item.id;
    const isExpanded = expandedGroups.includes(item.id);
    const hasChildren = item.children && item.children.length > 0;
    const Icon = item.icon;

    const itemContent = (
      <motion.button
        whileHover={{ x: 2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          if (hasChildren) {
            toggleGroup(item.id);
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
            {item.badge && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary/20 px-1.5 text-xs font-medium text-primary">
                {item.badge}
              </span>
            )}
            {hasChildren && (
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
            {item.badge && (
              <span className="rounded-full bg-primary/20 px-1.5 py-0.5 text-xs text-primary">
                {item.badge}
              </span>
            )}
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <div key={item.id}>
        {itemContent}
        {hasChildren && isExpanded && !collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-1 space-y-1"
          >
            {item.children!.map((child) => renderNavItem(child, depth + 1))}
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
        'flex flex-col h-full bg-sidebar border-r border-sidebar-border',
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
            <span className="font-semibold text-foreground">ProjectIQ</span>
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
        {navItems.map((item) => renderNavItem(item))}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-3">
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                'w-full justify-start gap-3',
                collapsed && 'justify-center px-2'
              )}
            >
              <Settings className="h-4 w-4" />
              {!collapsed && <span>Settings</span>}
            </Button>
          </TooltipTrigger>
          {collapsed && (
            <TooltipContent side="right">Settings</TooltipContent>
          )}
        </Tooltip>
      </div>
    </motion.aside>
  );
}
