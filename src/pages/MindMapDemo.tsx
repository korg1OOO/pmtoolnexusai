"use client";

import React, { useState } from "react";
import { MindMapCanvas } from "@/components/mindmap/MindMapCanvas";
import { AddNodeModal } from "@/components/mindmap/AddNodeModal";
import { AddTaskModal } from "@/components/mindmap/AddTaskModal";
import { MegaProject, MindMapNode as NodeType, Task } from "@/types/mindmap";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { v4 as uuidv4 } from "uuid";

// Initial sample data
const initialProject: MegaProject = {
  id: "proj-001",
  name: "NexusAI Platform Launch",
  description: "Main initiative to build and launch the NexusAI PM Tool with clean staged UI",
  overallProgress: 47,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  modules: [
    {
      id: "mod-001",
      name: "Core Mind Map Engine",
      description: "Build the interactive hierarchical mind map with color waves",
      progress: 68,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      children: [
        {
          id: "sub-001",
          name: "Node Rendering & Waves",
          progress: 85,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          children: [],
          tasks: [
            {
              id: "task-001",
              name: "Implement animated color waves",
              status: "Completed",
              priority: "High",
              progress: 100,
              createdAt: new Date().toISOString(),
            },
            {
              id: "task-002",
              name: "Build recursive node component",
              status: "In Progress",
              priority: "High",
              progress: 70,
              createdAt: new Date().toISOString(),
            },
          ],
        },
      ],
      tasks: [],
    },
  ],
};

// Helper to recalculate progress bottom-up
function recalculateProgress(node: NodeType): NodeType {
  if (node.children.length === 0 && node.tasks.length === 0) {
    return { ...node, progress: 0 };
  }

  const childProgresses = node.children.map(recalculateProgress);
  const taskProgress = node.tasks.length > 0
    ? node.tasks.reduce((sum, t) => sum + t.progress, 0) / node.tasks.length
    : 0;
  const childrenProgress = childProgresses.length > 0
    ? childProgresses.reduce((sum, c) => sum + c.progress, 0) / childProgresses.length
    : 0;

  const newProgress = Math.round(
    (taskProgress * 0.4 + childrenProgress * 0.6) || 0
  );

  return {
    ...node,
    progress: newProgress,
    children: childProgresses,
  };
}

function recalculateProject(project: MegaProject): MegaProject {
  const updatedModules = project.modules.map(recalculateProgress);
  const overall =
    updatedModules.length > 0
      ? Math.round(updatedModules.reduce((sum, m) => sum + m.progress, 0) / updatedModules.length)
      : 0;

  return {
    ...project,
    modules: updatedModules,
    overallProgress: overall,
    updatedAt: new Date().toISOString(),
  };
}
export default function MindMapDemo() {
  const [project, setProject] = useState<MegaProject>(initialProject);
  const [addNodeModal, setAddNodeModal] = useState<{
    open: boolean;
    parentId: string | null;
    type: "module" | "submodule";
    parentName?: string;
  }>({ open: false, parentId: null, type: "module" });

  const [addTaskModal, setAddTaskModal] = useState<{
    open: boolean;
    nodeId: string | null;
    nodeName?: string;
  }>({ open: false, nodeId: null });

  const updateProject = (newProject: MegaProject) => {
    const recalculated = recalculateProject(newProject);
    setProject(recalculated);
  };

  const findNodeAndParent = (
    nodes: NodeType[],
    targetId: string,
    parent: NodeType | null = null
  ): { node: NodeType; parent: NodeType | null } | null => {
    for (const node of nodes) {
      if (node.id === targetId) return { node, parent };
      const found = findNodeAndParent(node.children, targetId, node);
      if (found) return found;
    }
    return null;
  };

  const handleAddModule = () => {
    setAddNodeModal({ open: true, parentId: null, type: "module" });
  };

  const handleAddSubmodule = (parentId: string, parentName: string) => {
    setAddNodeModal({ open: true, parentId, type: "submodule", parentName });
  };

  const handleAddTask = (nodeId: string, nodeName: string) => {
    setAddTaskModal({ open: true, nodeId, nodeName });
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

    let updatedProject = { ...project };

    if (addNodeModal.parentId === null) {
      // Add as top-level module
      updatedProject.modules = [...project.modules, newNode];
    } else {
      // Add as child
      const result = findNodeAndParent(updatedProject.modules, addNodeModal.parentId);
      if (result) {
        result.node.children = [...result.node.children, newNode];
      }
    }

    updateProject(updatedProject);
    setAddNodeModal({ open: false, parentId: null, type: "module" });
  };

  const createTask = (data: {
    name: string;
    description?: string;
    assignee?: string;
    dueDate?: string;
    status: any;
    priority: any;
  }) => {
    if (!addTaskModal.nodeId) return;

    const newTask: Task = {
      id: uuidv4(),
      name: data.name,
      description: data.description,
      assignee: data.assignee,
      dueDate: data.dueDate,
      status: data.status,
      priority: data.priority,
      progress: data.status === "Completed" ? 100 : data.status === "In Progress" ? 40 : 0,
      createdAt: new Date().toISOString(),
    };

    const updatedProject = { ...project };
    const result = findNodeAndParent(updatedProject.modules, addTaskModal.nodeId);

    if (result) {
      result.node.tasks = [...result.node.tasks, newTask];
    }

    updateProject(updatedProject);
    setAddTaskModal({ open: false, nodeId: null });
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-3">
              NEXUSAI PMTOOL • Clean Foundation
            </div>
            <h1 className="text-4xl font-semibold tracking-tighter">Interactive Mind Map Demo</h1>
            <p className="text-muted-foreground mt-2">
              Fully functional prototype. Add modules, submodules and tasks. Progress updates automatically.
            </p>
          </div>

          <Button onClick={handleAddModule} size="lg">
            <Plus className="mr-2 h-4 w-4" />
            New Module
          </Button>
        </div>

        <MindMapCanvas
          project={project}
          onUpdateProject={updateProject}
          onAddChild={handleAddSubmodule}
          onAddTask={handleAddTask}
        />
      </div>

      {/* Modals */}
      <AddNodeModal
        open={addNodeModal.open}
        onOpenChange={(open) => setAddNodeModal({ ...addNodeModal, open })}
        onSubmit={createNode}
        parentName={addNodeModal.parentName}
        type={addNodeModal.type}
      />

      <AddTaskModal
        open={addTaskModal.open}
        onOpenChange={(open) => setAddTaskModal({ ...addTaskModal, open })}
        onSubmit={createTask}
        nodeName={addTaskModal.nodeName}
      />
    </div>
  );
}
