import { z } from "zod";

// ============================================
// NEXUSAI PMTOOL - STRICT HIERARCHICAL MODEL
// Follows nexusai-pmtool skill specification exactly
// ============================================

export type TaskStatus = "Not Started" | "In Progress" | "Blocked" | "Completed";

export type Priority = "Low" | "Medium" | "High" | "Critical";

export interface Task {
  id: string;
  name: string;
  description?: string;
  assignee?: string;
  dueDate?: string; // ISO date
  status: TaskStatus;
  priority: Priority;
  progress: number; // 0-100
  createdAt: string;
  completedAt?: string;
}

// Recursive node type (Module or Submodule)
export interface MindMapNode {
  id: string;
  name: string;
  description?: string;
  // Children can be nested infinitely
  children: MindMapNode[];
  tasks: Task[];
  // Auto-calculated (never manually set)
  progress: number; // 0-100
  // Metadata
  createdAt: string;
  updatedAt: string;
}

// Top level container
export interface MegaProject {
  id: string;
  name: string;
  description?: string;
  // Root level modules
  modules: MindMapNode[];
  // Auto-calculated from all descendants
  overallProgress: number;
  createdAt: string;
  updatedAt: string;
  // Optional metadata
  ownerId?: string;
  tenantId?: string;
}

// ============================================
// PROGRESS COLOR SYSTEM (Strict per skill)
// ============================================

export type ProgressColor = "red" | "orange" | "yellow" | "green";

export function getProgressColor(progress: number): ProgressColor {
  if (progress <= 25) return "red";
  if (progress <= 50) return "orange";
  if (progress <= 75) return "yellow";
  return "green";
}

// Tailwind classes for progress indicators
export function getProgressColorClasses(progress: number) {
  const color = getProgressColor(progress);
  const map = {
    red: {
      bg: "bg-red-500",
      text: "text-red-600",
      border: "border-red-500",
      wave: "from-red-500/30 via-red-500/60 to-red-500/30",
    },
    orange: {
      bg: "bg-orange-500",
      text: "text-orange-600",
      border: "border-orange-500",
      wave: "from-orange-500/30 via-orange-500/60 to-orange-500/30",
    },
    yellow: {
      bg: "bg-yellow-500",
      text: "text-yellow-600",
      border: "border-yellow-500",
      wave: "from-yellow-500/30 via-yellow-500/60 to-yellow-500/30",
    },
    green: {
      bg: "bg-green-500",
      text: "text-green-600",
      border: "border-green-500",
      wave: "from-green-500/30 via-green-500/60 to-green-500/30",
    },
  };
  return map[color];
}

// ============================================
// ZOD SCHEMAS (for validation)
// ============================================

export const TaskSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  assignee: z.string().optional(),
  dueDate: z.string().optional(),
  status: z.enum(["Not Started", "In Progress", "Blocked", "Completed"]),
  priority: z.enum(["Low", "Medium", "High", "Critical"]),
  progress: z.number().min(0).max(100),
});

export const MindMapNodeSchema = z.lazy(() =>
  z.object({
    id: z.string().uuid(),
    name: z.string().min(1),
    description: z.string().optional(),
    children: z.array(MindMapNodeSchema),
    tasks: z.array(TaskSchema),
    progress: z.number().min(0).max(100),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
);

export const MegaProjectSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  modules: z.array(MindMapNodeSchema),
  overallProgress: z.number().min(0).max(100),
  createdAt: z.string(),
  updatedAt: z.string(),
});
