"use client";

import React, { useState } from "react";
import { MindMapCanvas } from "@/components/mindmap/MindMapCanvas";
import { AddNodeModal } from "@/components/mindmap/AddNodeModal";
import { AddTaskModal } from "@/components/mindmap/AddTaskModal";
import { MegaProject, MindMapNode as NodeType, Task } from "@/types/mindmap";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

// Temporary in-memory project for demo purposes
// Later this will come from Supabase
const initialProject: MegaProject = {
  id: "proj-demo-001",
  name: "Website Redesign 2026",
  description: "Complete overhaul of the company website and marketing site",
  overallProgress: 38,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  modules: [
    {
      id: "mod-design",
      name: "Design System",
      description: "Create new design system and component library",
      progress: 65,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      children: [],
      tasks: [],
    },
    {
      id: "mod-frontend",
      name: "Frontend Development",
      progress: 25,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      children: [],
      tasks: [],
    },
  ],
};

function recalculateProgress(node: NodeType): NodeType {
  if (node.children.length === 0 && node.tasks.length === 0) return { ...node, progress: 0 };

  const childProgresses = node.children.map(recalculateProgress);
  const taskAvg = node.tasks.length > 0 ? node.tasks.reduce((s, t) => s + t.progress, 0) / node.tasks.length : 0;
  const childAvg = childProgresses.length > 0 ? childProgresses.reduce((s, c) => s + c.progress, 0) / childProgresses.length : 0;

  return {
    ...node,
    progress: Math.round(taskAvg * 0.5 + childAvg * 0.5),
    children: childProgresses,
  };
}

function recalculateProject(p: MegaProject): MegaProject {
  const modules = p.modules.map(recalculateProgress);
  const overall = modules.length > 0 ? Math.round(modules.reduce((s, m) => s + m.progress, 0) / modules.length) : 0;
  return { ...p, modules, overallProgress: overall, updatedAt: new Date().toISOString() };
}

export default function WorkspaceMindMap() {
  const [project, setProject] = useState<MegaProject>(initialProject);
  const [addNodeOpen, setAddNodeOpen] = useState(false);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [selectedParent, setSelectedParent] = useState<{ id: string; name: string; type: "module" | "submodule" } | null>(null);
  const [selectedTaskNode, setSelectedTaskNode] = useState<{ id: string; name: string } | null>(null);

  const updateProject = (newProject: MegaProject) => {
    setProject(recalculateProject(newProject));
  };

  const findNode = (nodes: NodeType[], id: string): NodeType | null => {
    for (const n of nodes) {
      if (n.id === id) return n;
      const found = findNode(n.children, id);
      if (found) return found;
    }
    return null;
  };

  const handleAddModule = () => {
    setSelectedParent(null);
    setAddNodeOpen(true);
  };

  const handleAddSubmodule = (parentId: string, parentName: string) => {
    setSelectedParent({ id: parentId, name: parentName, type: "submodule" });
    setAddNodeOpen(true);
  };

  const handleAddTask = (nodeId: string, nodeName: string) => {
    setSelectedTaskNode({ id: nodeId, name: nodeName });
    setAddTaskOpen(true);
  };

  const createNode = (data: { name: string; description?: string }) => {
    const newNode: NodeType = {
      id: uuidv4(),
      name: data.name,
      description: data.description,
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      children: [],
      tasks: [],
    };

    const updated = { ...project };

    if (!selectedParent) {
      updated.modules.push(newNode);
    } else {
      const parent = findNode(updated.modules, selectedParent.id);
      if (parent) parent.children.push(newNode);
    }

    updateProject(updated);
    setAddNodeOpen(false);
    setSelectedParent(null);
  };

  const createTask = (data: any) => {
    if (!selectedTaskNode) return;

    const newTask: Task = {
      id: uuidv4(),
      name: data.name,
      description: data.description,
      assignee: data.assignee,
      dueDate: data.dueDate,
      status: data.status,
      priority: data.priority,
      progress: data.status === "Completed" ? 100 : data.status === "In Progress" ? 35 : 0,
      createdAt: new Date().toISOString(),
    };

    const updated = { ...project };
    const node = findNode(updated.modules, selectedTaskNode.id);
    if (node) node.tasks.push(newTask);

    updateProject(updated);
    setAddTaskOpen(false);
    setSelectedTaskNode(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="max-w-6xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => window.history.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Back
            </Button>
            <div>
              <div className="text-sm text-muted-foreground">Workspace</div>
              <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
            </div>
          </div>

          <Button onClick={handleAddModule}>
            <Plus className="h-4 w-4 mr-2" /> New Module
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        <MindMapCanvas
          project={project}
          onUpdateProject={updateProject}
          onAddChild={handleAddSubmodule}
          onAddTask={handleAddTask}
        />
      </div>

      <AddNodeModal
        open={addNodeOpen}
        onOpenChange={setAddNodeOpen}
        onSubmit={createNode}
        parentName={selectedParent?.name}
        type={selectedParent?.type || "module"}
      />

      <AddTaskModal
        open={addTaskOpen}
        onOpenChange={setAddTaskOpen}
        onSubmit={createTask}
        nodeName={selectedTaskNode?.name}
      />
    </div>
  );
}
