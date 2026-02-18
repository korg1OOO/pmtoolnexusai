import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Bell,
  X,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Info,
  Mail,
  Settings,
  Trash2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, useDeleteNotification, useNotificationsRealtime, type Notification } from '@/hooks/useNotifications';

const typeConfig: Record<string, { icon: React.ElementType; color: string }> = {
  sla_breach: { icon: AlertTriangle, color: 'text-destructive bg-destructive/10' },
  sla_warning: { icon: Clock, color: 'text-warning bg-warning/10' },
  action_overdue: { icon: Clock, color: 'text-orange-500 bg-orange-500/10' },
  sync_failed: { icon: X, color: 'text-destructive bg-destructive/10' },
  mention: { icon: Mail, color: 'text-primary bg-primary/10' },
  info: { icon: Info, color: 'text-info bg-info/10' },
};

interface NotificationItemProps {
  notification: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}

function NotificationItem({ notification, onRead, onDelete }: NotificationItemProps) {
  const config = typeConfig[notification.type] ?? { icon: Info, color: 'text-muted-foreground bg-muted/10' };
  const Icon = config.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className={cn(
        'p-4 border-b last:border-b-0 hover:bg-muted/30 transition-colors group',
        !notification.is_read && 'bg-primary/5'
      )}
    >
      <div className="flex items-start gap-3">
        <div className={cn('h-10 w-10 rounded-full flex items-center justify-center shrink-0', config.color)}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h4 className={cn('text-sm font-medium', !notification.is_read && 'font-semibold')}>
              {notification.title}
            </h4>
            <span className="text-xs text-muted-foreground">
              {new Date(notification.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2">{notification.message}</p>
          {notification.related_item_type && (
            <Button variant="link" size="sm" className="h-6 p-0 text-xs mt-1">
              View {notification.related_item_type}: {notification.related_item_id}
            </Button>
          )}
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!notification.is_read && (
            <Button variant="ghost" size="iconXs" onClick={() => onRead(notification.id)}>
              <Eye className="h-3 w-3" />
            </Button>
          )}
          <Button variant="ghost" size="iconXs" onClick={() => onDelete(notification.id)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

export function NotificationCenter() {
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'sla' | 'actions'>('all');

  // Fetch notifications with filter
  const { data: notifications = [], isLoading } = useNotifications(activeTab === 'all' ? undefined : activeTab);

  // Mutations
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotification = useDeleteNotification();

  // Enable real-time updates
  useNotificationsRealtime();

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleRead = (id: string) => {
    markRead.mutate(id);
  };

  const handleDelete = (id: string) => {
    deleteNotification.mutate(id);
  };

  const handleMarkAllRead = () => {
    markAllRead.mutate();
  };

  // Filtering is now done in the query, so we use all notifications
  const filteredNotifications = notifications;

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="iconSm" className="relative">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-medium flex items-center justify-center"
            >
              {unreadCount}
            </motion.span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-96 p-0">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </SheetTitle>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={handleMarkAllRead}>
                  Mark all read
                </Button>
              )}
              <Button variant="ghost" size="iconSm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as typeof activeTab)} className="flex flex-col h-[calc(100vh-80px)]">
          <TabsList className="w-full justify-start rounded-none border-b px-2">
            <TabsTrigger value="all">
              All
              {notifications.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-xs">{notifications.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="unread">
              Unread
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs">{unreadCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="sla">SLA</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            <TabsContent value={activeTab} className="m-0">
              <AnimatePresence mode="popLayout">
                {filteredNotifications.length > 0 ? (
                  filteredNotifications.map(notification => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onRead={handleRead}
                      onDelete={handleDelete}
                    />
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                    <Bell className="h-12 w-12 mb-4 opacity-30" />
                    <p>No notifications</p>
                  </div>
                )}
              </AnimatePresence>
            </TabsContent>
          </ScrollArea>

          {/* Email Preferences Footer */}
          <div className="p-4 border-t bg-muted/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Email notifications</span>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
