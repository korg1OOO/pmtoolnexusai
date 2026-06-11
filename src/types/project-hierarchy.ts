// src/types/project-hierarchy.ts

export type TaskStatus = 'Not Started' | 'In Progress' | 'Blocked' | 'Completed';

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';

export interface Task {
  id: string;
  name: string;
  description: string;
  assignee: string;           // user id or name
  deadline: string | null;    // ISO date string
  status: TaskStatus;
  priority: TaskPriority;
  progress: number;           // 0-100
  createdAt: string;          // ISO
  completedAt: string | null; // ISO
}

export type NodeType = 'module' | 'submodule';

export interface ProjectNode {
  id: string;
  name: string;
  description?: string;
  type: NodeType;
  children: ProjectNode[];    // unlimited nesting
  tasks: Task[];
  
  // Computed fields (calculated in helpers)
  progress?: number;          // 0-100 - automatic rollup
  taskCount?: number;
  childModuleCount?: number;
  upcomingDeadlines?: number;
}

export interface MegaProject {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  
  // Root level children (Modules)
  children: ProjectNode[];
  
  // Computed overall progress
  overallProgress?: number;
  totalTasks?: number;
  completedTasks?: number;
  overdueTasks?: number;
}

// Helper to calculate progress recursively (as per spec)
export function calculateNodeProgress(node: ProjectNode): number {
  if (node.tasks.length === 0 && node.children.length === 0) return 0;

  const taskProgress = node.tasks.length > 0
    ? node.tasks.reduce((sum, task) => sum + task.progress, 0) / node.tasks.length
    : 0;

  const childrenProgress = node.children.length > 0
    ? node.children.reduce((sum, child) => sum + calculateNodeProgress(child), 0) / node.children.length
    : 0;

  // Simple average between own tasks and children (can be weighted later)
  if (node.tasks.length > 0 && node.children.length > 0) {
    return Math.round((taskProgress + childrenProgress) / 2);
  }
  return Math.round(taskProgress || childrenProgress);
}

export function calculateMegaProjectProgress(megaProject: MegaProject): number {
  if (megaProject.children.length === 0) return 0;
  
  const total = megaProject.children.reduce(
    (sum, node) => sum + calculateNodeProgress(node), 
    0
  );
  return Math.round(total / megaProject.children.length);
}

// Color helper (exactly as specified)
export function getProgressColor(progress: number): 'red' | 'orange' | 'yellow' | 'green' {
  if (progress <= 25) return 'red';
  if (progress <= 50) return 'orange';
  if (progress <= 75) return 'yellow';
  return 'green';
}

export function getWaveColor(progress: number): string {
  if (progress <= 25) return '#ef4444'; // red
  if (progress <= 50) return '#f97316'; // orange
  if (progress <= 75) return '#eab308'; // yellow
  if (progress === 100) return '#3b82f6'; // blue (completed/stable)
  return '#22c55e'; // green
}