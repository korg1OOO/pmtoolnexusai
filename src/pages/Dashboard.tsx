"use client";

import React, { useState } from "react";
import { MindMapCanvas } from "@/components/mindmap/MindMapCanvas";
import { AddNodeModal } from "@/components/mindmap/AddNodeModal";
import { AddTaskModal } from "@/components/mindmap/AddTaskModal";
import { EditNodeModal } from "@/components/mindmap/EditNodeModal";
import { MegaProject, MindMapNode as NodeType, Task } from "@/types/mindmap";
import { Button } from "@/components/ui/button";
import { Plus, Info, Save, ArrowRight } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import { useToast } from "@/hooks/use-toast";

/**
 * MAIN DASHBOARD (Tela inicial após login)
 * Alinhado com o documento do sócio:
 * - Mind-map hierárquico como interface primária
 * - Staged Progressive Disclosure (Stage 1, 2, 3)
 * - Experiência limpa e focada
 */
export default function Dashboard() {
  const { toast } = useToast();

  const [project, setProject] = useState<MegaProject>({
    id: "main-dashboard-project",
    name: "Meu Projeto Principal",
    description: "Estrutura central do seu trabalho",
    overallProgress: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    modules: [],
  });

  const [currentStage, setCurrentStage] = useState<1 | 2 | 3>(1);

  const [addNodeOpen, setAddNodeOpen] = useState(false);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [editNodeOpen, setEditNodeOpen] = useState(false);
  const [selectedParent, setSelectedParent] = useState<{ id: string; name: string; type: "module" | "submodule" } | null>(null);
  const [selectedTaskNode, setSelectedTaskNode] = useState<{ id: string; name: string } | null>(null);
  const [editingNode, setEditingNode] = useState<NodeType | null>(null);
  const [isSaving, setIsSaving] = useState(false);

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
    const remove = (nodes: NodeType[]): NodeType[] =>
      nodes.filter(n => n.id !== nodeId).map(n => ({ ...n, children: remove(n.children) }));
    updateProject({ ...project, modules: remove(project.modules) });
  };

  const updateNode = (nodeId: string, data: { name: string; description?: string }) => {
    const updateRec = (nodes: NodeType[]): NodeType[] =>
      nodes.map(n => n.id === nodeId ? { ...n, ...data } : { ...n, children: updateRec(n.children) });
    updateProject({ ...project, modules: updateRec(project.modules) });
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
      if (currentStage === 1) setCurrentStage(2);
    } else {
      const p = findNode(updated.modules, selectedParent.id);
      if (p) p.children.push(newNode);
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
      progress: data.status === "Completed" ? 100 : 35,
      createdAt: new Date().toISOString(),
    };
    const updated = { ...project };
    const n = findNode(updated.modules, selectedTaskNode.id);
    if (n) n.tasks.push(newTask);
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
    // Aqui você pode integrar com Supabase depois
    setTimeout(() => {
      setIsSaving(false);
      toast({ title: "Salvo com sucesso" });
    }, 600);
  };

  const showDelete = currentStage >= 2;

  // Stage 1 - Onboarding simples
  if (currentStage === 1 && project.modules.length === 0) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-background p-8 text-center">
        <div className="max-w-md space-y-6">
          <div>
            <h1 className="text-4xl font-semibold tracking-tight">Bem-vindo ao NexusAI</h1>
            <p className="text-muted-foreground mt-3 text-lg">
              Vamos começar de forma simples. Crie seu primeiro módulo.
            </p>
          </div>

          <Button size="lg" onClick={handleAddModule} className="px-8">
            Criar meu primeiro Módulo <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            Tudo acontece no mind-map. Sem complicação.
          </p>
        </div>

        <AddNodeModal
          open={addNodeOpen}
          onOpenChange={setAddNodeOpen}
          onSubmit={createNode}
          parentName={null}
          type="module"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card/50">
        <div className="max-w-6xl mx-auto px-8 py-5 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-medium">SIMPLIFIED DASHBOARD</span>
              <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-600 font-medium">Stage {currentStage}/3</span>
            </div>
            <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentStage(Math.max(1, currentStage - 1) as 1)}>
              Etapa Anterior
            </Button>
            <Button size="sm" onClick={() => setCurrentStage(Math.min(3, currentStage + 1) as 1)}>
              Próxima Etapa
            </Button>
            <Button variant="outline" onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
            <Button onClick={handleAddModule} size="lg">
              <Plus className="h-4 w-4 mr-2" /> Novo Módulo
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="mb-6 flex items-start gap-3 rounded-2xl border bg-muted/30 p-4 text-sm">
          <Info className="h-5 w-5 mt-0.5 text-muted-foreground flex-shrink-0" />
          <div className="text-muted-foreground">
            {currentStage === 1 && "Etapa 1: Mantenha simples. Foque em estrutura básica."}
            {currentStage === 2 && "Etapa 2: Agora você pode arrastar, deletar e organizar melhor."}
            {currentStage === 3 && "Etapa 3: Recursos avançados liberados."}
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

      <AddNodeModal open={addNodeOpen} onOpenChange={setAddNodeOpen} onSubmit={createNode} parentName={selectedParent?.name} type={selectedParent?.type || "module"} />
      <AddTaskModal open={addTaskOpen} onOpenChange={setAddTaskOpen} onSubmit={createTask} nodeName={selectedTaskNode?.name} />
      <EditNodeModal open={editNodeOpen} onOpenChange={setEditNodeOpen} node={editingNode} onSubmit={handleEditSubmit} />
    </div>
  );
}
