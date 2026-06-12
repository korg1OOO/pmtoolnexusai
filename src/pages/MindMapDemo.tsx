"use client";

import React from "react";
import { MindMapCanvas } from "@/components/mindmap";
import { MegaProject } from "@/types/mindmap";

// Sample data following the strict hierarchical model
const sampleProject: MegaProject = {
  id: "proj-001",
  name: "NexusAI Platform Launch",
  description: "Main initiative to build and launch the NexusAI PM Tool",
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
        {
          id: "sub-002",
          name: "Drag & Drop Reorganization",
          progress: 30,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          children: [],
          tasks: [],
        },
      ],
      tasks: [
        {
          id: "task-010",
          name: "Define data model (MegaProject > Module > Submodule)",
          status: "Completed",
          priority: "Critical",
          progress: 100,
          createdAt: new Date().toISOString(),
        },
      ],
    },
    {
      id: "mod-002",
      name: "User Onboarding & Stages",
      progress: 25,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      children: [],
      tasks: [
        {
          id: "task-020",
          name: "Design staged UI flow",
          status: "In Progress",
          priority: "High",
          progress: 40,
          createdAt: new Date().toISOString(),
        },
      ],
    },
  ],
};

export default function MindMapDemo() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm mb-3">
            NEXUSAI PMTOOL • v0.1 (Mind Map Foundation)
          </div>
          <h1 className="text-4xl font-semibold tracking-tighter">Mind Map Demo</h1>
          <p className="text-muted-foreground mt-2 max-w-prose">
            This is the new clean foundation following the strict hierarchical model and color wave requirements.
            The goal is to make this the primary interface.
          </p>
        </div>

        <MindMapCanvas project={sampleProject} />
      </div>
    </div>
  );
}
