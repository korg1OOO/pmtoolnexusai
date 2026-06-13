"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { MindMapCanvas } from "@/components/mindmap/MindMapCanvas";
import { AddNodeModal } from "@/components/mindmap/AddNodeModal";
import { AddTaskModal } from "@/components/mindmap/AddTaskModal";
import { EditNodeModal } from "@/components/mindmap/EditNodeModal";
import { MegaProject, MindMapNode as NodeType, Task } from "@/types/mindmap";
import { Button } from "@/components/ui/button";
import { Plus, Info, Save } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { mindmapService } from "@/services/mindmapService";
import { useToast } from "@/hooks/use-toast";

/**
 * NEW SIMPLIFIED WORKSPACE DASHBOARD
 * Primary interface is now the hierarchical mind-map with staged complexity.
 * This replaces the old complex multi-card dashboard.
 */
export function WorkspaceDashboard() {
  const { workspaceId } = useParams();
  const { toast } = useToast();

  const [project, setProject] = useState<MegaProject>({
    id: workspaceId || "proj-main",
    name: "Main Workspace Project",
    description: "Central mind map for this workspace",
    overallProgress: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    modules: [],
  });

  const [addNodeOpen, setAddNodeOpen] = useState(false);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [editNodeOpen, setEditNodeOpen] = useState(false);
  const [selectedParent, setSelectedParent] = useState<{ id: string; name: string; type: "module" | "submodule" } | null>(null);
  const [selectedTaskNode, setSelectedTaskNode] = useState<{ id: string; name: string } | null>(null);
  const [editingNode, setEditingNode] = useState<NodeType | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentStage, setCurrentStage] = useState<1 | 2 | 3>(1);

  // Load from Supabase on mount
  useEffect(() => {
    const loadProject = async () => {
      try {
        const projects = await mindmapService.getUserProjects();
        if (projects.length > 0) {
          const latest = projects[0];
          setProject(latest.data);
        }
      } catch (e) {
        // silent fail
      }
    };
    loadProject();
  }, []);

  const updateProject = (newProject: MegaProject) => {
    setProject({ ...newProject, updatedAt: new Date().toISOString() });
  };

  const findNode = (nodes: NodeType[], id: string): NodeType | null => {
    for (const n of nodes) {
      if (n.id === id) return n;
      const found = findNode(n.children, id);
      if (found) return found;
    }
    return null;
  };

  const deleteNode = (nodeId: string) => {
    const removeNode = (nodes: NodeType[]): NodeType[] =>
      nodes
        .filter(n => n.id !== nodeId)
        .map(n => ({ ...n, children: removeNode(n.children) }));

    const updated = { ...project, modules: removeNode(project.modules) };
    updateProject(updated);
  };

  const updateNode = (nodeId: string, data: { name: string; description?: string }) => {
    const updateRecursive = (nodes: NodeType[]): NodeType[] =>
      nodes.map(n =>
        n.id === nodeId
          ? { ...n, ...data, updatedAt: new Date().toISOString() }
          : { ...n, children: updateRecursive(n.children) }
      );

    const updated = { ...project, modules: updateRecursive(project.modules) };
    updateProject(updated);
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

  const handleEditNode = (node: NodeType) => {
    setEditingNode(node);
    setEditNodeOpen(true);
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

  const handleEditSubmit = (data: { name: string; description?: string }) => {
    if (editingNode) updateNode(editingNode.id, data);
    setEditNodeOpen(false);
    setEditingNode(null);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const saved = await mindmapService.saveDemoProject(project);
      if (saved) {
        toast({ title: "Saved", description: "Progress saved to Supabase" });
      }
    } catch (e) {
      toast({ title: "Error", description: "Failed to save", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const showDelete = currentStage >= 2;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card/50">
        <div className="max-w-6xl mx-auto px-8 py-5">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-medium">SIMPLIFIED VIEW</span>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 font-medium">Stage {currentStage}/3</span>
              </div>
              <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
              <p className="text-sm text-muted-foreground">{project.description}</p>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setCurrentStage(Math.max(1, currentStage - 1) as 1)}>
                Previous
              </Button>
              <Button size="sm" onClick={() => setCurrentStage(Math.min(3, currentStage + 1) as 1)}>
                Next Stage
              </Button>
              <Button variant="outline" onClick={handleSave} disabled={isSaving}>
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save"}
              </Button>
              <Button onClick={handleAddModule} size="lg">
                <Plus className="h-4 w-4 mr-2" />
                New Module
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="mb-6 flex items-start gap-3 rounded-xl border bg-muted/30 p-4 text-sm">
          <Info className="h-5 w-5 mt-0.5 text-muted-foreground flex-shrink-0" />
          <div className="text-muted-foreground">
            {currentStage === 1 && "Stage 1: Basic structure. Add modules and tasks."}
            {currentStage === 2 && "Stage 2: Drag, drop and delete available."}
            {currentStage === 3 && "Stage 3: Full editing and advanced controls."}
          </div>
        </div>

        <MindMapCanvas
          project={project}
          onUpdateProject={updateProject}
          onAddChild={handleAddSubmodule}
          onAddTask={handleAddTask}
          onDelete={showDelete ? deleteNode : undefined}
          onEdit={handleEditNode}
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
      <EditNodeModal
        open={editNodeOpen}
        onOpenChange={setEditNodeOpen}
        node={editingNode}
        onSubmit={handleEditSubmit}
      />
    </div>
  );
}
