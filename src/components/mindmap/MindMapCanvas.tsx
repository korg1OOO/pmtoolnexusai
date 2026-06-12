"use client";

import React, { useState } from "react";
import { MindMapNode } from "./MindMapNode";
import { MegaProject, MindMapNode as NodeType } from "@/types/mindmap";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface MindMapCanvasProps {
  project: MegaProject;
  onUpdateProject?: (project: MegaProject) => void;
  onAddChild?: (parentId: string, parentName: string) => void;
  onAddTask?: (nodeId: string, nodeName: string) => void;
  className?: string;
}

/**
 * MindMapCanvas - Main container for the interactive hierarchical mind map
 * This will evolve into the primary workspace view
 */
export const MindMapCanvas: React.FC<MindMapCanvasProps> = ({
  project,
  onUpdateProject,
  onAddChild,
  onAddTask,
  className,
}) => {
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const isNodeExpanded = (id: string) => expandedNodes[id] !== false;

  const handleAddChildInternal = (parentId: string, parentName?: string) => {
    if (onAddChild && parentName) {
      onAddChild(parentId, parentName);
    }
  };

  const handleAddTaskInternal = (nodeId: string, nodeName?: string) => {
    if (onAddTask && nodeName) {
      onAddTask(nodeId, nodeName);
    }
  };

  const handleEdit = (node: NodeType) => {
    console.log("Edit node:", node);
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">{project.name}</h1>
          {project.description && (
            <p className="text-muted-foreground mt-1">{project.description}</p>
          )}
        </div>

        <Button onClick={() => console.log("Create new module from canvas header")}>
          <Plus className="mr-2 h-4 w-4" />
          New Module
        </Button>
      </div>

      {/* Overall Progress */}
      <div className="mb-8 flex items-center gap-4 rounded-2xl border bg-card p-5">
        <div className="text-sm text-muted-foreground">Overall Progress</div>
        <div className="text-4xl font-semibold tabular-nums">
          {Math.round(project.overallProgress)}%
        </div>
      </div>

      {/* Mind Map Tree */}
      <div className="space-y-4">
        {project.modules.map((module) => (
          <MindMapNode
            key={module.id}
            node={module}
            level={0}
            isExpanded={isNodeExpanded(module.id)}
            onToggleExpand={toggleExpand}
            onAddChild={(id) => handleAddChildInternal(id, module.name)}
            onAddTask={(id) => handleAddTaskInternal(id, module.name)}
            onEdit={handleEdit}
          />
        ))}
      </div>

      {project.modules.length === 0 && (
        <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">No modules yet</p>
            <Button variant="outline" onClick={() => console.log("Create first module")}>
              Create your first module
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
