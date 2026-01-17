import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Plus,
  Filter,
  Search,
  MoreHorizontal,
  User,
  MessageSquare,
  Link2,
  Clock,
  Flame,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { mockSprintItems, mockSprint } from '@/data/mockData';
import type { SprintItem, SprintStatus } from '@/types/project';

const columns: { id: SprintStatus; label: string; color: string }[] = [
  { id: 'todo', label: 'To Do', color: 'bg-muted' },
  { id: 'in-progress', label: 'In Progress', color: 'bg-primary' },
  { id: 'review', label: 'In Review', color: 'bg-purple-500' },
  { id: 'done', label: 'Done', color: 'bg-success' },
];

interface SprintCardProps {
  item: SprintItem;
}

function SprintCard({ item }: SprintCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2 }}
      className="p-3 bg-card rounded-lg border shadow-sm hover:shadow-md transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <Badge variant={item.type as any} className="text-[10px]">
          {item.type.replace('-', ' ')}
        </Badge>
        <Button variant="ghost" size="iconXs" className="opacity-0 group-hover:opacity-100 transition-opacity">
          <MoreHorizontal className="h-3 w-3" />
        </Button>
      </div>

      <p className="text-sm font-medium mb-2 line-clamp-2">{item.title}</p>

      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-muted-foreground font-mono">{item.key}</span>
        {item.priority === 'critical' && (
          <Flame className="h-3 w-3 text-destructive" />
        )}
      </div>

      {item.labels.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {item.labels.slice(0, 2).map((label) => (
            <span
              key={label}
              className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground"
            >
              {label}
            </span>
          ))}
          {item.labels.length > 2 && (
            <span className="text-[10px] text-muted-foreground">
              +{item.labels.length - 2}
            </span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <div className="flex items-center gap-2">
          {item.assignee ? (
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-[10px] bg-primary/20 text-primary">
                {item.assignee
                  .split(' ')
                  .map((n) => n[0])
                  .join('')}
              </AvatarFallback>
            </Avatar>
          ) : (
            <div className="h-5 w-5 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
              <User className="h-3 w-3 text-muted-foreground/50" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {item.storyPoints && (
            <span className="text-xs font-medium bg-muted px-1.5 py-0.5 rounded">
              {item.storyPoints}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function SprintBoardView() {
  const [searchQuery, setSearchQuery] = useState('');

  const getColumnItems = (status: SprintStatus) =>
    mockSprintItems.filter(
      (item) =>
        item.status === status &&
        (searchQuery === '' ||
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.key.toLowerCase().includes(searchQuery.toLowerCase()))
    );

  const getColumnPoints = (status: SprintStatus) =>
    getColumnItems(status).reduce((sum, item) => sum + (item.storyPoints || 0), 0);

  const totalPoints = mockSprintItems.reduce((sum, item) => sum + (item.storyPoints || 0), 0);
  const donePoints = getColumnPoints('done');
  const progressPercent = Math.round((donePoints / totalPoints) * 100);

  return (
    <div className="flex flex-col h-full">
      {/* Sprint Header */}
      <div className="p-4 border-b bg-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">{mockSprint.name}</h2>
            <Badge variant="info">Active</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-1" />
              Filter
            </Button>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Item
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>
                {new Date(mockSprint.startDate).toLocaleDateString()} —{' '}
                {new Date(mockSprint.endDate).toLocaleDateString()}
              </span>
            </div>
            <div className="text-muted-foreground">
              <span className="font-medium text-foreground">{donePoints}</span> /{' '}
              {totalPoints} pts completed
            </div>
          </div>

          <div className="flex items-center gap-3 w-64">
            <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-success rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-sm font-medium">{progressPercent}%</span>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mt-2">
          <span className="font-medium">Goal:</span> {mockSprint.goal}
        </p>
      </div>

      {/* Search */}
      <div className="p-4 border-b">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-4 h-full min-w-max">
          {columns.map((column) => {
            const items = getColumnItems(column.id);
            const points = getColumnPoints(column.id);

            return (
              <div
                key={column.id}
                className="w-80 flex flex-col bg-muted/30 rounded-lg"
              >
                {/* Column Header */}
                <div className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={cn('h-2 w-2 rounded-full', column.color)} />
                    <span className="font-medium text-sm">{column.label}</span>
                    <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {items.length}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">{points} pts</span>
                </div>

                {/* Column Content */}
                <div className="flex-1 overflow-y-auto p-2 pt-0 space-y-2">
                  {items.map((item) => (
                    <SprintCard key={item.id} item={item} />
                  ))}

                  {items.length === 0 && (
                    <div className="flex items-center justify-center h-24 border-2 border-dashed border-border/50 rounded-lg">
                      <span className="text-sm text-muted-foreground">No items</span>
                    </div>
                  )}
                </div>

                {/* Add Item */}
                <div className="p-2">
                  <Button variant="ghost" className="w-full justify-start text-muted-foreground">
                    <Plus className="h-4 w-4 mr-1" />
                    Add item
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
