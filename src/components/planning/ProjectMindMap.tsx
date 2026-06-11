import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronDown, Plus, Target, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { CreateNodeDialog } from './CreateNodeDialog';
import { CreateTaskDialog } from './CreateTaskDialog';
import { ColorWave } from './ColorWave';
import { useProjectHierarchy } from '@/hooks/useProjectHierarchy';
import { useCreateProjectNode } from '@/hooks/useCreateProjectNode';
import { useCreateTask } from '@/hooks/useCreateTask';
import { ProjectNode } from '@/types/project-hierarchy';

// ID do Mega Project (troque depois por algo dinâmico)
const MEGA_PROJECT_ID = '00000000-0000-0000-0000-000000000001'; // placeholder

export const ProjectMindMap: React.FC = () => {
  const { data: nodes = [], isLoading } = useProjectHierarchy(MEGA_PROJECT_ID);
  const createNode = useCreateProjectNode();
  const createTask = useCreateTask();

  const [nodeDialogOpen, setNodeDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string>('');
  const [selectedNodeType, setSelectedNodeType] = useState<'module' | 'submodule'>('submodule');

  const handleAddChildClick = (parentId: string, type: 'module' | 'submodule') => {
    setSelectedParentId(parentId);
    setSelectedNodeType(type);
    setNodeDialogOpen(true);
  };

  const handleAddTaskClick = (nodeId: string) => {
    setSelectedParentId(nodeId);
    setTaskDialogOpen(true);
  };

  const handleCreateNode = async (name: string, description: string) => {
    await createNode.mutateAsync({
      mega_project_id: MEGA_PROJECT_ID,
      parent_id: selectedParentId || null,
      name,
      description: description || undefined,
      type: selectedNodeType,
    });
    setNodeDialogOpen(false);
  };

  const handleCreateTask = async (taskData: any) => {
    await createTask.mutateAsync({
      node_id: selectedParentId,
      title: taskData.name,
      description: taskData.description,
      assignee: taskData.assignee,
      due_date: taskData.deadline,
      priority: taskData.priority?.toLowerCase(),
    });
    setTaskDialogOpen(false);
  };

  if (isLoading) {
    return <div className="p-8 text-center">Carregando estrutura do projeto...</div>;
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between border-b px-6 py-4 bg-background/95 backdrop-blur">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">NexusAI Platform v2</h1>
          <p className="text-muted-foreground text-sm">Mind Map • Hierarchical Project Structure</p>
        </div>

        <Button onClick={() => handleAddChildClick(MEGA_PROJECT_ID, 'module')} className="gap-2">
          <Plus className="h-4 w-4" /> Add Module
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6 bg-muted/30">
        <div className="max-w-[1100px] mx-auto">
          {nodes.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              Nenhum módulo criado ainda. Clique em "Add Module" para começar.
            </div>
          )}

          {nodes.map((node) => (
            <ProjectNodeCard
              key={node.id}
              node={node}
              level={0}
              onAddChild={handleAddChildClick}
              onAddTask={handleAddTaskClick}
            />
          ))}
        </div>
      </div>

      <CreateNodeDialog
        open={nodeDialogOpen}
        onOpenChange={setNodeDialogOpen}
        nodeType={selectedNodeType}
        onCreate={handleCreateNode}
      />
      <CreateTaskDialog
        open={taskDialogOpen}
        onOpenChange={setTaskDialogOpen}
        onCreate={handleCreateTask}
      />
    </div>
  );
};

// ==================== NODE CARD (mesmo visual anterior) ====================
interface ProjectNodeCardProps {
  node: ProjectNode;
  level: number;
  onAddChild: (parentId: string, type: 'module' | 'submodule') => void;
  onAddTask: (nodeId: string) => void;
}

const ProjectNodeCard: React.FC<ProjectNodeCardProps> = ({ node, level, onAddChild, onAddTask }) => {
  const [isExpanded, setIsExpanded] = useState(level < 2);
  const progress = node.progress || 0;
  const waveColor = '#22c55e'; // verde por enquanto

  return (
    <div className={cn("ml-4", level > 0 && "border-l border-border/60 pl-4")}>
      <motion.div whileHover={{ scale: 1.005 }} className="group relative mb-3 rounded-2xl border bg-card p-5 shadow-sm">
        <ColorWave color={waveColor} intensity="medium" />

        <div className="relative flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <button onClick={() => setIsExpanded(!isExpanded)} className="flex h-6 w-6 items-center justify-center rounded-md hover:bg-muted">
                {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-lg tracking-tight">{node.name}</span>
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">{node.type}</span>
                </div>
                {node.description && <p className="text-sm text-muted-foreground mt-0.5">{node.description}</p>}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <div className="flex-1 max-w-[220px]">
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium tabular-nums">{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5"><Target className="h-4 w-4" />{node.tasks?.length || 0} tasks</div>
                <div className="flex items-center gap-1.5"><Users className="h-4 w-4" />{node.children?.length || 0} children</div>
              </div>
            </div>
          </div>

          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
            <Button variant="ghost" size="sm" onClick={() => onAddChild(node.id, 'submodule')} className="h-8 px-2 text-xs">
              <Plus className="h-3.5 w-3.5 mr-1" /> Sub
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onAddTask(node.id)} className="h-8 px-2 text-xs">
              <Plus className="h-3.5 w-3.5 mr-1" /> Task
            </Button>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {isExpanded && node.children?.map((child) => (
          <ProjectNodeCard key={child.id} node={child} level={level + 1} onAddChild={onAddChild} onAddTask={onAddTask} />
        ))}
      </AnimatePresence>
    </div>
  );
};