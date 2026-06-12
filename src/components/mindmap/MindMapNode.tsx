"use client";

import React from "react";
import { motion } from "framer-motion";
import { MindMapNode as NodeType, Task, getProgressColorClasses } from "@/types/mindmap";
import { ChevronRight, ChevronDown, Plus, MoreHorizontal, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MindMapNodeProps {
  node: NodeType;
  level?: number;
  isExpanded?: boolean;
  onToggleExpand?: (id: string) => void;
  onAddChild?: (parentId: string, parentName: string) => void;
  onAddTask?: (nodeId: string, nodeName: string) => void;
  onEdit?: (node: NodeType) => void;
  onDelete?: (nodeId: string) => void;
  className?: string;
}

/**
 * MindMapNode - Core visual component per nexusai-pmtool skill
 */
export const MindMapNode: React.FC<MindMapNodeProps> = ({
  node,
  level = 0,
  isExpanded = true,
  onToggleExpand,
  onAddChild,
  onAddTask,
  onEdit,
  onDelete,
  className,
}) => {
  const progress = Math.round(node.progress);
  const colorClasses = getProgressColorClasses(progress);
  const hasChildren = node.children.length > 0;
  const taskCount = node.tasks.length;

  const getTotalChildren = (n: NodeType): number => {
    return n.children.reduce((sum, child) => sum + 1 + getTotalChildren(child), 0);
  };
  const childCount = getTotalChildren(node);

  const upcomingDeadline = React.useMemo(() => {
    const dueDates = node.tasks
      .filter((t) => t.dueDate && t.status !== "Completed")
      .map((t) => t.dueDate!)
      .sort();
    return dueDates[0];
  }, [node.tasks]);

  return (
    <div className={cn("group relative", className)}>
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border bg-card p-4 shadow-sm transition-all duration-200",
          "hover:shadow-md hover:border-primary/40",
          colorClasses.border,
          level === 0 && "ring-1 ring-primary/20"
        )}
      >
        {/* Animated Color Wave Background */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl">
          <motion.div
            className={cn(
              "absolute inset-0 bg-gradient-to-r opacity-40",
              colorClasses.wave
            )}
            animate={{
              backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              backgroundSize: "200% 100%",
            }}
          />
          <motion.div
            className={cn(
              "absolute inset-0 bg-gradient-to-r opacity-20",
              colorClasses.wave
            )}
            animate={{
              backgroundPosition: ["100% 50%", "0% 50%", "100% 50%"],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "linear",
            }}
            style={{
              backgroundSize: "250% 100%",
            }}
          />
        </div>

        <div className="relative z-10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2 flex-1 min-w-0">
              {hasChildren && (
                <button
                  onClick={() => onToggleExpand?.(node.id)}
                  className="mt-0.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </button>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg leading-tight truncate">{node.name}</h3>
                  {level === 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono">MEGA</span>
                  )}
                </div>
                {node.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{node.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => onAddTask?.(node.id, node.name)}
                className="h-8 w-8 rounded-lg hover:bg-accent flex items-center justify-center"
                title="Add task"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                onClick={() => onAddChild?.(node.id, node.name)}
                className="h-8 w-8 rounded-lg hover:bg-accent flex items-center justify-center"
                title="Add submodule"
              >
                <Plus className="h-4 w-4" />
              </button>
              <button
                onClick={() => onEdit?.(node)}
                className="h-8 w-8 rounded-lg hover:bg-accent flex items-center justify-center"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {onDelete && (
                <button
                  onClick={() => onDelete(node.id)}
                  className="h-8 w-8 rounded-lg hover:bg-destructive/10 text-destructive flex items-center justify-center"
                  title="Delete node"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="relative h-14 w-14 flex-shrink-0">
              <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="24" fill="none" stroke="currentColor" strokeWidth="5" className="text-muted/30" />
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="5"
                  strokeDasharray={2 * Math.PI * 24}
                  strokeDashoffset={2 * Math.PI * 24 * (1 - progress / 100)}
                  className={cn("transition-all", colorClasses.text)}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={cn("text-lg font-semibold tabular-nums", colorClasses.text)}>{progress}</span>
              </div>
            </div>

            <div className="flex-1 space-y-1.5 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Progress</span>
                <span className={cn("font-medium", colorClasses.text)}>{progress}%</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <div>Tasks <span className="font-mono text-foreground">{taskCount}</span></div>
                <div>Sub <span className="font-mono text-foreground">{childCount}</span></div>
              </div>
              {upcomingDeadline && (
                <div className="text-xs text-orange-600 dark:text-orange-400">Due: {new Date(upcomingDeadline).toLocaleDateString()}</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="ml-6 mt-3 pl-4 border-l border-border/60 space-y-3">
          {node.children.map((child) => (
            <MindMapNode
              key={child.id}
              node={child}
              level={level + 1}
              isExpanded={isExpanded}
              onToggleExpand={onToggleExpand}
              onAddChild={onAddChild}
              onAddTask={onAddTask}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};
